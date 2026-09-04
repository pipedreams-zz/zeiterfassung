import type { Metadata } from "next";

import { PageHead } from "@/components/app-shell";
import { Panel, PanelHead } from "@/components/chrome";
import { EntryList } from "@/components/entry-list";
import { PeriodSwitch, readPeriod } from "@/components/period-switch";
import { requireActor } from "@/lib/actor";
import { listEntries } from "@/lib/data/entries";
import { projectOptions } from "@/lib/data/projects";
import { env } from "@/lib/env";
import { entryScope } from "@/lib/permissions";
import { sumSeconds } from "@/lib/time/aggregate";
import { decimalHours, hm } from "@/lib/time/format";
import { periodRange, todayKey } from "@/lib/time/periods";

import { createEntryAction, deleteEntryAction } from "./actions";
import { EntryForm } from "./entry-form";

export const metadata: Metadata = { title: "Zeiten" };

export default async function EntriesPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly p?: string; readonly d?: string }>;
}) {
  const actor = await requireActor();
  const tz = env.timezone();
  const params = await searchParams;
  const { kind, anchor } = readPeriod(params, tz, "week");
  const range = periodRange(kind, anchor, tz);
  const entries = listEntries(entryScope(actor), { range });
  const projects = projectOptions(actor.organizationId);
  const back = `/zeiten?p=${kind}&d=${anchor}`;
  const total = sumSeconds(entries);

  return (
    <>
      <PageHead title="Zeiten" />
      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="flex flex-col gap-[18px]">
          <PeriodSwitch base="/zeiten" kind={kind} anchor={anchor} tz={tz} />
          <Panel>
            <PanelHead title={`${entries.length} ${entries.length === 1 ? "Eintrag" : "Einträge"}`}>
              <span className="tabular text-meta text-ink-2">
                {hm(total)} h · {decimalHours(total)}
              </span>
            </PanelHead>
            <EntryList
              entries={entries}
              actor={actor}
              tz={tz}
              back={back}
              deleteAction={deleteEntryAction}
            />
          </Panel>
        </div>

        <Panel>
          <PanelHead title="Zeit nachtragen" />
          <div className="p-4">
            <EntryForm
              action={createEntryAction}
              projects={projects}
              submitLabel="Buchen"
              resetOnSuccess
              values={{
                projectId: "",
                day: kind === "day" ? anchor : todayKey(tz),
                from: "",
                to: "",
                duration: "",
                note: "",
              }}
            />
          </div>
        </Panel>
      </div>
    </>
  );
}
