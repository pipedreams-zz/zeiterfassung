import type { Role } from "./schema";

export interface Actor {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly role: Role;
}

/**
 * Die eine Stelle für Rechtefragen. Jede Abfrage von Zeiten läuft durch
 * `entryScope`; eine spätere Einschränkung („Mitarbeiter sehen nur eigene
 * Zeiten") ändert genau diese Funktion und ihren Test.
 */
export interface EntryScope {
  readonly organizationId: string;
  /** Gesetzt, wenn nur die eigenen Einträge sichtbar sind. */
  readonly userId?: string;
}

export function entryScope(actor: Actor): EntryScope {
  // MVP-Entscheidung: alle Mitglieder einer Organisation sehen alle Zeiten.
  return { organizationId: actor.organizationId };
}

export function canManageUsers(actor: Actor): boolean {
  return actor.role === "owner";
}

export function canArchiveProjects(actor: Actor): boolean {
  return actor.role === "owner";
}

export function canEditEntry(actor: Actor, entry: { readonly userId: string }): boolean {
  return entry.userId === actor.userId || actor.role === "owner";
}
