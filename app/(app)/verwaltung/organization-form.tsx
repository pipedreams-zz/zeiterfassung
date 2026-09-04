"use client";

import { useActionState } from "react";

import { FIELD } from "@/components/chrome";
import { FormMessage, SubmitButton } from "@/components/form";
import { INITIAL_FORM } from "@/lib/forms";

import { renameOrganizationAction } from "./actions";

export function OrganizationForm({ name }: { readonly name: string }) {
  const [state, action] = useActionState(renameOrganizationAction, INITIAL_FORM);
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input className={FIELD} name="name" defaultValue={name} required maxLength={120} />
        <SubmitButton secondary pendingLabel="…">
          Umbenennen
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
