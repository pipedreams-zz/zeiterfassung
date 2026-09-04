import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";

import { db, nowIso } from "../db";
import { uuidv7 } from "../ids";
import { projects, timeEntries, type Project } from "../schema";

export interface ProjectWithTotals extends Project {
  readonly totalSeconds: number;
  readonly entryCount: number;
}

export function listProjects(
  organizationId: string,
  { archived = false }: { readonly archived?: boolean } = {},
): ProjectWithTotals[] {
  const rows = db()
    .select({
      project: projects,
      totalSeconds: sql<number>`coalesce(sum(${timeEntries.durationSeconds}), 0)`,
      entryCount: sql<number>`count(${timeEntries.id})`,
    })
    .from(projects)
    .leftJoin(timeEntries, eq(timeEntries.projectId, projects.id))
    .where(
      and(
        eq(projects.organizationId, organizationId),
        archived ? sql`${projects.archivedAt} IS NOT NULL` : isNull(projects.archivedAt),
      ),
    )
    .groupBy(projects.id)
    .orderBy(archived ? desc(projects.archivedAt) : asc(projects.name))
    .all();

  return rows.map((r) => ({
    ...r.project,
    totalSeconds: Number(r.totalSeconds),
    entryCount: Number(r.entryCount),
  }));
}

/** Aktive Projekte als Auswahlliste, alphabetisch. */
export function projectOptions(organizationId: string): { id: string; name: string; code: string | null }[] {
  return db()
    .select({ id: projects.id, name: projects.name, code: projects.code })
    .from(projects)
    .where(and(eq(projects.organizationId, organizationId), isNull(projects.archivedAt)))
    .orderBy(asc(projects.name))
    .all();
}

export function allProjectOptions(organizationId: string): { id: string; name: string; code: string | null; archived: boolean }[] {
  return db()
    .select({ id: projects.id, name: projects.name, code: projects.code, archivedAt: projects.archivedAt })
    .from(projects)
    .where(eq(projects.organizationId, organizationId))
    .orderBy(asc(projects.archivedAt), asc(projects.name))
    .all()
    .map((p) => ({ id: p.id, name: p.name, code: p.code, archived: p.archivedAt !== null }));
}

export function getProject(organizationId: string, id: string): ProjectWithTotals | null {
  const row = db()
    .select({
      project: projects,
      totalSeconds: sql<number>`coalesce(sum(${timeEntries.durationSeconds}), 0)`,
      entryCount: sql<number>`count(${timeEntries.id})`,
    })
    .from(projects)
    .leftJoin(timeEntries, eq(timeEntries.projectId, projects.id))
    .where(and(eq(projects.organizationId, organizationId), eq(projects.id, id)))
    .groupBy(projects.id)
    .get();
  if (row === undefined) return null;
  return { ...row.project, totalSeconds: Number(row.totalSeconds), entryCount: Number(row.entryCount) };
}

export interface ProjectInput {
  readonly name: string;
  readonly code: string | null;
  readonly description: string | null;
}

export function createProject(organizationId: string, createdBy: string, input: ProjectInput): string {
  const id = uuidv7();
  const now = nowIso();
  db()
    .insert(projects)
    .values({ id, organizationId, createdBy, ...input, createdAt: now, updatedAt: now })
    .run();
  return id;
}

export function updateProject(organizationId: string, id: string, input: ProjectInput): void {
  db()
    .update(projects)
    .set({ ...input, updatedAt: nowIso() })
    .where(and(eq(projects.organizationId, organizationId), eq(projects.id, id)))
    .run();
}

export function setProjectArchived(organizationId: string, id: string, archived: boolean): void {
  db()
    .update(projects)
    .set({ archivedAt: archived ? nowIso() : null, updatedAt: nowIso() })
    .where(and(eq(projects.organizationId, organizationId), eq(projects.id, id)))
    .run();
}

/** Löschen nur ohne Buchungen; sonst archivieren. */
export function deleteProjectIfEmpty(organizationId: string, id: string): boolean {
  const count = db()
    .select({ n: sql<number>`count(*)` })
    .from(timeEntries)
    .where(eq(timeEntries.projectId, id))
    .get()?.n;
  if (Number(count) > 0) return false;
  db()
    .delete(projects)
    .where(and(eq(projects.organizationId, organizationId), eq(projects.id, id)))
    .run();
  return true;
}
