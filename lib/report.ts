import { listEntriesAscending, type EntryRow } from "./data/entries";
import { allProjectOptions } from "./data/projects";
import { memberOptions } from "./data/members";
import type { Actor } from "./permissions";
import { canSeeAllEntries, entryScope } from "./permissions";
import { groupSeconds, sumSeconds } from "./time/aggregate";
import { formatDate } from "./time/format";
import {
  dayKey,
  isPreset,
  parseDayInput,
  presetRange,
  PRESET_LABEL,
  rangeLabel,
  type Preset,
} from "./time/periods";

export const GROUPINGS = ["project", "user", "day"] as const;
export type Grouping = (typeof GROUPINGS)[number];
export const GROUPING_LABEL: Record<Grouping, string> = {
  project: "Projekt",
  user: "Person",
  day: "Tag",
};

export interface ReportQuery {
  readonly preset: Preset;
  readonly from: string | null;
  readonly to: string | null;
  readonly projectIds: readonly string[];
  readonly userId: string | null;
  readonly group: Grouping;
}

type Params = Record<string, string | string[] | undefined>;

function all(params: Params, key: string): string[] {
  const v = params[key];
  return v === undefined ? [] : Array.isArray(v) ? v : [v];
}

function one(params: Params, key: string): string | undefined {
  const v = params[key];
  return Array.isArray(v) ? v[0] : v;
}

export function parseReportQuery(params: Params, tz: string): ReportQuery {
  const from = parseDayInput(one(params, "from"), tz);
  const to = parseDayInput(one(params, "to"), tz);
  const rawPreset = one(params, "preset");
  const preset: Preset = isPreset(rawPreset)
    ? rawPreset
    : from !== null || to !== null
      ? "custom"
      : "this_month";
  const rawGroup = one(params, "gruppe");
  const group: Grouping = (GROUPINGS as readonly string[]).includes(rawGroup ?? "")
    ? (rawGroup as Grouping)
    : "project";
  const userId = one(params, "person");
  return {
    preset,
    from,
    to,
    projectIds: all(params, "projekt").filter((p) => p !== ""),
    userId: userId === undefined || userId === "" ? null : userId,
    group,
  };
}

export function reportQueryString(q: ReportQuery): string {
  const sp = new URLSearchParams();
  sp.set("preset", q.preset);
  if (q.from !== null) sp.set("from", q.from);
  if (q.to !== null) sp.set("to", q.to);
  for (const p of q.projectIds) sp.append("projekt", p);
  if (q.userId !== null) sp.set("person", q.userId);
  sp.set("gruppe", q.group);
  return sp.toString();
}

export interface ReportGroup {
  readonly key: string;
  readonly label: string;
  readonly sublabel: string | null;
  readonly seconds: number;
  readonly entries: readonly EntryRow[];
}

export interface Report {
  readonly query: ReportQuery;
  readonly organizationName: string;
  readonly periodLabel: string;
  readonly projectLabel: string;
  readonly personLabel: string;
  readonly groupLabel: string;
  readonly groups: readonly ReportGroup[];
  readonly totalSeconds: number;
  readonly entryCount: number;
  readonly generatedAt: string;
}

export function buildReport(actor: Actor, rawQuery: ReportQuery, tz: string): Report {
  // Mitarbeiter: kein Personenfilter, keine Gruppierung nach Person.
  const query: ReportQuery = canSeeAllEntries(actor)
    ? rawQuery
    : { ...rawQuery, userId: null, group: rawQuery.group === "user" ? "project" : rawQuery.group };
  const range = presetRange(query.preset, tz, {
    ...(query.from === null ? {} : { from: query.from }),
    ...(query.to === null ? {} : { to: query.to }),
  });
  const entries = listEntriesAscending(entryScope(actor), {
    range,
    projectIds: query.projectIds,
    ...(query.userId === null ? {} : { userId: query.userId }),
  });

  const projects = allProjectOptions(actor.organizationId);
  const members = memberOptions(actor.organizationId);
  const chosen = projects.filter((p) => query.projectIds.includes(p.id));
  const projectLabel = chosen.length === 0 ? "Alle Projekte" : chosen.map((p) => p.name).join(", ");
  const person = members.find((m) => m.id === query.userId);
  const personLabel = !canSeeAllEntries(actor)
    ? actor.name
    : person === undefined
      ? "Alle Personen"
      : person.name;

  const keyOf = (e: EntryRow): string =>
    query.group === "project"
      ? e.projectId
      : query.group === "user"
        ? e.userId
        : dayKey(new Date(e.startedAt), tz);
  const sums = groupSeconds(entries, keyOf);
  const order: string[] = [];
  const byKey = new Map<string, EntryRow[]>();
  for (const e of entries) {
    const k = keyOf(e);
    if (!byKey.has(k)) {
      byKey.set(k, []);
      order.push(k);
    }
    byKey.get(k)?.push(e);
  }

  let groups: ReportGroup[] = order.map((key) => {
    const list = byKey.get(key) ?? [];
    const first = list[0];
    const label =
      query.group === "project"
        ? (first?.projectName ?? key)
        : query.group === "user"
          ? (first?.userName ?? key)
          : formatDate(first?.startedAt ?? "", tz);
    const sublabel = query.group === "project" ? (first?.projectCode ?? null) : null;
    return { key, label, sublabel, seconds: sums.get(key)?.seconds ?? 0, entries: list };
  });
  if (query.group !== "day") groups = groups.sort((a, b) => a.label.localeCompare(b.label, "de"));

  return {
    query,
    organizationName: actor.organizationName,
    periodLabel:
      query.preset === "custom" || query.preset === "all"
        ? rangeLabel(range, tz)
        : `${PRESET_LABEL[query.preset]} · ${rangeLabel(range, tz)}`,
    projectLabel,
    personLabel,
    groupLabel: GROUPING_LABEL[query.group],
    groups,
    totalSeconds: sumSeconds(entries),
    entryCount: entries.length,
    generatedAt: new Date().toISOString(),
  };
}
