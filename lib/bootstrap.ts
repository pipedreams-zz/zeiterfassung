import { count } from "drizzle-orm";

import { internalAuth } from "./auth";
import { db, nowIso, runMigrations } from "./db";
import { env } from "./env";
import { uuidv7 } from "./ids";
import { memberships, organizations, users } from "./schema";

let done: Promise<void> | undefined;

/**
 * Beim Serverstart: Migrationen anwenden und, falls die Datenbank noch keinen
 * Benutzer kennt, Organisation und ersten Owner aus `BOOTSTRAP_*` anlegen.
 * Ein zweiter Lauf ändert nichts.
 */
export function bootstrap(): Promise<void> {
  done ??= run();
  return done;
}

async function run(): Promise<void> {
  runMigrations();

  const existing = db().select({ n: count() }).from(users).get()?.n ?? 0;
  if (existing > 0) return;

  const b = env.bootstrap();
  if (b.email === "" || b.password === "" || b.organization === "") {
    console.warn(
      "[bootstrap] Keine Benutzer vorhanden und BOOTSTRAP_ORGANIZATION / BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD nicht gesetzt — Anmeldung ist nicht möglich.",
    );
    return;
  }

  const organizationId = uuidv7();
  db()
    .insert(organizations)
    .values({ id: organizationId, name: b.organization, createdAt: nowIso() })
    .run();

  const result = await internalAuth().api.signUpEmail({
    body: { email: b.email, password: b.password, name: b.name || b.email },
  });

  db()
    .insert(memberships)
    .values({
      id: uuidv7(),
      userId: result.user.id,
      organizationId,
      role: "owner",
      createdAt: nowIso(),
    })
    .run();

  console.info(`[bootstrap] Organisation „${b.organization}" und Owner ${b.email} angelegt.`);
}
