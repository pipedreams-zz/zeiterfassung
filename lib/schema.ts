import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/*
 * Tabellen von Better Auth (Pluralnamen, Felder wie vom Framework verlangt)
 * und die Fachtabellen der Zeiterfassung.
 *
 * Zeitpunkte der Fachtabellen sind ISO-8601-Text in UTC — sortierbar, lesbar
 * und ohne Umrechnung im SQL. Die Auth-Tabellen halten Millisekunden als
 * Ganzzahl, weil der Adapter mit `Date` arbeitet.
 */

export const users = sqliteTable("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text(),
  /** Deaktivierte Konten können sich nicht anmelden; ihre Zeiten bleiben. */
  active: integer({ mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    id: text().primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text().notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const accounts = sqliteTable(
  "accounts",
  {
    id: text().primaryKey(),
    issuer: text().notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
    scope: text(),
    password: text(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("accounts_user_idx").on(t.userId)],
);

export const verifications = sqliteTable(
  "verifications",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

/* ── Fachtabellen ──────────────────────────────────────────────────────── */

export const ROLES = ["owner", "member"] as const;
export type Role = (typeof ROLES)[number];

export const organizations = sqliteTable("organizations", {
  id: text().primaryKey(),
  name: text().notNull(),
  createdAt: text("created_at").notNull(),
});

export const memberships = sqliteTable(
  "memberships",
  {
    id: text().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    role: text({ enum: ROLES }).notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [uniqueIndex("memberships_user_org_unique").on(t.userId, t.organizationId)],
);

export const projects = sqliteTable(
  "projects",
  {
    id: text().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text().notNull(),
    /** Kurzes Kürzel für Listen und PDF, etwa „RTX-12". */
    code: text(),
    description: text(),
    archivedAt: text("archived_at"),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("projects_org_idx").on(t.organizationId, t.archivedAt)],
);

export const ENTRY_SOURCES = ["timer", "manual"] as const;
export type EntrySource = (typeof ENTRY_SOURCES)[number];

export const timeEntries = sqliteTable(
  "time_entries",
  {
    id: text().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "restrict" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    startedAt: text("started_at").notNull(),
    /** NULL, solange die Stoppuhr läuft. */
    endedAt: text("ended_at"),
    /** 0, solange die Stoppuhr läuft; danach die abgerechnete Dauer. */
    durationSeconds: integer("duration_seconds").notNull().default(0),
    note: text(),
    source: text({ enum: ENTRY_SOURCES }).notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    index("time_entries_org_started_idx").on(t.organizationId, t.startedAt),
    index("time_entries_user_started_idx").on(t.userId, t.startedAt),
    index("time_entries_project_idx").on(t.projectId),
    /** Höchstens eine laufende Stoppuhr je Benutzer. */
    uniqueIndex("time_entries_running_per_user")
      .on(t.userId)
      .where(sql`ended_at IS NULL`),
  ],
);

export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type TimeEntry = typeof timeEntries.$inferSelect;
