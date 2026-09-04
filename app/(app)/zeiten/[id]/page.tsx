import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHead } from "@/components/app-shell";
import {
  COMPACT_ACTION,
  Panel,
  PanelHead,
  PanelSection,
  SECONDARY_ACTION,
} from "@/components/chrome";
import { ConfirmForm } from "@/components/form";
import { requireActor } from "@/lib/actor";
import { getEntry } from "@/lib/data/entries";
import { projectOptions } from "@/lib/data/projects";
import { env } from "@/lib/env";
import { canEditEntry } from "@/lib/permissions";
import { formatDateTime, formatTime, hm } from "@/lib/time/format";
import { dayKey } from "@/lib/time/periods";

import { deleteEntryAction, updateEntryAction } from "../actions";
import { EntryForm } from "../entry-form";

export const metadata: Metadata = { title: "Eintrag" };

export default async function EntryPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly id: string }>;
  readonly searchParams: Promise<{ readonly back?: string }>;
}) {
  const actor = await requireActor();
  const { id } = await params;
  const backParam = (await searchParams).back;
  const back = backParam !== undefined && backParam.startsWith("/") ? backParam : "/zeiten";
  const tz = env.timezone();
  const entry = getEntry(actor.organizationId, id);
  if (entry === null || entry.endedAt === null) notFound();
  if (!canEditEntry(actor, entry)) redirect(back);

  const projects = projectOptions(actor.organizationId);
  if (!projects.some((p) => p.id === entry.projectId)) {
    projects.push({
      id: entry.projectId,
      name: `${entry.projectName} (archiviert)`,
      code: entry.projectCode,
    });
  }

  return (
    <>
      <PageHead title="Eintrag bearbeiten">
        <Link className={COMPACT_ACTION} href={back}>
          ‹ Zurück
        </Link>
      </PageHead>
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_320px] lg:items-start">
        <Panel>
          <PanelHead title={`${entry.userName} · ${hm(entry.durationSeconds)} h`} />
          <div className="p-4">
            <EntryForm
              action={updateEntryAction.bind(null, entry.id)}
              projects={projects}
              submitLabel="Speichern"
              values={{
                projectId: entry.projectId,
                day: dayKey(new Date(entry.startedAt), tz),
                from: formatTime(entry.startedAt, tz),
                to: formatTime(entry.endedAt, tz),
                duration: hm(entry.durationSeconds),
                note: entry.note ?? "",
              }}
            />
          </div>
        </Panel>
        <Panel>
          <PanelHead title="Eintrag" />
          <PanelSection label="Herkunft">
            <p className="text-meta text-ink-2">
              {entry.source === "timer" ? "● Stoppuhr" : "Manuell nachgetragen"}
            </p>
            <p className="text-meta text-ink-3">Angelegt {formatDateTime(entry.createdAt, tz)}</p>
          </PanelSection>
          <PanelSection>
            <ConfirmForm
              action={deleteEntryAction}
              message="Eintrag endgültig löschen?"
              className="flex flex-col gap-2"
            >
              <input type="hidden" name="id" value={entry.id} />
              <input type="hidden" name="back" value={back} />
              <button
                className={`${SECONDARY_ACTION} border-attention text-attention`}
                type="submit"
              >
                <span aria-hidden="true">×</span> Löschen
              </button>
            </ConfirmForm>
          </PanelSection>
        </Panel>
      </div>
    </>
  );
}
