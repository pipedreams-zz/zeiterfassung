"use client";

import { useActionState, useState } from "react";

import { Chip, COMPACT_ACTION, FIELD, SECONDARY_ACTION, SELECT } from "@/components/chrome";
import { FormMessage, SubmitButton } from "@/components/form";
import type { Member } from "@/lib/data/members";
import { INITIAL_FORM } from "@/lib/forms";
import { ROLES } from "@/lib/schema";

import {
  removeMemberAction,
  setActiveAction,
  setNameAction,
  setPasswordAction,
  setRoleAction,
} from "./actions";

const ROLE_LABEL: Record<(typeof ROLES)[number], string> = {
  owner: "Owner",
  member: "Mitarbeiter",
};

export function MemberRow({ member, self }: { readonly member: Member; readonly self: boolean }) {
  const [open, setOpen] = useState(false);
  const [roleState, roleAction] = useActionState(setRoleAction, INITIAL_FORM);
  const [nameState, nameAction] = useActionState(setNameAction, INITIAL_FORM);
  const [pwState, pwAction] = useActionState(setPasswordAction, INITIAL_FORM);
  const [activeState, activeAction] = useActionState(setActiveAction, INITIAL_FORM);
  const [removeState, removeAction] = useActionState(removeMemberAction, INITIAL_FORM);

  return (
    <li className={`bg-panel ${member.active ? "" : "text-ink-off"}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-[14px]">
        <div className="flex min-w-0 flex-col">
          <span className={`truncate text-ui ${member.active ? "text-ink-1" : "text-ink-off"}`}>
            {member.name}
            {self ? <span className="text-meta text-ink-3"> · du</span> : null}
          </span>
          <span className="truncate text-meta text-ink-3">{member.email}</span>
        </div>
        <div className="flex items-center gap-3">
          <Chip tone={member.active ? "normal" : "empty"}>
            {member.active ? ROLE_LABEL[member.role] : "⊘ Deaktiviert"}
          </Chip>
          <button
            className={COMPACT_ACTION}
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "Schließen" : "Bearbeiten"}
          </button>
        </div>
      </div>

      {open ? (
        <div className="grid gap-[14px] border-t border-line-soft bg-raised px-4 py-[14px] md:grid-cols-2">
          <form action={nameAction} className="flex flex-col gap-2">
            <input type="hidden" name="userId" value={member.userId} />
            <span className="text-meta tracking-[0.14em] text-ink-3 uppercase">Name</span>
            <div className="flex gap-2">
              <input
                className={FIELD}
                name="name"
                defaultValue={member.name}
                required
                maxLength={120}
              />
              <SubmitButton secondary pendingLabel="…">
                Speichern
              </SubmitButton>
            </div>
            <FormMessage state={nameState} />
          </form>

          <form action={roleAction} className="flex flex-col gap-2">
            <input type="hidden" name="userId" value={member.userId} />
            <span className="text-meta tracking-[0.14em] text-ink-3 uppercase">Rolle</span>
            <div className="flex gap-2">
              <select className={SELECT} name="role" defaultValue={member.role} disabled={self}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
              <SubmitButton secondary pendingLabel="…">
                Speichern
              </SubmitButton>
            </div>
            <FormMessage state={roleState} />
          </form>

          <form action={pwAction} className="flex flex-col gap-2">
            <input type="hidden" name="userId" value={member.userId} />
            <span className="text-meta tracking-[0.14em] text-ink-3 uppercase">Neues Passwort</span>
            <div className="flex gap-2">
              <input
                className={FIELD}
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={10}
                required
              />
              <SubmitButton secondary pendingLabel="…">
                Setzen
              </SubmitButton>
            </div>
            {pwState?.ok === true ? (
              <span className="text-meta text-ink-2" role="status">
                Passwort gesetzt, bestehende Sitzungen beendet.
              </span>
            ) : null}
            <FormMessage state={pwState} />
          </form>

          <form action={activeAction} className="flex flex-col gap-2">
            <input type="hidden" name="userId" value={member.userId} />
            <input type="hidden" name="active" value={member.active ? "0" : "1"} />
            <span className="text-meta tracking-[0.14em] text-ink-3 uppercase">Konto</span>
            <div>
              <button className={SECONDARY_ACTION} type="submit" disabled={self}>
                {member.active ? "Deaktivieren" : "Aktivieren"}
              </button>
            </div>
            <span className="text-meta text-ink-3">
              Deaktivierte Konten können sich nicht anmelden; ihre Zeiten bleiben erhalten.
            </span>
            <FormMessage state={activeState} />
          </form>

          <form
            action={removeAction}
            className="flex flex-col gap-2 md:col-span-2"
            onSubmit={(e) => {
              if (!window.confirm(`${member.name} aus dieser Organisation entfernen?`))
                e.preventDefault();
            }}
          >
            <input type="hidden" name="userId" value={member.userId} />
            <span className="text-meta tracking-[0.14em] text-ink-3 uppercase">Mitgliedschaft</span>
            <div>
              <button className={SECONDARY_ACTION} type="submit" disabled={self}>
                Aus Organisation entfernen
              </button>
            </div>
            <span className="text-meta text-ink-3">
              Das Konto bleibt bestehen und kann in anderen Organisationen weiter genutzt werden;
              gebuchte Zeiten bleiben hier erhalten.
            </span>
            <FormMessage state={removeState} />
          </form>
        </div>
      ) : null}
    </li>
  );
}
