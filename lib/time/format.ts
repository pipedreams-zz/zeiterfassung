import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { de } from "date-fns/locale";

/** „7:05" — Stunden und Minuten. */
export function hm(seconds: number): string {
  const total = Math.round(seconds / 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

/** „0:05:09" — für die laufende Stoppuhr. */
export function hms(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** „7,08" — Dezimalstunden mit Komma, für Abrechnung. */
export function decimalHours(seconds: number, digits = 2): string {
  return (seconds / 3600).toFixed(digits).replace(".", ",");
}

export function formatTime(iso: string, tz: string): string {
  return format(new TZDate(iso, tz), "HH:mm");
}

export function formatDate(iso: string, tz: string): string {
  return format(new TZDate(iso, tz), "EEE, d. MMM yyyy", { locale: de });
}

export function formatDateShort(day: string): string {
  const [y, m, d] = day.split("-");
  return `${Number(d)}.${Number(m)}.${y}`;
}

export function formatDateTime(iso: string, tz: string): string {
  return format(new TZDate(iso, tz), "d. MMM yyyy, HH:mm", { locale: de });
}
