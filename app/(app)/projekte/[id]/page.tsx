import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHead } from "@/components/app-shell";
import {
  Chip,
  COMPACT_ACTION,
  Panel,
  PanelHead,
  PanelSection,
  SECONDARY_ACTION,
} from "@/components/chrome";
import { ConfirmForm } from "@/components/form";
import { ErrorState } from "@/components/list-state";
import { requireActor } from "@/lib/actor";
import { getProject } from "@/lib/data/projects";
import { canArchiveProjects } from "@/lib/permissions";
import { decimalHours, formatDateTime, hm } from "@/lib/time/format";
import { env } from "@/lib/env";

import { deleteProjectAction, setArchivedAction, updateProjectAction } from "../actions";
import { ProjectForm } from "../project-form";

export const metadata: Metadata = { title: "Projekt" };

export default async function ProjectPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly id: string }>;
  readonly searchParams: Promise<{ readonly fehler?: string }>;
}) {
  const actor = await requireActor();
  const { id } = await params;
  const { fehler } = await searchParams;
  const project = getProject(actor.organizationId, id);
  if (project === null) notFound();

  const archived = project.archivedAt !== null;
  const tz = env.timezone();
  const update = updateProjectAction.bind(null, project.id);

  return (
    <>
      <PageHead
        title={
          <span className="flex items-baseline gap-3">
            {project.code === null ? null : <Chip>{project.code}</Chip>}
            {project.name}
            {archived ? <Chip tone="empty">Archiviert</Chip> : null}
          </span>
        }
      >
        <Link className={COMPACT_ACTION} href={archived ? "/projekte?archiv=1" : "/projekte"}>
          ‹ Projekte
        </Link>
      </PageHead>

      {fehler === "buchungen" ? (
        <div className="mb-[18px]">
          <ErrorState message="Das Projekt hat Buchungen und kann nicht gelöscht werden. Archiviere es stattdessen." />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_320px] lg:items-start">
        <Panel>
          <PanelHead title="Stammdaten" />
          <div className="p-4">
            <ProjectForm
              action={update}
              submitLabel="Speichern"
              values={{
                name: project.name,
                code: project.code ?? "",
                description: project.description ?? "",
              }}
            />
          </div>
        </Panel>

        <div className="flex flex-col gap-[18px]">
          <Panel>
            <PanelHead title="Gesamt" />
            <PanelSection>
              <p className="tabular font-display text-title-lg text-ink-1">
                {hm(project.totalSeconds)} h
              </p>
              <p className="text-meta text-ink-3">
                {decimalHours(project.totalSeconds)} Dezimalstunden · {project.entryCount}{" "}
                {project.entryCount === 1 ? "Buchung" : "Buchungen"}
              </p>
            </PanelSection>
            <PanelSection label="Angelegt">
              <p className="text-meta text-ink-2">{formatDateTime(project.createdAt, tz)}</p>
            </PanelSection>
            <PanelSection label="Auswertung">
              <Link
                className={COMPACT_ACTION}
                href={`/auswertung?preset=all&projekt=${project.id}`}
              >
                Gesamtes Projekt auswerten ›
              </Link>
            </PanelSection>
          </Panel>

          {canArchiveProjects(actor) ? (
            <Panel>
              <PanelHead title="Verwalten" />
              <PanelSection>
                <form action={setArchivedAction} className="flex flex-col gap-2">
                  <input type="hidden" name="id" value={project.id} />
                  <input type="hidden" name="archived" value={archived ? "0" : "1"} />
                  <button className={SECONDARY_ACTION} type="submit">
                    {archived ? "Wieder aktivieren" : "Archivieren"}
                  </button>
                  <span className="text-meta text-ink-3">
                    Archivierte Projekte sind für neue Buchungen gesperrt, bleiben aber auswertbar.
                  </span>
                </form>
              </PanelSection>
              {project.entryCount === 0 ? (
                <PanelSection>
                  <ConfirmForm
                    action={deleteProjectAction}
                    message={`Projekt „${project.name}" endgültig löschen?`}
                    className="flex flex-col gap-2"
                  >
                    <input type="hidden" name="id" value={project.id} />
                    <button
                      className={`${SECONDARY_ACTION} border-attention text-attention`}
                      type="submit"
                    >
                      <span aria-hidden="true">×</span> Löschen
                    </button>
                    <span className="text-meta text-ink-3">
                      Nur möglich, solange keine Buchung existiert.
                    </span>
                  </ConfirmForm>
                </PanelSection>
              ) : null}
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}
