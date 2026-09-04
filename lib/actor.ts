import { asc, eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "./auth";
import { db } from "./db";
import { canManageUsers, type Actor } from "./permissions";
import { memberships, organizations } from "./schema";

export type { Actor } from "./permissions";

export const ORG_COOKIE = "org";

/**
 * Session lesen und zur aktiven Mitgliedschaft auflösen: die im Cookie
 * gewählte Organisation, sonst die älteste Mitgliedschaft. Null ohne Anmeldung.
 */
export async function getActor(): Promise<Actor | null> {
  const session = await auth().api.getSession({ headers: await headers() });
  if (session === null || !session.user.active) return null;

  const all = db()
    .select({
      organizationId: memberships.organizationId,
      organizationName: organizations.name,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(organizations, eq(organizations.id, memberships.organizationId))
    .where(eq(memberships.userId, session.user.id))
    .orderBy(asc(memberships.createdAt))
    .all();

  const chosen = (await cookies()).get(ORG_COOKIE)?.value;
  const membership = all.find((m) => m.organizationId === chosen) ?? all[0];
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
