"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ORG_COOKIE, requireActor } from "@/lib/actor";
import { listUserOrganizations } from "@/lib/data/members";
import { field } from "@/lib/forms";

/** Aktive Organisation wechseln; nur zu eigenen Mitgliedschaften. */
export async function switchOrganizationAction(form: FormData): Promise<void> {
  const actor = await requireActor();
  const organizationId = field(form, "organizationId");
  if (!listUserOrganizations(actor.userId).some((o) => o.id === organizationId)) return;

  (await cookies()).set(ORG_COOKIE, organizationId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
  redirect("/");
}
