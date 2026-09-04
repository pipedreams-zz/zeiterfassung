/** Rückgabe von Server Actions, die ein Formular beantworten. */
export type FormState = { readonly ok?: boolean; readonly error?: string } | null;

export const INITIAL_FORM: FormState = null;

export function field(form: FormData, name: string): string {
  const v = form.get(name);
  return typeof v === "string" ? v.trim() : "";
}

export function fields(form: FormData, name: string): string[] {
  return form.getAll(name).filter((v): v is string => typeof v === "string" && v !== "");
}
