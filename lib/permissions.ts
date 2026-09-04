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
 * `entryScope`: Owner sehen alle Zeiten der Organisation, Mitarbeiter nur
 * ihre eigenen.
 */
export interface EntryScope {
  readonly organizationId: string;
  /** Gesetzt, wenn nur die eigenen Einträge sichtbar sind. */
  readonly userId?: string;
}

export function canSeeAllEntries(actor: Actor): boolean {
  return actor.role === "owner";
}

export function entryScope(actor: Actor): EntryScope {
  return canSeeAllEntries(actor)
    ? { organizationId: actor.organizationId }
    : { organizationId: actor.organizationId, userId: actor.userId };
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
