"use client";

import { useActionState, useEffect, useState } from "react";

import { FIELD, SELECT } from "@/components/chrome";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import type { TimerProject } from "@/components/timer";
import type { EntryFormValues } from "@/lib/data/entry-input";
import { INITIAL_FORM, type FormState } from "@/lib/forms";
import { hm } from "@/lib/time/format";

function minutes(t: string): number | null {
  const m = /^(\d{2}):(\d{2})$/.exec(t);
  return m === null ? null : Number(m[1]) * 60 + Number(m[2]);
}

/**
 * Buchungsformular. Alle Felder sind kontrolliert, damit ein Fehler vom
 * Server die Eingaben nicht verwirft (React setzt Formulare nach einer
 * Action sonst zurück). Nach Erfolg mit `resetOnSuccess` wird geleert.
 */
export function EntryForm({
  action,
  projects,
  values,
  submitLabel,
  resetOnSuccess = false,
}: {
  readonly action: (prev: FormState, form: FormData) => Promise<FormState>;
  readonly projects: readonly TimerProject[];
  readonly values: EntryFormValues;
  readonly submitLabel: string;
  readonly resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, INITIAL_FORM);
  const [v, setV] = useState<EntryFormValues>(values);

  useEffect(() => {
    if (resetOnSuccess && state?.ok === true) {
      setV({ ...values, projectId: "", from: "", to: "", duration: "", note: "" });
    }
  }, [state, resetOnSuccess, values]);

  function set<K extends keyof EntryFormValues>(key: K, value: EntryFormValues[K]) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  function syncDuration(f: string, t: string) {
    const a = minutes(f);
    const b = minutes(t);
    if (a === null || b === null) return;
    const diff = b > a ? b - a : b - a + 24 * 60;
    set("duration", hm(diff * 60));
  }

  return (
    <form action={formAction} className="flex flex-col gap-[14px]">
      <div className="grid gap-[14px] sm:grid-cols-2">
        <Field label="Projekt">
          <select
            className={SELECT}
            name="projectId"
            required
            value={v.projectId}
            onChange={(e) => set("projectId", e.target.value)}
          >
            <option value="" disabled>
              Projekt wählen …
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code === null ? p.name : `${p.code} · ${p.name}`}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Datum">
          <input
            className={FIELD}
            name="day"
            type="date"
            required
            value={v.day}
            onChange={(e) => set("day", e.target.value)}
          />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-[14px]">
        <Field label="Von">
          <input
            className={FIELD}
            name="from"
            type="time"
            value={v.from}
            onChange={(e) => {
              set("from", e.target.value);
              syncDuration(e.target.value, v.to);
            }}
          />
        </Field>
        <Field label="Bis">
          <input
            className={FIELD}
            name="to"
            type="time"
            value={v.to}
            onChange={(e) => {
              set("to", e.target.value);
              syncDuration(v.from, e.target.value);
            }}
          />
        </Field>
        <Field label="Dauer">
          <input
            className={FIELD}
            name="duration"
            inputMode="decimal"
            placeholder="1:30"
            value={v.duration}
            onChange={(e) => {
              set("duration", e.target.value);
              set("to", "");
            }}
          />
        </Field>
      </div>
      <p className="-mt-2 text-meta text-ink-3">
        Von und Bis, oder nur eine Dauer (dann ab „Von" bzw. 08:00).
      </p>
      <Field label="Notiz">
        <input
          className={FIELD}
          name="note"
          value={v.note}
          maxLength={500}
          placeholder="Was wurde gemacht?"
          onChange={(e) => set("note", e.target.value)}
        />
      </Field>
      <FormMessage state={state} />
      {state?.ok === true ? (
        <p className="text-meta text-ink-2" role="status">
          {resetOnSuccess ? "Gebucht." : "Gespeichert."}
        </p>
      ) : null}
      <div className="flex justify-end">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
