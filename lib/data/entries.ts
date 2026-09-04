import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lt, sql } from "drizzle-orm";

import { db, nowIso } from "../db";
import { uuidv7 } from "../ids";
import type { EntryScope } from "../permissions";
import { projects, timeEntries, users, type TimeEntry } from "../schema";
import type { Range } from "../time/periods";

export interface EntryRow extends TimeEntry {
  readonly projectName: string;
  readonly projectCode: string | null;
  readonly userName: string;
}

export interface EntryFilter {
  readonly range?: Range | null;
  readonly projectIds?: readonly string[];
  readonly userId?: string;
}

function scopeWhere(scope: EntryScope, filter: EntryFilter) {
  const conditions = [eq(timeEntries.organizationId, scope.organizationId), isNotNull(timeEntries.endedAt)];
  if (scope.userId !== undefined) conditions.push(eq(timeEntries.userId, scope.userId));
  if (filter.userId !== undefined) conditions.push(eq(timeEntries.userId, filter.userId));
  if (filter.range !== undefined && filter.range !== null) {
    conditions.push(gte(timeEntries.startedAt, filter.range.from.toISOString()));
    conditions.push(lt(timeEntries.startedAt, filter.range.to.toISOString()));
  }
  if (filter.projectIds !== undefined && filter.projectIds.length > 0) {
    conditions.push(inArray(timeEntries.projectId, [...filter.projectIds]));
  }
  return and(...conditions);
}

/** Abgeschlossene Einträge im Sichtbereich, neueste zuerst. */
export function listEntries(scope: EntryScope, filter: EntryFilter = {}): EntryRow[] {
  return db()
    .select({
      entry: timeEntries,
      projectName: projects.name,
      projectCode: projects.code,
      userName: users.name,
    })
    .from(timeEntries)
    .innerJoin(projects, eq(projects.id, timeEntries.projectId))
    .innerJoin(users, eq(users.id, timeEntries.userId))
    .where(scopeWhere(scope, filter))
    .orderBy(desc(timeEntries.startedAt))
    .all()
    .map((r) => ({ ...r.entry, projectName: r.projectName, projectCode: r.projectCode, userName: r.userName }));
}

/** Für Auswertungen: älteste zuerst. */
export function listEntriesAscending(scope: EntryScope, filter: EntryFilter = {}): EntryRow[] {
  return listEntries(scope, filter).reverse();
}

export function getEntry(organizationId: string, id: string): EntryRow | null {
  const r = db()
    .select({
      entry: timeEntries,
      projectName: projects.name,
      projectCode: projects.code,
      userName: users.name,
    })
    .from(timeEntries)
    .innerJoin(projects, eq(projects.id, timeEntries.projectId))
    .innerJoin(users, eq(users.id, timeEntries.userId))
    .where(and(eq(timeEntries.organizationId, organizationId), eq(timeEntries.id, id)))
    .get();
  return r === undefined ? null : { ...r.entry, projectName: r.projectName, projectCode: r.projectCode, userName: r.userName };
}

export interface RunningEntry {
  readonly id: string;
  readonly projectId: string;
  readonly projectName: string;
  readonly startedAt: string;
  readonly note: string | null;
}

export function runningEntry(userId: string): RunningEntry | null {
  const r = db()
    .select({
      id: timeEntries.id,
      projectId: timeEntries.projectId,
      projectName: projects.name,
      startedAt: timeEntries.startedAt,
      note: timeEntries.note,
    })
    .from(timeEntries)
    .innerJoin(projects, eq(projects.id, timeEntries.projectId))
    .where(and(eq(timeEntries.userId, userId), isNull(timeEntries.endedAt)))
    .get();
  return r ?? null;
}

/** Laufende Stoppuhren aller Mitglieder, für die Übersicht. */
export function runningEntries(organizationId: string): (RunningEntry & { readonly userName: string })[] {
  return db()
    .select({
      id: timeEntries.id,
      projectId: timeEntries.projectId,
      projectName: projects.name,
      startedAt: timeEntries.startedAt,
      note: timeEntries.note,
      userName: users.name,
    })
    .from(timeEntries)
    .innerJoin(projects, eq(projects.id, timeEntries.projectId))
    .innerJoin(users, eq(users.id, timeEntries.userId))
    .where(and(eq(timeEntries.organizationId, organizationId), isNull(timeEntries.endedAt)))
    .orderBy(asc(timeEntries.startedAt))
    .all();
}

