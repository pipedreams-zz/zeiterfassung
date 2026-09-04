"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireActor } from "@/lib/actor";
import {
  createManualEntry,
  deleteEntry,
  getEntry,
  startTimer,
  stopTimer,
  updateEntry,
  updateRunningNote,
} from "@/lib/data/entries";
import { parseEntry } from "@/lib/data/entry-input";
import { projectOptions } from "@/lib/data/projects";
import { env } from "@/lib/env";
import { field, type FormState } from "@/lib/forms";
import { canEditEntry } from "@/lib/permissions";

function refresh() {
  revalidatePath("/", "layout");
}

export async function startTimerAction(form: FormData): Promise<void> {
  const actor = await requireActor();
  const projectId = field(form, "projectId");
  const note = field(form, "note");
  if (!projectOptions(actor.organizationId).some((p) => p.id === projectId)) return;
  startTimer(actor.organizationId, actor.userId, projectId, note === "" ? null : note);
  refresh();
}

export async function stopTimerAction(): Promise<void> {
  const actor = await requireActor();
  stopTimer(actor.userId);
  refresh();
}

export async function runningNoteAction(form: FormData): Promise<void> {
  const actor = await requireActor();
  const note = field(form, "note");
  updateRunningNote(actor.userId, note === "" ? null : note);
  refresh();
}

function readValues(form: FormData) {
  return {
    projectId: field(form, "projectId"),
    day: field(form, "day"),
    from: field(form, "from"),
    to: field(form, "to"),
    duration: field(form, "duration"),
    note: field(form, "note"),
  };
}

export async function createEntryAction(_prev: FormState, form: FormData): Promise<FormState> {
  const actor = await requireActor();
  const parsed = parseEntry(readValues(form), env.timezone());
  if (!parsed.ok) return { error: parsed.error };
  if (!projectOptions(actor.organizationId).some((p) => p.id === parsed.input.projectId)) {
    return { error: "Projekt ist nicht verfügbar." };
  }
  createManualEntry(actor.organizationId, actor.userId, parsed.input);
  refresh();
  return { ok: true };
}

export async function updateEntryAction(
  id: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await requireActor();
  const entry = getEntry(actor.organizationId, id);
  if (entry === null) return { error: "Eintrag nicht gefunden." };
  if (!canEditEntry(actor, entry)) return { error: "Keine Berechtigung." };
  const parsed = parseEntry(readValues(form), env.timezone());
  if (!parsed.ok) return { error: parsed.error };
  updateEntry(actor.organizationId, id, parsed.input);
  refresh();
  return { ok: true };
}

export async function deleteEntryAction(form: FormData): Promise<void> {
  const actor = await requireActor();
  const id = field(form, "id");
  const back = field(form, "back") || "/zeiten";
  const entry = getEntry(actor.organizationId, id);
  if (entry !== null && canEditEntry(actor, entry)) deleteEntry(actor.organizationId, id);
  refresh();
  redirect(back.startsWith("/") ? back : "/zeiten");
}
