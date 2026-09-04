"use client";

import { useState, type FormEvent } from "react";

import { FIELD, Label, PRIMARY_ACTION } from "@/components/chrome";
import { ErrorState } from "@/components/list-state";

const SIGN_IN_PATH = "/api/auth/sign-in/email";

/* Ein Text für jede Ablehnung: unbekannte Adresse und falsches Passwort
   sind serverseitig nicht unterscheidbar, und die Oberfläche darf den
   Unterschied nicht wieder einführen. */
const REJECTED = "Anmeldung nicht möglich. Prüfe E-Mail-Adresse und Passwort.";
const THROTTLED = "Zu viele Versuche. Warte einen Moment und versuche es erneut.";
const UNAVAILABLE = "Die Anmeldung ist derzeit nicht erreichbar.";

export function LoginForm({ next }: { readonly next: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(SIGN_IN_PATH, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: String(form.get("email") ?? "")
            .trim()
            .toLowerCase(),
          password: String(form.get("password") ?? ""),
        }),
      });

      if (response.ok) {
        window.location.assign(next);
        return;
      }
      setError(
        response.status === 429 ? THROTTLED : response.status >= 500 ? UNAVAILABLE : REJECTED,
      );
    } catch {
      setError(UNAVAILABLE);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex flex-col gap-[14px]" onSubmit={onSubmit} noValidate>
      <label className="flex flex-col gap-[6px]">
        <Label>E-Mail-Adresse</Label>
        <input className={FIELD} name="email" type="email" autoComplete="username" required />
      </label>
      <label className="flex flex-col gap-[6px]">
        <Label>Passwort</Label>
        <input
          className={FIELD}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {error === null ? null : <ErrorState message={error} />}
      <button className={`${PRIMARY_ACTION} mt-1`} type="submit" disabled={pending}>
        {pending ? "Anmelden …" : "Anmelden"}
      </button>
    </form>
  );
}