function finish(entryId: string, now: Date): void {
  const row = db().select({ startedAt: timeEntries.startedAt }).from(timeEntries).where(eq(timeEntries.id, entryId)).get();
  if (row === undefined) return;
  const seconds = Math.max(0, Math.floor((now.getTime() - new Date(row.startedAt).getTime()) / 1000));
  db()
    .update(timeEntries)
    .set({ endedAt: now.toISOString(), durationSeconds: seconds, updatedAt: now.toISOString() })
    .where(eq(timeEntries.id, entryId))
    .run();
}

/** Startet die Stoppuhr; eine laufende wird zuvor beendet. */
export function startTimer(
  organizationId: string,
  userId: string,
  projectId: string,
  note: string | null,
  now: Date = new Date(),
): string {
  return db().transaction((tx) => {
    const running = tx
      .select({ id: timeEntries.id })
      .from(timeEntries)
      .where(and(eq(timeEntries.userId, userId), isNull(timeEntries.endedAt)))
      .get();
    if (running !== undefined) finish(running.id, now);

    const id = uuidv7();
    tx.insert(timeEntries)
      .values({
        id,
        organizationId,
        projectId,
        userId,
        startedAt: now.toISOString(),
        endedAt: null,
        durationSeconds: 0,
        note,
        source: "timer",
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      })
      .run();
    return id;
  });
}

/** Beendet die laufende Stoppuhr; Einträge unter einer Minute werden verworfen. */
export function stopTimer(userId: string, now: Date = new Date()): void {
  const running = runningEntry(userId);
  if (running === null) return;
  const seconds = Math.floor((now.getTime() - new Date(running.startedAt).getTime()) / 1000);
  if (seconds < 60) {
    db().delete(timeEntries).where(eq(timeEntries.id, running.id)).run();
    return;
  }
  finish(running.id, now);
}

export function updateRunningNote(userId: string, note: string | null): void {
  db()
    .update(timeEntries)
    .set({ note, updatedAt: nowIso() })
    .where(and(eq(timeEntries.userId, userId), isNull(timeEntries.endedAt)))
    .run();
}

export interface EntryInput {
  readonly projectId: string;
  readonly startedAt: Date;
  readonly endedAt: Date;
  readonly note: string | null;
}

export function createManualEntry(organizationId: string, userId: string, input: EntryInput): string {
  const id = uuidv7();
  const now = nowIso();
  db()
    .insert(timeEntries)
    .values({
      id,
      organizationId,
      projectId: input.projectId,
      userId,
      startedAt: input.startedAt.toISOString(),
      endedAt: input.endedAt.toISOString(),
      durationSeconds: Math.floor((input.endedAt.getTime() - input.startedAt.getTime()) / 1000),
      note: input.note,
      source: "manual",
      createdAt: now,
      updatedAt: now,
    })
    .run();
  return id;
}

export function updateEntry(organizationId: string, id: string, input: EntryInput): void {
  db()
    .update(timeEntries)
    .set({
      projectId: input.projectId,
      startedAt: input.startedAt.toISOString(),
      endedAt: input.endedAt.toISOString(),
      durationSeconds: Math.floor((input.endedAt.getTime() - input.startedAt.getTime()) / 1000),
      note: input.note,
      updatedAt: nowIso(),
    })
    .where(and(eq(timeEntries.organizationId, organizationId), eq(timeEntries.id, id)))
    .run();
}

export function deleteEntry(organizationId: string, id: string): void {
  db()
    .delete(timeEntries)
    .where(and(eq(timeEntries.organizationId, organizationId), eq(timeEntries.id, id)))
    .run();
}

/** Summe je Projekt für einen Zeitraum, ohne Einzelzeilen zu laden. */
export function totalsByProject(scope: EntryScope, filter: EntryFilter = {}): Map<string, number> {
  const rows = db()
    .select({ projectId: timeEntries.projectId, seconds: sql<number>`sum(${timeEntries.durationSeconds})` })
    .from(timeEntries)
    .where(scopeWhere(scope, filter))
    .groupBy(timeEntries.projectId)
    .all();
  return new Map(rows.map((r) => [r.projectId, Number(r.seconds)]));
}
