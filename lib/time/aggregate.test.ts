import { describe, expect, it } from "vitest";

import { groupSeconds, runningSeconds, secondsPerDay, sumSeconds } from "./aggregate";

const TZ = "Europe/Berlin";
const entries = [
  { projectId: "p1", userId: "u1", startedAt: "2026-09-03T22:30:00.000Z", durationSeconds: 3600 }, // 4.9. 00:30 lokal
  { projectId: "p1", userId: "u2", startedAt: "2026-09-04T07:00:00.000Z", durationSeconds: 1800 },
  { projectId: "p2", userId: "u1", startedAt: "2026-09-05T07:00:00.000Z", durationSeconds: 900 },
];

describe("Aggregation", () => {
  it("summiert", () => {
    expect(sumSeconds(entries)).toBe(6300);
  });

  it("gruppiert nach Projekt", () => {
    const by = groupSeconds(entries, (e) => e.projectId);
    expect(by.get("p1")).toEqual({ seconds: 5400, count: 2 });
    expect(by.get("p2")).toEqual({ seconds: 900, count: 1 });
  });

  it("ordnet Tage in der Zeitzone zu", () => {
    const days = ["2026-09-03", "2026-09-04", "2026-09-05"];
    expect(secondsPerDay(entries, days, TZ)).toEqual([
      { day: "2026-09-03", seconds: 0 },
      { day: "2026-09-04", seconds: 5400 },
      { day: "2026-09-05", seconds: 900 },
    ]);
  });

  it("zählt laufende Sekunden ohne negative Werte", () => {
    expect(runningSeconds("2026-09-04T10:00:00Z", new Date("2026-09-04T10:01:30Z"))).toBe(90);
    expect(runningSeconds("2026-09-04T10:00:00Z", new Date("2026-09-04T09:59:00Z"))).toBe(0);
  });
});
