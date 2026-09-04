import { describe, expect, it } from "vitest";

import {
  dayKey,
  daysIn,
  localDateTime,
  periodLabel,
  periodRange,
  presetRange,
  rangeLabel,
  shiftAnchor,
} from "./periods";

const TZ = "Europe/Berlin";

describe("periodRange", () => {
  it("Tag beginnt um lokale Mitternacht (Sommerzeit: 22:00 UTC am Vortag)", () => {
    const r = periodRange("day", "2026-09-04", TZ);
    expect(r.from.toISOString()).toBe("2026-09-03T22:00:00.000Z");
    expect(r.to.toISOString()).toBe("2026-09-04T22:00:00.000Z");
  });

  it("Woche beginnt montags", () => {
    const r = periodRange("week", "2026-09-04", TZ); // Freitag
    expect(dayKey(r.from, TZ)).toBe("2026-08-31");
    expect(dayKey(r.to, TZ)).toBe("2026-09-07");
  });

  it("Monat über den Wechsel Sommer-/Winterzeit ist 31 Tage minus eine Stunde lang", () => {
    const r = periodRange("month", "2026-10-15", TZ);
    expect(r.from.toISOString()).toBe("2026-09-30T22:00:00.000Z");
    expect(r.to.toISOString()).toBe("2026-10-31T23:00:00.000Z");
    expect(daysIn(r, TZ)).toHaveLength(31);
  });
});

describe("shiftAnchor", () => {
  it("blättert Monate ohne Überlauf", () => {
    expect(shiftAnchor("month", "2026-01-31", 1, TZ)).toBe("2026-02-28");
    expect(shiftAnchor("week", "2026-09-04", -1, TZ)).toBe("2026-08-28");
    expect(shiftAnchor("day", "2026-12-31", 1, TZ)).toBe("2027-01-01");
  });
});

describe("periodLabel", () => {
  it("nennt Kalenderwoche und Spanne", () => {
    expect(periodLabel("week", "2026-09-04", TZ)).toBe("KW 36 · 31. Aug. – 6. Sep. 2026");
    expect(periodLabel("month", "2026-09-04", TZ)).toBe("September 2026");
    expect(periodLabel("day", "2026-09-04", TZ)).toBe("Freitag, 4. September 2026");
  });
});

describe("presetRange", () => {
  const now = new Date("2026-09-04T10:00:00Z");

  it("letzter Monat", () => {
    const r = presetRange("last_month", TZ, {}, now);
    expect(r && dayKey(r.from, TZ)).toBe("2026-08-01");
    expect(r && dayKey(r.to, TZ)).toBe("2026-09-01");
  });

  it("gesamt ist offen", () => {
    expect(presetRange("all", TZ, {}, now)).toBeNull();
  });

  it("benutzerdefiniert schließt den Endtag ein", () => {
    const r = presetRange("custom", TZ, { from: "2026-09-01", to: "2026-09-03" }, now);
    expect(r && dayKey(r.to, TZ)).toBe("2026-09-04");
    expect(r && rangeLabel(r, TZ)).toBe("1. Sep. 2026 – 3. Sep. 2026");
  });

  it("ganzer Monat wird als Monat benannt", () => {
    const r = presetRange("this_month", TZ, {}, now);
    expect(r && rangeLabel(r, TZ)).toBe("September 2026");
  });
});

describe("localDateTime", () => {
  it("setzt Uhrzeit in der Zeitzone zusammen", () => {
    expect(localDateTime("2026-01-10", "09:30", TZ)?.toISOString()).toBe(
      "2026-01-10T08:30:00.000Z",
    );
    expect(localDateTime("2026-02-30", "09:30", TZ)).toBeNull();
    expect(localDateTime("2026-01-10", "25:00", TZ)).toBeNull();
  });
});
