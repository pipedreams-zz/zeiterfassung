"use client";

import { useActionState, useEffect, useState } from "react";

import { FIELD, SELECT } from "@/components/chrome";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { INITIAL_FORM } from "@/lib/forms";

import { createMemberAction } from "./actions";

const EMPTY = { name: "", email: "", password: "", role: "member" };

export function NewMemberForm() {
  const [state, action] = useActionState(createMemberAction, INITIAL_FORM);
  const [v, setV] = useState(EMPTY);

  useEffect(() => {
    if (state?.ok === true) setV(EMPTY);
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-[14px]" autoComplete="off">
      <Field label="Name">
        <input
          className={FIELD}
          name="name"
          required
          maxLength={120}
          value={v.name}
          onChange={(e) => setV({ ...v, name: e.target.value })}
        />
      </Field>
      <Field label="E-Mail-Adresse">
        <input
          className={FIELD}
          name="email"
          type="email"
          required
          autoComplete="off"
          value={v.email}
          onChange={(e) => setV({ ...v, email: e.target.value })}
        />
      </Field>
      <Field label="Anfangspasswort" hint="Mindestens 10 Zeichen. Bitte persönlich übergeben.">
        <input
          className={FIELD}
          name="password"
          type="password"
          minLength={10}
          required
          autoComplete="new-password"
          value={v.password}
          onChange={(e) => setV({ ...v, password: e.target.value })}
        />
      </Field>
      <Field label="Rolle">
        <select
          className={SELECT}
          name="role"
          value={v.role}
          onChange={(e) => setV({ ...v, role: e.target.value })}
        >
          <option value="member">Mitarbeiter</option>
          <option value="owner">Owner</option>
        </select>
      </Field>
      <FormMessage state={state} />
      {state?.ok === true ? (
        <p className="text-meta text-ink-2" role="status">
          Mitglied angelegt.
        </p>
      ) : null}
      <div className="flex justify-end">
        <SubmitButton pendingLabel="Anlegen …">Anlegen</SubmitButton>
      </div>
    </form>
  );
}
