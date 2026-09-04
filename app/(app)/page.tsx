import type { Metadata } from "next";

import { PageHead } from "@/components/app-shell";
import { BarChart, type Bar } from "@/components/bar-chart";
import { Panel, PanelHead, PanelSection } from "@/components/chrome";
import { EntryList } from "@/components/entry-list";
import { PeriodSwitch, readPeriod } from "@/components/period-switch";
import { Timer } from "@/components/timer";
import { requireActor } from "@/lib/actor";
import { listEntries, runningEntries, runningEntry } from "@/lib/data/entries";
import { projectOptions } from "@/lib/data/projects";
import { env } from "@/lib/env";
import { entryScope } from "@/lib/permissions";
import { groupSeconds, secondsPerDay, sumSeconds } from "@/lib/time/aggregate";
import { decimalHours, hm } from "@/lib/time/format";
import { daysIn, periodRange, todayKey } from "@/lib/time/periods";

import {
  deleteEntryAction,
  runningNoteAction,
  startTimerAction,
  stopTimerAction,
} from "./zeiten/actions";

export const metadata: Metadata = { title: "Dashboard" };

const WEEKDAY = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

export default async function DashboardPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly p?: string; readonly d?: string }>;
}) {
  const actor = await requireActor();
  const tz = env.timezone();
  const { kind, anchor } = readPeriod(await searchParams, tz, "day");
  const range = periodRange(kind, anchor, tz);
  const today = todayKey(tz);

  const scope = entryScope(actor);
  const entries = listEntries(scope, { range });
  const mine = entries.filter((e) => e.userId === actor.userId);
  const total = sumSeconds(entries);
  const projects = projectOptions(actor.organizationId);
  const running = runningEntry(actor.userId);
  const others = runningEntries(actor.organizationId).filter((r) => r.id !== running?.id);

  let bars: Bar[];
  if (kind === "day") {
    const byProject = groupSeconds(entries, (e) => e.projectId);
    bars = [...byProject.entries()]
      .map(([projectId, b]) => {
        const p = entries.find((e) => e.projectId === projectId);
        return {
          key: projectId,
          label: p?.projectCode ?? p?.projectName ?? "",
          seconds: b.seconds,
          title: `${p?.projectName ?? ""}: ${hm(b.seconds)} h`,
        };
      })
      .sort((a, b) => b.seconds - a.seconds);
  } else {
    const days = daysIn(range, tz);
    bars = secondsPerDay(entries, days, tz).map(({ day, seconds }) => ({
      key: day,
      label:
        kind === "week"
          ? (WEEKDAY[new Date(`${day}T12:00:00`).getDay()] ?? day)
          : String(Number(day.slice(8))),
      seconds,
      emphasis: day === today,
      title: `${day}: ${hm(seconds)} h`,
    }));
  }

  const back = `/?p=${kind}&d=${anchor}`;

  return (
    <>
      <PageHead title="Dashboard" />
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="flex flex-col gap-[18px]">
          <Panel>
            <div className="p-4">
              <Timer
                projects={projects}
                running={running}
                startAction={startTimerAction}
                stopAction={stopTimerAction}
                noteAction={runningNoteAction}
              />
            </div>
          </Panel>

          <PeriodSwitch base="/" kind={kind} anchor={anchor} tz={tz} />

          <Panel>
            <PanelHead title={kind === "day" ? "Je Projekt" : "Je Tag"}>
              <span className="tabular text-meta text-ink-2">Σ {hm(total)} h</span>
            </PanelHead>
            <div className="p-4 pt-[22px]">
              {bars.length === 0 || total === 0 ? (
                <p className="py-6 text-center text-ui text-ink-3">
                  Noch keine Zeiten in diesem Zeitraum.
                </p>
              ) : (
                <BarChart bars={bars} />
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHead title="Einträge" />
            <EntryList
              entries={entries}
              actor={actor}
              tz={tz}
              back={back}
              deleteAction={deleteEntryAction}
            />
          </Panel>
        </div>

        <div className="flex flex-col gap-[18px]">
          <Panel>
            <PanelHead title="Summe" />
            <PanelSection>
              <p className="tabular font-display text-title-lg text-ink-1">{hm(total)} h</p>
              <p className="text-meta text-ink-3">
                {decimalHours(total)} Dezimalstunden · {entries.length} Einträge
              </p>
            </PanelSection>
            {entries.length !== mine.length ? (
              <PanelSection label="Davon eigene">
                <p className="tabular text-ui text-ink-1">{hm(sumSeconds(mine))} h</p>
              </PanelSection>
            ) : null}
            {kind === "day" ? null : (
              <PanelSection label="Je Projekt">
                <ul className="flex flex-col gap-2">
                  {[...groupSeconds(entries, (e) => e.projectId).entries()]
                    .sort((a, b) => b[1].seconds - a[1].seconds)
                    .map(([projectId, b]) => {
                      const p = entries.find((e) => e.projectId === projectId);
                      return (
                        <li key={projectId} className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-ui text-ink-2">{p?.projectName}</span>
                          <span className="tabular text-ui text-ink-1">{hm(b.seconds)}</span>
                        </li>
                      );
                    })}
                  {entries.length === 0 ? <li className="text-meta text-ink-3">—</li> : null}
                </ul>
              </PanelSection>
            )}
          </Panel>

          {others.length === 0 ? null : (
            <Panel>
              <PanelHead title="Gerade aktiv" />
              <ul className="flex flex-col gap-px bg-line-soft">
                {others.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-baseline justify-between gap-3 bg-panel px-4 py-[11px]"
                  >
                    <span className="truncate text-ui text-ink-1">
                      <span aria-hidden="true">● </span>
                      {r.userName}
                    </span>
                    <span className="truncate text-meta text-ink-3">{r.projectName}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
