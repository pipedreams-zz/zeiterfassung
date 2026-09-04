"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { ORG_COOKIE, requireOwner } from "@/lib/actor";
import { setPassword } from "@/lib/auth";
import {
  countOwners,
  createMember,
  createOrganization,
  findUserByEmail,
  getMember,
  listUserOrganizations,
  removeMembership,
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
  password: z.string(),
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

  const existing = findUserByEmail(parsed.data.email);
  if (existing !== null && getMember(actor.organizationId, existing.id) !== null) {
    return { error: "Diese Adresse ist bereits Mitglied." };
  }
  if (existing === null && parsed.data.password.length < PASSWORD_MIN) {
    return { error: `Neues Konto: Passwort braucht mindestens ${PASSWORD_MIN} Zeichen.` };
  }

  try {
    await createMember(actor.organizationId, {
      ...parsed.data,
      password: existing === null ? parsed.data.password : null,
    });
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

export async function createOrganizationAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const actor = await requireOwner();
  const name = field(form, "name");
  if (name === "" || name.length > 120) return { error: "Name fehlt oder ist zu lang." };
  if (
    listUserOrganizations(actor.userId).some((o) => o.name.toLowerCase() === name.toLowerCase())
  ) {
    return { error: "Eine Organisation mit diesem Namen gibt es bereits." };
  }
  const id = createOrganization(name, actor.userId);
  (await cookies()).set(ORG_COOKIE, id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
  redirect("/verwaltung");
}

export async function removeMemberAction(_prev: FormState, form: FormData): Promise<FormState> {
  const actor = await requireOwner();
  const userId = field(form, "userId");
  if (userId === actor.userId)
    return { error: "Die eigene Mitgliedschaft lässt sich hier nicht entfernen." };
  const member = getMember(actor.organizationId, userId);
  if (member === null) return { error: "Mitglied nicht gefunden." };
  if (member.role === "owner" && countOwners(actor.organizationId) <= 1) {
    return { error: "Mindestens ein Owner muss bleiben." };
  }
  removeMembership(actor.organizationId, userId);
  revalidatePath("/verwaltung");
  return { ok: true };
}
