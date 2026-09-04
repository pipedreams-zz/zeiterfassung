"use client";

import { useActionState, useEffect, useState } from "react";

import { FIELD } from "@/components/chrome";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { INITIAL_FORM, type FormState } from "@/lib/forms";

export interface ProjectFormValues {
  readonly name: string;
  readonly code: string;
  readonly description: string;
}

const EMPTY: ProjectFormValues = { name: "", code: "", description: "" };

export function ProjectForm({
  action,
  values = EMPTY,
  submitLabel,
  resetOnSuccess = false,
}: {
  readonly action: (prev: FormState, form: FormData) => Promise<FormState>;
  readonly values?: ProjectFormValues;
  readonly submitLabel: string;
  readonly resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, INITIAL_FORM);
  const [v, setV] = useState(values);

  useEffect(() => {
    if (resetOnSuccess && state?.ok === true) setV(EMPTY);
  }, [state, resetOnSuccess]);

  return (
    <form action={formAction} className="flex flex-col gap-[14px]">
      <div className="grid gap-[14px] sm:grid-cols-[1fr_140px]">
        <Field label="Name">
          <input
            className={FIELD}
            name="name"
            value={v.name}
            onChange={(e) => setV({ ...v, name: e.target.value })}
            required
            maxLength={120}
          />
        </Field>
        <Field label="Kürzel">
          <input
            className={FIELD}
            name="code"
            value={v.code}
            onChange={(e) => setV({ ...v, code: e.target.value })}
            maxLength={20}
            placeholder="z. B. P-12"
          />
        </Field>
      </div>
      <Field label="Beschreibung">
        <textarea
          className={`${FIELD} min-h-[72px]`}
          name="description"
          value={v.description}
          onChange={(e) => setV({ ...v, description: e.target.value })}
          maxLength={2000}
          rows={2}
        />
      </Field>
      <FormMessage state={state} />
      {state?.ok === true ? (
        <p className="text-meta text-ink-2" role="status">
          {resetOnSuccess ? "Angelegt." : "Gespeichert."}
        </p>
      ) : null}
      <div className="flex justify-end">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
