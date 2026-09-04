/**
 * Dauer aus Benutzereingabe: „1:30", „1:30 h", „1,5", „1.5", „90m", „90 min",
 * „2h". Ergebnis in Sekunden, auf ganze Minuten; null bei Unsinn.
 */
export function parseDuration(input: string): number | null {
  const s = input.trim().toLowerCase().replace(/\s+/g, "");
  if (s === "") return null;

  let m = /^(\d{1,3}):(\d{1,2})h?$/.exec(s);
  if (m !== null) {
    const min = Number(m[2]);
    if (min > 59) return null;
    return (Number(m[1]) * 60 + min) * 60;
  }

  m = /^(\d+)(?:m|min)$/.exec(s);
  if (m !== null) return Number(m[1]) * 60;

  m = /^(\d+(?:[.,]\d+)?)h?$/.exec(s);
  if (m !== null) {
    const hours = Number((m[1] ?? "0").replace(",", "."));
    return Math.round(hours * 60) * 60;
  }

  return null;
}
