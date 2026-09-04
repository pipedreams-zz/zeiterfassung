import { addDays } from "date-fns";

import type { EntryInput } from "./entries";
import { parseDuration } from "../time/duration";
import { localDateTime, localMidnight } from "../time/periods";

export const MAX_ENTRY_SECONDS = 24 * 3600;
export const DEFAULT_START = "08:00";

export interface EntryFormValues {
  readonly projectId: string;
  readonly day: string;
  readonly from: string;
  readonly to: string;
  readonly duration: string;
  readonly note: string;
}

export type ParsedEntry = { readonly ok: true; readonly input: EntryInput } | { readonly ok: false; readonly error: string };

/**
 * Regeln einer manuellen Buchung: „Von" und „Bis" ergeben die Dauer; liegt
 * „Bis" vor „Von", endet der Eintrag am Folgetag. Nur eine Dauer setzt den
 * Beginn auf „Von" oder 08:00. Höchstens 24 Stunden, nicht in der Zukunft.
 */
export function parseEntry(values: EntryFormValues, tz: string, now: Date = new Date()): ParsedEntry {
  if (values.projectId === "") return { ok: false, error: "Wähle ein Projekt." };
  if (localMidnight(values.day, tz) === null) return { ok: false, error: "Datum ist ungültig." };

  const hasFrom = values.from !== "";
  const hasTo = values.to !== "";
  const hasDuration = values.duration !== "";

  let start: Date | null;
  let end: Date | null;

  if (hasFrom && hasTo) {
    start = localDateTime(values.day, values.from, tz);
    end = localDateTime(values.day, values.to, tz);
    if (start === null || end === null) return { ok: false, error: "Uhrzeit ist ungültig." };
    if (end.getTime() <= start.getTime()) end = addDays(end, 1);
  } else if (hasDuration) {
    const seconds = parseDuration(values.duration);
    if (seconds === null) return { ok: false, error: "Dauer nicht lesbar. Beispiele: 1:30, 1,5 oder 90m." };
    start = localDateTime(values.day, hasFrom ? values.from : DEFAULT_START, tz);
    if (start === null) return { ok: false, error: "Uhrzeit ist ungültig." };
    end = new Date(start.getTime() + seconds * 1000);
  } else {
    return { ok: false, error: "Gib Von und Bis oder eine Dauer an." };
  }

  const seconds = Math.floor((end.getTime() - start.getTime()) / 1000);
  if (seconds < 60) return { ok: false, error: "Ein Eintrag dauert mindestens eine Minute." };
  if (seconds > MAX_ENTRY_SECONDS) return { ok: false, error: "Ein Eintrag dauert höchstens 24 Stunden." };
  if (start.getTime() > now.getTime() + 5 * 60 * 1000) return { ok: false, error: "Der Beginn liegt in der Zukunft." };

  return {
    ok: true,
    input: { projectId: values.projectId, startedAt: start, endedAt: end, note: values.note === "" ? null : values.note },
  };
}
