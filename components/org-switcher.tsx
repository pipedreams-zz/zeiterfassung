"use client";

import { useRef } from "react";

import { switchOrganizationAction } from "@/app/(app)/actions";

export interface OrgOption {
  readonly id: string;
  readonly name: string;
}

/**
 * Auswahl der aktiven Organisation in der Kopfleiste. Bei nur einer
 * Mitgliedschaft steht der Name als Text.
 */
export function OrgSwitcher({
  organizations,
  activeId,
}: {
  readonly organizations: readonly OrgOption[];
  readonly activeId: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const active = organizations.find((o) => o.id === activeId);

  if (organizations.length <= 1) {
    return <span className="truncate text-ui text-ink-2">{active?.name}</span>;
  }

  return (
    <form ref={formRef} action={switchOrganizationAction}>
      <select
        name="organizationId"
        aria-label="Organisation"
        className="min-h-[28px] max-w-[220px] cursor-pointer truncate border border-line-strong bg-bar py-0 pr-7 pl-2 text-ui text-ink-2 hover:text-ink-1"
        value={activeId}
        onChange={() => formRef.current?.requestSubmit()}
      >
        {organizations.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </form>
  );
}
