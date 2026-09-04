import { TZDate } from "@date-fns/tz";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  format,
  getISOWeek,
  isValid,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { de } from "date-fns/locale";

export type PeriodKind = "day" | "week" | "month";
export const PERIOD_KINDS: readonly PeriodKind[] = ["day", "week", "month"];

/** Halboffenes Intervall [from, to) als Zeitpunkte. */
export interface Range {
  readonly from: Date;
  readonly to: Date;
}

const DAY = "yyyy-MM-dd";

export function isPeriodKind(value: unknown): value is PeriodKind {
  return value === "day" || value === "week" || value === "month";
}

/** Kalendertag „yyyy-MM-dd" eines Zeitpunkts in der Zeitzone. */
export function dayKey(instant: Date, tz: string): string {
  return format(new TZDate(instant, tz), DAY);
}

export function todayKey(tz: string, now: Date = new Date()): string {
  return dayKey(now, tz);
}

/** Lokale Mitternacht eines Kalendertags; null bei ungültiger Eingabe. */
export function localMidnight(day: string, tz: string): TZDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (m === null) return null;
  const d = new TZDate(Number(m[1]), Number(m[2]) - 1, Number(m[3]), tz);
  return isValid(d) && format(d, DAY) === day ? d : null;
}

/** Zeitpunkt aus Kalendertag und Uhrzeit „HH:mm" in der Zeitzone. */
export function localDateTime(day: string, time: string, tz: string): Date | null {
  const midnight = localMidnight(day, tz);
  const t = /^(\d{2}):(\d{2})$/.exec(time);
  if (midnight === null || t === null) return null;
  const h = Number(t[1]);
  const min = Number(t[2]);
  if (h > 23 || min > 59) return null;
  const d = new TZDate(midnight.getFullYear(), midnight.getMonth(), midnight.getDate(), h, min, tz);
  return new Date(d.getTime());
}

function plain(d: Date): Date {
  return new Date(d.getTime());
}

/** Tag, Woche (Mo–So) oder Monat um den Ankertag. */
export function periodRange(kind: PeriodKind, anchor: string, tz: string): Range {
  const day = localMidnight(anchor, tz) ?? localMidnight(todayKey(tz), tz);
  if (day === null) throw new Error("Ungültiger Ankertag");

  switch (kind) {
    case "day":
      return { from: plain(day), to: plain(addDays(day, 1)) };
    case "week": {
      const from = startOfWeek(day, { weekStartsOn: 1 });
      return { from: plain(from), to: plain(addWeeks(from, 1)) };
    }
    case "month": {
      const from = startOfMonth(day);
      return { from: plain(from), to: plain(addMonths(from, 1)) };
    }
  }
}

/** Ankertag um `delta` Perioden verschieben. */
export function shiftAnchor(kind: PeriodKind, anchor: string, delta: number, tz: string): string {
  const day = localMidnight(anchor, tz) ?? localMidnight(todayKey(tz), tz);
  if (day === null) throw new Error("Ungültiger Ankertag");
  const moved =
    kind === "day"
      ? addDays(day, delta)
      : kind === "week"
        ? addWeeks(day, delta)
        : addMonths(day, delta);
  return format(moved, DAY);
}

/** Lesbare Überschrift des Zeitraums. */
export function periodLabel(kind: PeriodKind, anchor: string, tz: string): string {
  const day = localMidnight(anchor, tz);
  if (day === null) return "";
  switch (kind) {
    case "day":
      return format(day, "EEEE, d. MMMM yyyy", { locale: de });
    case "week": {
      const from = startOfWeek(day, { weekStartsOn: 1 });
      const to = addDays(from, 6);
      const sameMonth = from.getMonth() === to.getMonth();
      return `KW ${getISOWeek(from)} · ${format(from, sameMonth ? "d." : "d. MMM", { locale: de })} – ${format(to, "d. MMM yyyy", { locale: de })}`;
    }
    case "month":
      return format(day, "MMMM yyyy", { locale: de });
  }
}

/** Alle Kalendertage eines Zeitraums, für Diagrammachsen. */
export function daysIn(range: Range, tz: string): string[] {
  const days: string[] = [];
  let cursor = new TZDate(range.from, tz);
  const end = new TZDate(range.to, tz);
  while (cursor.getTime() < end.getTime()) {
    days.push(format(cursor, DAY));
    cursor = addDays(cursor, 1);
  }
  return days;
}

/* ── Presets der Auswertung ─────────────────────────────────────────────── */

export const PRESETS = [
  "today",
  "this_week",
  "this_month",
  "last_month",
  "this_year",
  "all",
  "custom",
] as const;
export type Preset = (typeof PRESETS)[number];

export const PRESET_LABEL: Record<Preset, string> = {
  today: "Heute",
  this_week: "Diese Woche",
  this_month: "Dieser Monat",
  last_month: "Letzter Monat",
  this_year: "Dieses Jahr",
  all: "Gesamt",
  custom: "Zeitraum",
};

export function isPreset(value: unknown): value is Preset {
  return (PRESETS as readonly unknown[]).includes(value);
}

/**
 * Zeitraum eines Presets; `null` bedeutet „ohne Einschränkung". Für `custom`
 * werden `from`/`to` als Kalendertage (einschließlich) erwartet.
 */
export function presetRange(
  preset: Preset,
  tz: string,
  custom: { readonly from?: string; readonly to?: string } = {},
  now: Date = new Date(),
): Range | null {
  const today = todayKey(tz, now);
  switch (preset) {
    case "today":
      return periodRange("day", today, tz);
    case "this_week":
      return periodRange("week", today, tz);
    case "this_month":
      return periodRange("month", today, tz);
    case "last_month":
      return periodRange("month", shiftAnchor("month", today, -1, tz), tz);
    case "this_year": {
      const d = localMidnight(today, tz);
      if (d === null) return null;
      const from = new TZDate(d.getFullYear(), 0, 1, tz);
      const to = new TZDate(d.getFullYear() + 1, 0, 1, tz);
      return { from: plain(from), to: plain(to) };
    }
    case "all":
      return null;
    case "custom": {
      const from = localMidnight(custom.from ?? today, tz);
      const toDay = localMidnight(custom.to ?? custom.from ?? today, tz);
      if (from === null || toDay === null) return null;
      const to = addDays(toDay, 1);
      return from.getTime() < to.getTime()
        ? { from: plain(from), to: plain(to) }
        : { from: plain(from), to: plain(addDays(from, 1)) };
    }
  }
}

/** Zeitraum als Text für Überschrift und Dateiname. */
export function rangeLabel(range: Range | null, tz: string): string {
  if (range === null) return "Gesamter Zeitraum";
  const from = new TZDate(range.from, tz);
  const lastDay = addDays(new TZDate(range.to, tz), -1);
  if (format(from, DAY) === format(lastDay, DAY)) {
    return format(from, "d. MMMM yyyy", { locale: de });
  }
  if (
    from.getDate() === 1 &&
    endOfMonth(from).getDate() === lastDay.getDate() &&
    from.getMonth() === lastDay.getMonth()
  ) {
    return format(from, "MMMM yyyy", { locale: de });
  }
  return `${format(from, "d. MMM yyyy", { locale: de })} – ${format(lastDay, "d. MMM yyyy", { locale: de })}`;
}

export function parseDayInput(value: string | undefined, tz: string): string | null {
  if (value === undefined) return null;
  const d = parse(value, DAY, new Date());
  return isValid(d) && localMidnight(value, tz) !== null ? value : null;
}
