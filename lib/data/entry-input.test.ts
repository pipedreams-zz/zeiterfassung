import { describe, expect, it } from "vitest";

import { parseEntry } from "./entry-input";

const TZ = "Europe/Berlin";
const now = new Date("2026-09-04T12:00:00Z");
const base = { projectId: "p1", day: "2026-09-04", from: "", to: "", duration: "", note: "" };

describe("parseEntry", () => {
  it("Von/Bis ergibt die Dauer", () => {
    const r = parseEntry({ ...base, from: "09:00", to: "11:30" }, TZ, now);
    expect(r.ok && r.input.startedAt.toISOString()).toBe("2026-09-04T07:00:00.000Z");
    expect(r.ok && r.input.endedAt.toISOString()).toBe("2026-09-04T09:30:00.000Z");
  });

  it("Bis vor Von endet am Folgetag", () => {
    const r = parseEntry({ ...base, day: "2026-09-03", from: "22:00", to: "01:00" }, TZ, now);
    expect(r.ok && r.input.endedAt.toISOString()).toBe("2026-09-03T23:00:00.000Z");
  });

  it("nur Dauer beginnt um 08:00", () => {
    const r = parseEntry({ ...base, duration: "1:30" }, TZ, now);
    expect(r.ok && r.input.startedAt.toISOString()).toBe("2026-09-04T06:00:00.000Z");
    expect(r.ok && r.input.endedAt.toISOString()).toBe("2026-09-04T07:30:00.000Z");
  });

  it("lehnt Zukunft, Überlänge und leere Angaben ab", () => {
    expect(parseEntry({ ...base, from: "15:00", to: "16:00" }, TZ, now)).toMatchObject({ ok: false });
    expect(parseEntry({ ...base, duration: "25h" }, TZ, now)).toMatchObject({ ok: false });
    expect(parseEntry(base, TZ, now)).toMatchObject({ ok: false, error: "Gib Von und Bis oder eine Dauer an." });
    expect(parseEntry({ ...base, projectId: "" }, TZ, now)).toMatchObject({ ok: false });
  });
});
