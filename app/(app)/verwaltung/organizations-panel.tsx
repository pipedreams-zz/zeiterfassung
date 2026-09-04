"use client";

import { useActionState } from "react";

import { Chip, FIELD } from "@/components/chrome";
import { FormMessage, SubmitButton } from "@/components/form";
import type { UserOrganization } from "@/lib/data/members";
import { INITIAL_FORM } from "@/lib/forms";

import { switchOrganizationAction } from "../actions";
import { createOrganizationAction } from "./actions";

const ROLE_LABEL = { owner: "Owner", member: "Mitarbeiter" } as const;

export function OrganizationsPanel({
  organizations,
  activeId,
}: {
  readonly organizations: readonly UserOrganization[];
  readonly activeId: string;
}) {
  const [state, action] = useActionState(createOrganizationAction, INITIAL_FORM);

  return (
    <>
      <ul className="flex flex-col gap-px bg-line-soft">
        {organizations.map((o) => (
          <li
            key={o.id}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 bg-panel px-4 py-[11px]"
          >
            <span className="flex min-w-0 items-baseline gap-3">
              <span
                className={`truncate text-ui ${o.id === activeId ? "text-ink-1" : "text-ink-2"}`}
              >
                {o.name}
              </span>
              <span className="text-meta text-ink-3">
                {o.memberCount} {o.memberCount === 1 ? "Mitglied" : "Mitglieder"}
              </span>
            </span>
            <span className="flex items-center gap-3">
              <Chip tone={o.id === activeId ? "selected" : "normal"}>
                {o.id === activeId ? "◆ Aktiv" : ROLE_LABEL[o.role]}
              </Chip>
              {o.id === activeId ? null : (
                <form action={switchOrganizationAction}>
                  <input type="hidden" name="organizationId" value={o.id} />
                  <SubmitButton secondary pendingLabel="…" className="min-h-[28px]">
                    Wechseln
                  </SubmitButton>
                </form>
              )}
            </span>
          </li>
        ))}
      </ul>
      <form
        action={action}
        className="flex flex-col gap-2 border-t border-line-soft px-4 py-[14px]"
      >
        <span className="text-meta tracking-[0.14em] text-ink-3 uppercase">Neue Organisation</span>
        <div className="flex gap-2">
          <input className={FIELD} name="name" placeholder="Name" required maxLength={120} />
          <SubmitButton secondary pendingLabel="…">
            Anlegen
          </SubmitButton>
        </div>
        <span className="text-meta text-ink-3">
          Du wirst Owner der neuen Organisation und wechselst direkt dorthin. Mitglieder ordnest du
          danach über „Neues Mitglied" zu.
        </span>
        <FormMessage state={state} />
      </form>
    </>
  );
}
