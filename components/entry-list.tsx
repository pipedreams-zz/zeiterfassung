import Link from "next/link";

import type { EntryRow } from "@/lib/data/entries";
import type { Actor } from "@/lib/permissions";
import { canEditEntry } from "@/lib/permissions";
import { groupSeconds } from "@/lib/time/aggregate";
import { formatDate, formatTime, hm } from "@/lib/time/format";
import { dayKey } from "@/lib/time/periods";

import { Chip, COMPACT_ACTION } from "./chrome";
import { ConfirmForm } from "./form";
import { EmptyState } from "./list-state";

/**
 * Einträge gruppiert nach Kalendertag mit Tagessumme. Bearbeiten und Löschen
 * nur für Urheber oder Owner.
 */
export function EntryList({
  entries,
  actor,
  tz,
  back,
  deleteAction,
  emptyTitle = "Keine Einträge",
  emptyText,
  showUser = true,
}: {
  readonly entries: readonly EntryRow[];
  readonly actor: Actor;
  readonly tz: string;
  readonly back: string;
  readonly deleteAction: (form: FormData) => Promise<void>;
  readonly emptyTitle?: string;
  readonly emptyText?: string;
  readonly showUser?: boolean;
}) {
  if (entries.length === 0) {
    return (
      <div className="p-4">
        <EmptyState title={emptyTitle}>
          {emptyText ?? "In diesem Zeitraum wurde nichts gebucht."}
        </EmptyState>
      </div>
    );
  }

  const days = new Map<string, EntryRow[]>();
  for (const e of entries) {
    const k = dayKey(new Date(e.startedAt), tz);
    const list = days.get(k);
    if (list === undefined) days.set(k, [e]);
    else list.push(e);
  }
  const totals = groupSeconds(entries, (e) => dayKey(new Date(e.startedAt), tz));

  return (
    <div className="flex flex-col">
      {[...days.entries()].map(([day, list]) => (
        <section key={day} aria-label={formatDate(list[0]?.startedAt ?? "", tz)}>
          <div className="flex items-baseline justify-between border-b border-line-soft bg-raised px-4 py-2">
            <span className="text-meta tracking-[0.14em] text-ink-2 uppercase">
              {formatDate(list[0]?.startedAt ?? "", tz)}
            </span>
            <span className="tabular text-meta text-ink-2">
              {hm(totals.get(day)?.seconds ?? 0)} h
            </span>
          </div>
          <ul className="flex flex-col gap-px bg-line-soft">
            {list.map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 bg-panel px-4 py-[11px]"
              >
                <span className="tabular w-[92px] flex-none text-meta text-ink-3">
                  {formatTime(e.startedAt, tz)}–{formatTime(e.endedAt ?? e.startedAt, tz)}
                </span>
                <span className="flex min-w-0 flex-1 basis-[200px] items-baseline gap-2">
                  {e.projectCode === null ? null : <Chip>{e.projectCode}</Chip>}
                  <span className="truncate text-ui text-ink-1">{e.projectName}</span>
                  {e.note === null ? null : (
                    <span className="truncate text-meta text-ink-3">{e.note}</span>
                  )}
                </span>
                {showUser ? <span className="text-meta text-ink-3">{e.userName}</span> : null}
                {e.source === "timer" ? (
                  <span
                    className="text-meta text-ink-3"
                    title="Mit Stoppuhr erfasst"
                    aria-label="Stoppuhr"
                  >
                    ●
                  </span>
                ) : null}
                <span className="tabular w-[52px] flex-none text-right text-ui text-ink-1">
                  {hm(e.durationSeconds)}
                </span>
                {canEditEntry(actor, e) ? (
                  <span className="flex flex-none gap-3">
                    <Link
                      className={COMPACT_ACTION}
                      href={`/zeiten/${e.id}?back=${encodeURIComponent(back)}`}
                    >
                      Bearbeiten
                    </Link>
                    <ConfirmForm action={deleteAction} message="Eintrag löschen?">
                      <input type="hidden" name="id" value={e.id} />
                      <input type="hidden" name="back" value={back} />
                      <button className={COMPACT_ACTION} type="submit">
                        Löschen
                      </button>
                    </ConfirmForm>
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
