import { asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";
import { db } from "./db";
import { canManageUsers, type Actor } from "./permissions";
import { memberships, organizations } from "./schema";

export type { Actor } from "./permissions";

/** Session lesen und zur ersten Mitgliedschaft auflösen; null ohne Anmeldung. */
export async function getActor(): Promise<Actor | null> {
  const session = await auth().api.getSession({ headers: await headers() });
  if (session === null || !session.user.active) return null;

  const membership = db()
    .select({
      organizationId: memberships.organizationId,
      organizationName: organizations.name,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(organizations, eq(organizations.id, memberships.organizationId))
    .where(eq(memberships.userId, session.user.id))
    .orderBy(asc(memberships.createdAt))
    .limit(1)
    .get();

  if (membership === undefined) return null;

  return {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    organizationId: membership.organizationId,
    organizationName: membership.organizationName,
    role: membership.role,
  };
}

export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (actor === null) redirect("/login");
  return actor;
}

export async function requireOwner(): Promise<Actor> {
  const actor = await requireActor();
  if (!canManageUsers(actor)) redirect("/");
  return actor;
}
