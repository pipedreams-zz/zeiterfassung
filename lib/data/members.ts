import { and, asc, eq } from "drizzle-orm";

import { internalAuth, revokeSessions } from "../auth";
import { db, nowIso } from "../db";
import { uuidv7 } from "../ids";
import { memberships, organizations, users, type Role } from "../schema";

export interface Member {
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly active: boolean;
  readonly role: Role;
  readonly since: string;
}

export function listMembers(organizationId: string): Member[] {
  return db()
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      active: users.active,
      role: memberships.role,
      since: memberships.createdAt,
    })
    .from(memberships)
    .innerJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.organizationId, organizationId))
    .orderBy(asc(users.name))
    .all();
}

export function memberOptions(organizationId: string): { id: string; name: string }[] {
  return listMembers(organizationId).map((m) => ({ id: m.userId, name: m.name }));
}

export function getMember(organizationId: string, userId: string): Member | null {
  return listMembers(organizationId).find((m) => m.userId === userId) ?? null;
}

export function countOwners(organizationId: string): number {
  return listMembers(organizationId).filter((m) => m.role === "owner" && m.active).length;
}

export async function createMember(
  organizationId: string,
  input: { readonly email: string; readonly name: string; readonly password: string; readonly role: Role },
): Promise<string> {
  const existing = db().select({ id: users.id }).from(users).where(eq(users.email, input.email)).get();

  let userId: string;
  if (existing === undefined) {
    const result = await internalAuth().api.signUpEmail({
      body: { email: input.email, password: input.password, name: input.name },
    });
    userId = result.user.id;
  } else {
    userId = existing.id;
  }

  const member = db()
    .select({ id: memberships.id })
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, organizationId)))
    .get();
  if (member === undefined) {
    db()
      .insert(memberships)
      .values({ id: uuidv7(), userId, organizationId, role: input.role, createdAt: nowIso() })
      .run();
  }
  return userId;
}

export function setMemberRole(organizationId: string, userId: string, role: Role): void {
  db()
    .update(memberships)
    .set({ role })
    .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, organizationId)))
    .run();
}

export async function setMemberActive(userId: string, active: boolean): Promise<void> {
  db()
    .update(users)
    .set({ active, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .run();
  if (!active) await revokeSessions(userId);
}

export function updateMemberName(userId: string, name: string): void {
  db().update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, userId)).run();
}

export function renameOrganization(organizationId: string, name: string): void {
  db().update(organizations).set({ name }).where(eq(organizations.id, organizationId)).run();
}
