import { describe, expect, it } from "vitest";

import {
  canArchiveProjects,
  canEditEntry,
  canManageUsers,
  canSeeAllEntries,
  entryScope,
  type Actor,
} from "./permissions";

const base = {
  email: "a@example.com",
  name: "A",
  organizationId: "org-1",
  organizationName: "Org",
};
const owner: Actor = { ...base, userId: "u-owner", role: "owner" };
const member: Actor = { ...base, userId: "u-member", role: "member" };

describe("entryScope", () => {
  it("Owner sehen die gesamte Organisation", () => {
    expect(entryScope(owner)).toEqual({ organizationId: "org-1" });
    expect(canSeeAllEntries(owner)).toBe(true);
  });

  it("Mitarbeiter sehen nur eigene Zeiten", () => {
    expect(entryScope(member)).toEqual({ organizationId: "org-1", userId: "u-member" });
    expect(canSeeAllEntries(member)).toBe(false);
  });
});

describe("Rollen", () => {
  it("nur der Owner verwaltet Benutzer und archiviert Projekte", () => {
    expect(canManageUsers(owner)).toBe(true);
    expect(canManageUsers(member)).toBe(false);
    expect(canArchiveProjects(member)).toBe(false);
  });

  it("Einträge bearbeitet der Urheber oder der Owner", () => {
    expect(canEditEntry(member, { userId: "u-member" })).toBe(true);
    expect(canEditEntry(member, { userId: "u-other" })).toBe(false);
    expect(canEditEntry(owner, { userId: "u-other" })).toBe(true);
  });
});
