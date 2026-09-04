"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireOwner } from "@/lib/actor";
import { setPassword } from "@/lib/auth";
import {
  countOwners,
  createMember,
  getMember,
  renameOrganization,
  setMemberActive,
  setMemberRole,
  updateMemberName,
} from "@/lib/data/members";
import { field, type FormState } from "@/lib/forms";
import { ROLES } from "@/lib/schema";

const PASSWORD_MIN = 10;

const newMemberSchema = z.object({
  email: z.email("E-Mail-Adresse ist ungültig.").transform((s) => s.toLowerCase()),
  name: z.string().min(1, "Name fehlt.").max(120),
  password: z.string().min(PASSWORD_MIN, `Passwort braucht mindestens ${PASSWORD_MIN} Zeichen.`),
  role: z.enum(ROLES),
});

export async function createMemberAction(_prev: FormState, form: FormData): Promise<FormState> {
  const actor = await requireOwner();
  const parsed = newMemberSchema.safeParse({
    email: field(form, "email"),
    name: field(form, "name"),
    password: field(form, "password"),
    role: field(form, "role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Eingabe ungültig." };

  if (getMember(actor.organizationId, parsed.data.email) !== null) {
    return { error: "Diese Adresse ist bereits Mitglied." };
  }

  try {
    await createMember(actor.organizationId, parsed.data);
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    return {
      error: message.includes("already exists")
        ? "Diese Adresse ist bereits vergeben."
        : "Anlegen fehlgeschlagen.",
    };
  }
  revalidatePath("/verwaltung");
  return { ok: true };
}

export async function setRoleAction(_prev: FormState, form: FormData): Promise<FormState> {
  const actor = await requireOwner();
  const userId = field(form, "userId");
  const role = field(form, "role");
  if (!(ROLES as readonly string[]).includes(role)) return { error: "Rolle ungültig." };
  if (userId === actor.userId && role !== "owner")
    return { error: "Die eigene Owner-Rolle lässt sich nicht abgeben." };
  if (role !== "owner") {
    const member = getMember(actor.organizationId, userId);
    if (member?.role === "owner" && countOwners(actor.organizationId) <= 1) {
      return { error: "Mindestens ein Owner muss bleiben." };
    }
  }
  setMemberRole(actor.organizationId, userId, role as (typeof ROLES)[number]);
  revalidatePath("/verwaltung");
  return { ok: true };
}

export async function setPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const actor = await requireOwner();
  const userId = field(form, "userId");
  const password = field(form, "password");
  if (password.length < PASSWORD_MIN)
    return { error: `Passwort braucht mindestens ${PASSWORD_MIN} Zeichen.` };
  if (getMember(actor.organizationId, userId) === null)
    return { error: "Mitglied nicht gefunden." };
  await setPassword(userId, password);
  revalidatePath("/verwaltung");
  return { ok: true };
}

export async function setNameAction(_prev: FormState, form: FormData): Promise<FormState> {
  const actor = await requireOwner();
  const userId = field(form, "userId");
  const name = field(form, "name");
  if (name === "" || name.length > 120) return { error: "Name fehlt oder ist zu lang." };
  if (getMember(actor.organizationId, userId) === null)
    return { error: "Mitglied nicht gefunden." };
  updateMemberName(userId, name);
  revalidatePath("/verwaltung");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setActiveAction(_prev: FormState, form: FormData): Promise<FormState> {
  const actor = await requireOwner();
  const userId = field(form, "userId");
  const active = field(form, "active") === "1";
  if (userId === actor.userId) return { error: "Das eigene Konto lässt sich nicht deaktivieren." };
  const member = getMember(actor.organizationId, userId);
  if (member === null) return { error: "Mitglied nicht gefunden." };
  if (!active && member.role === "owner" && countOwners(actor.organizationId) <= 1) {
    return { error: "Mindestens ein Owner muss aktiv bleiben." };
  }
  await setMemberActive(userId, active);
  revalidatePath("/verwaltung");
  return { ok: true };
}

export async function renameOrganizationAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await requireOwner();
  const name = field(form, "name");
  if (name === "" || name.length > 120) return { error: "Name fehlt oder ist zu lang." };
  renameOrganization(actor.organizationId, name);
  revalidatePath("/", "layout");
  return { ok: true };
}
