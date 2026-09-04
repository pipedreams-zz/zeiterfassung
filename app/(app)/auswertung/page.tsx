import type { Metadata } from "next";

import { PageHead } from "@/components/app-shell";
import {
  Chip,
  FIELD,
  Panel,
  PanelHead,
  PanelSection,
  PRIMARY_ACTION,
  SECONDARY_ACTION,
  SELECT,
} from "@/components/chrome";
import { Field } from "@/components/form";
import { EmptyState } from "@/components/list-state";
import { requireActor } from "@/lib/actor";
import { memberOptions } from "@/lib/data/members";
import { allProjectOptions } from "@/lib/data/projects";
import { env } from "@/lib/env";
import { canSeeAllEntries } from "@/lib/permissions";
import {
  buildReport,
  GROUPING_LABEL,
  GROUPINGS,
  parseReportQuery,
  reportQueryString,
} from "@/lib/report";
import { decimalHours, formatDateTime, formatTime, hm } from "@/lib/time/format";
import { PRESET_LABEL, PRESETS, todayKey } from "@/lib/time/periods";

export const metadata: Metadata = { title: "Auswertung" };

export default async function ReportPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const tz = env.timezone();
  const query = parseReportQuery(await searchParams, tz);
  const report = buildReport(actor, query, tz);
  const projects = allProjectOptions(actor.organizationId);
  const all = canSeeAllEntries(actor);
  const members = all ? memberOptions(actor.organizationId) : [];
  const qs = reportQueryString(report.query);

  return (
    <>
      <PageHead title="Auswertung">
        <a className={SECONDARY_ACTION} href={`/api/export/pdf?${qs}`} download>
          <span aria-hidden="true">↓</span> PDF exportieren
        </a>
      </PageHead>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[320px_1fr] lg:items-start">
        <Panel>
          <PanelHead title="Filter" />
          <form method="get" action="/auswertung" className="flex flex-col">
            <PanelSection label="Zeitraum">
              <select
                className={SELECT}
                name="preset"
                defaultValue={query.preset}
                aria-label="Zeitraum"
              >
                {PRESETS.map((p) => (
                  <option key={p} value={p}>
                    {PRESET_LABEL[p]}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Von">
                  <input
                    className={FIELD}
                    type="date"
                    name="from"
                    defaultValue={query.from ?? ""}
                    max={todayKey(tz)}
                  />
                </Field>
                <Field label="Bis">
                  <input className={FIELD} type="date" name="to" defaultValue={query.to ?? ""} />
                </Field>
              </div>
              <span className="text-meta text-ink-3">Von/Bis gelten für „Zeitraum".</span>
            </PanelSection>

            <PanelSection label="Projekte" ariaLabel="Projekte filtern">
              {projects.length === 0 ? (
                <span className="text-meta text-ink-3">Keine Projekte.</span>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {projects.map((p) => {
                    const checked = query.projectIds.includes(p.id);
                    return (
                      <li key={p.id}>
                        <label
                          className={`inline-flex min-h-[28px] cursor-pointer items-center gap-2 border px-[9px] text-meta ${
                            checked
                              ? "border-ink-1 bg-chip text-ink-1"
                              : "border-line-frame text-ink-2 hover:border-line-dashed"
                          } ${p.archived ? "border-dashed" : ""}`}
                        >
                          <input
                            type="checkbox"
                            name="projekt"
                            value={p.id}
                            defaultChecked={checked}
                            className="sr-only"
                          />
                          <span aria-hidden="true">{checked ? "◆" : "○"}</span>
                          {p.code === null ? p.name : `${p.code} · ${p.name}`}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
              <span className="text-meta text-ink-3">Keine Auswahl = alle Projekte.</span>
            </PanelSection>

            {all ? (
              <PanelSection label="Person">
                <select
                  className={SELECT}
                  name="person"
                  defaultValue={query.userId ?? ""}
                  aria-label="Person"
                >
                  <option value="">Alle Personen</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </PanelSection>
            ) : null}

            <PanelSection label="Gruppieren nach">
              <select
                className={SELECT}
                name="gruppe"
                defaultValue={query.group}
                aria-label="Gruppierung"
              >
                {GROUPINGS.filter((g) => all || g !== "user").map((g) => (
                  <option key={g} value={g}>
                    {GROUPING_LABEL[g]}
                  </option>
                ))}
              </select>
            </PanelSection>

            <div className="p-4">
              <button className={`${PRIMARY_ACTION} w-full`} type="submit">
                Auswerten
              </button>
            </div>
          </form>
        </Panel>

        <div className="flex flex-col gap-[18px]">
          <Panel>
            <PanelHead title={report.periodLabel} />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-[auto_1fr] sm:items-end">
              <div>
                <p className="tabular font-display text-title-lg text-ink-1">
                  {hm(report.totalSeconds)} h
                </p>
                <p className="text-meta text-ink-3">
                  {decimalHours(report.totalSeconds)} Dezimalstunden · {report.entryCount}{" "}
                  {report.entryCount === 1 ? "Eintrag" : "Einträge"}
                </p>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-meta">
                <dt className="tracking-[0.14em] text-ink-3 uppercase">Projekte</dt>
                <dd className="text-ink-2">{report.projectLabel}</dd>
                <dt className="tracking-[0.14em] text-ink-3 uppercase">Person</dt>
                <dd className="text-ink-2">{report.personLabel}</dd>
              </dl>
            </div>
          </Panel>

          {report.groups.length === 0 ? (
            <EmptyState title="Keine Einträge im Zeitraum">Ändere Zeitraum oder Filter.</EmptyState>
          ) : (
            <Panel>
              <PanelHead title={`Nach ${report.groupLabel}`} />
              <div className="min-w-0 overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-ui">
                  <thead>
                    <tr className="border-b border-line text-left text-meta tracking-[0.14em] text-ink-3 uppercase">
                      <th className="px-4 py-2 font-normal">Datum</th>
                      <th className="px-2 py-2 font-normal">Zeit</th>
                      <th className="px-2 py-2 font-normal">
                        {query.group === "project" ? "Person" : "Projekt"}
                      </th>
                      <th className="px-2 py-2 font-normal">Notiz</th>
                      <th className="px-4 py-2 text-right font-normal">Dauer</th>
                    </tr>
                  </thead>
                  {report.groups.map((g) => (
                    <tbody key={g.key} className="border-b border-line">
                      <tr className="bg-raised">
                        <th colSpan={4} className="px-4 py-2 text-left font-normal text-ink-1">
                          <span className="flex items-baseline gap-2">
                            {g.sublabel === null ? null : <Chip>{g.sublabel}</Chip>}
                            {g.label}
                            <span className="text-meta text-ink-3">
                              {g.entries.length} {g.entries.length === 1 ? "Eintrag" : "Einträge"}
                            </span>
                          </span>
                        </th>
                        <td className="tabular px-4 py-2 text-right text-ink-1">{hm(g.seconds)}</td>
                      </tr>
                      {g.entries.map((e) => (
                        <tr key={e.id} className="border-t border-line-soft text-ink-2">
                          <td className="tabular px-4 py-[6px] whitespace-nowrap text-meta">
                            {formatDateTime(e.startedAt, tz).split(",")[0]}
                          </td>
                          <td className="tabular px-2 py-[6px] whitespace-nowrap text-meta">
                            {formatTime(e.startedAt, tz)}–{formatTime(e.endedAt ?? e.startedAt, tz)}
                          </td>
                          <td className="px-2 py-[6px]">
                            {query.group === "project" ? e.userName : e.projectName}
                          </td>
                          <td className="max-w-[320px] truncate px-2 py-[6px] text-meta">
                            {e.note ?? ""}
                          </td>
                          <td className="tabular px-4 py-[6px] text-right">
                            {hm(e.durationSeconds)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  ))}
                  <tfoot>
                    <tr className="text-ink-1">
                      <th
                        colSpan={4}
                        className="px-4 py-3 text-left font-normal tracking-[0.14em] uppercase"
                      >
                        Gesamt
                      </th>
                      <td className="tabular px-4 py-3 text-right font-display text-title-sm">
                        {hm(report.totalSeconds)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
