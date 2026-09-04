import type { Metadata } from "next";
import Link from "next/link";

import { PageHead } from "@/components/app-shell";
import { Chip, COMPACT_ACTION, Panel, PanelHead } from "@/components/chrome";
import { EmptyState } from "@/components/list-state";
import { requireActor } from "@/lib/actor";
import { listProjects } from "@/lib/data/projects";
import { canSeeAllEntries, entryScope } from "@/lib/permissions";
import { decimalHours, hm } from "@/lib/time/format";

import { createProjectAction } from "./actions";
import { ProjectForm } from "./project-form";

export const metadata: Metadata = { title: "Projekte" };

export default async function ProjectsPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly archiv?: string }>;
}) {
  const actor = await requireActor();
  const archived = (await searchParams).archiv === "1";
  const rows = listProjects(entryScope(actor), { archived });
  const own = !canSeeAllEntries(actor);

  return (
    <>
      <PageHead title={archived ? "Archivierte Projekte" : "Projekte"}>
        <Link className={COMPACT_ACTION} href={archived ? "/projekte" : "/projekte?archiv=1"}>
          {archived ? "‹ Aktive Projekte" : "Archiv ›"}
        </Link>
      </PageHead>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_380px] lg:items-start">
        <Panel>
          <PanelHead title={`${rows.length} ${rows.length === 1 ? "Projekt" : "Projekte"}`}>
            {own ? <span className="text-meta text-ink-3">Summen: eigene Zeiten</span> : null}
          </PanelHead>
          {rows.length === 0 ? (
            <div className="p-4">
              <EmptyState title={archived ? "Kein archiviertes Projekt" : "Noch kein Projekt"}>
                {archived
                  ? "Archivierte Projekte erscheinen hier."
                  : "Lege rechts das erste Projekt an."}
              </EmptyState>
            </div>
          ) : (
            <ul className="flex flex-col gap-px bg-line-soft">
              {rows.map((p) => (
                <li key={p.id} className="bg-panel">
                  <Link
                    href={`/projekte/${p.id}`}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-[14px] hover:bg-select"
                  >
                    <span className="flex min-w-0 items-baseline gap-3">
                      {p.code === null ? null : <Chip>{p.code}</Chip>}
                      <span className="truncate text-ui text-ink-1">{p.name}</span>
                    </span>
                    <span className="flex items-baseline gap-4 text-meta text-ink-3">
                      <span>
                        {p.entryCount} {p.entryCount === 1 ? "Buchung" : "Buchungen"}
                      </span>
                      <span className="tabular text-ui text-ink-1">{hm(p.totalSeconds)} h</span>
                      <span className="tabular hidden sm:inline">
                        {decimalHours(p.totalSeconds)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {archived ? null : (
          <Panel>
            <PanelHead title="Neues Projekt" />
            <div className="p-4">
              <ProjectForm action={createProjectAction} submitLabel="Anlegen" resetOnSuccess />
            </div>
          </Panel>
        )}
      </div>
    </>
  );
}
