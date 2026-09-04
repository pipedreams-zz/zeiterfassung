import { dayKey, type Range } from "./periods";

export interface EntryLike {
  readonly projectId: string;
  readonly userId: string;
  readonly startedAt: string;
  readonly durationSeconds: number;
}

export interface Bucket {
  readonly seconds: number;
  readonly count: number;
}

export function sumSeconds(entries: readonly { readonly durationSeconds: number }[]): number {
  return entries.reduce((acc, e) => acc + e.durationSeconds, 0);
}

export function groupSeconds<T extends { readonly durationSeconds: number }>(
  entries: readonly T[],
  key: (entry: T) => string,
): Map<string, Bucket> {
  const map = new Map<string, Bucket>();
  for (const e of entries) {
    const k = key(e);
    const prev = map.get(k) ?? { seconds: 0, count: 0 };
    map.set(k, { seconds: prev.seconds + e.durationSeconds, count: prev.count + 1 });
  }
  return map;
}

/**
 * Sekunden je Kalendertag im Zeitraum. Ein Eintrag zählt zu dem Tag, an dem
 * er begonnen hat — einfach und für Tagesbuchungen richtig; Nachtschichten
 * über Mitternacht bleiben ungeteilt.
 */
export function secondsPerDay(
  entries: readonly EntryLike[],
  days: readonly string[],
  tz: string,
): { readonly day: string; readonly seconds: number }[] {
  const by = groupSeconds(entries, (e) => dayKey(new Date(e.startedAt), tz));
  return days.map((day) => ({ day, seconds: by.get(day)?.seconds ?? 0 }));
}

/** Laufende Sekunden einer Stoppuhr. */
export function runningSeconds(startedAt: string, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(startedAt).getTime()) / 1000));
}

/** Überschneidet ein Eintrag den Zeitraum? Null-Zeitraum = alles. */
export function inRange(entry: { readonly startedAt: string }, range: Range | null): boolean {
  if (range === null) return true;
  const t = new Date(entry.startedAt).getTime();
  return t >= range.from.getTime() && t < range.to.getTime();
}
