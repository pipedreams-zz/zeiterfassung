"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Label, PRIMARY_ACTION, SECONDARY_ACTION } from "./chrome";
import { ErrorState } from "./list-state";
import type { FormState } from "@/lib/forms";

/** Beschriftetes Feld: Label oben, Eingabe darunter. */
export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  readonly label: ReactNode;
  readonly hint?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <label className={`flex flex-col gap-[6px] ${className}`}>
      <Label>{label}</Label>
      {children}
      {hint === undefined ? null : <span className="text-meta text-ink-3">{hint}</span>}
    </label>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  secondary = false,
  className = "",
}: {
  readonly children: ReactNode;
  readonly pendingLabel?: string;
  readonly secondary?: boolean;
  readonly className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${secondary ? SECONDARY_ACTION : PRIMARY_ACTION} ${className}`}
    >
      {pending ? (pendingLabel ?? "Speichern …") : children}
    </button>
  );
}

export function FormMessage({ state }: { readonly state: FormState }) {
  if (state === null || state.error === undefined) return null;
  return <ErrorState message={state.error} />;
}

/** Formular, das vor dem Absenden eine Bestätigung verlangt. */
export function ConfirmForm({
  action,
  message,
  children,
  className = "",
}: {
  readonly action: (formData: FormData) => void | Promise<void>;
  readonly message: string;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
