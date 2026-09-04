"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireActor } from "@/lib/actor";
import {
  createProject,
  deleteProjectIfEmpty,
  getProject,
  setProjectArchived,
  updateProject,
} from "@/lib/data/projects";
import { field, type FormState } from "@/lib/forms";
import { canArchiveProjects } from "@/lib/permissions";

const projectSchema = z.object({
  name: z.string().min(1, "Name fehlt.").max(120, "Name ist zu lang."),
  code: z
    .string()
    .max(20, "Kürzel ist zu lang.")
    .transform((s) => (s === "" ? null : s)),
  description: z
    .string()
    .max(2000)
    .transform((s) => (s === "" ? null : s)),
});

function parse(form: FormData) {
  return projectSchema.safeParse({
    name: field(form, "name"),
    code: field(form, "code"),
    description: field(form, "description"),
  });
}

export async function createProjectAction(_prev: FormState, form: FormData): Promise<FormState> {
  const actor = await requireActor();
  const parsed = parse(form);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Eingabe ungültig." };

  createProject(actor.organizationId, actor.userId, parsed.data);
  revalidatePath("/projekte");
  return { ok: true };
}

export async function updateProjectAction(
  id: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await requireActor();
  const parsed = parse(form);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Eingabe ungültig." };
  if (getProject(actor.organizationId, id) === null) return { error: "Projekt nicht gefunden." };

  updateProject(actor.organizationId, id, parsed.data);
  revalidatePath("/projekte");
  revalidatePath(`/projekte/${id}`);
  return { ok: true };
}

export async function setArchivedAction(form: FormData): Promise<void> {
  const actor = await requireActor();
  if (!canArchiveProjects(actor)) return;
  const id = field(form, "id");
  const archived = field(form, "archived") === "1";
  setProjectArchived(actor.organizationId, id, archived);
  revalidatePath("/projekte");
  revalidatePath(`/projekte/${id}`);
  redirect(archived ? "/projekte?archiv=1" : "/projekte");
}

export async function deleteProjectAction(form: FormData): Promise<void> {
  const actor = await requireActor();
  if (!canArchiveProjects(actor)) return;
  const id = field(form, "id");
  const deleted = deleteProjectIfEmpty(actor.organizationId, id);
  revalidatePath("/projekte");
  redirect(deleted ? "/projekte" : `/projekte/${id}?fehler=buchungen`);
}
