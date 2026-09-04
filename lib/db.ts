import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { env } from "./env";
import * as schema from "./schema";

export type Db = BetterSQLite3Database<typeof schema>;

/* Eine Verbindung je Prozess; überlebt in der Entwicklung das Neuladen. */
const store = globalThis as unknown as { __zeiterfassungDb?: Db };

export function db(): Db {
  if (store.__zeiterfassungDb === undefined) {
    const path = resolve(env.databasePath());
    mkdirSync(dirname(path), { recursive: true });

    const sqlite = new Database(path);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    sqlite.pragma("busy_timeout = 5000");

    store.__zeiterfassungDb = drizzle(sqlite, { schema });
  }
  return store.__zeiterfassungDb;
}

/** Wendet die Migrationen aus `./drizzle` an; wiederholbar. */
export function runMigrations(): void {
  migrate(db(), { migrationsFolder: resolve(process.cwd(), "drizzle") });
}

export function nowIso(): string {
  return new Date().toISOString();
}
