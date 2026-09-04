import { describe, expect, it } from "vitest";

import { decimalHours, hm, hms } from "./format";

describe("Dauerformate", () => {
  it("h:mm rundet auf Minuten", () => {
    expect(hm(0)).toBe("0:00");
    expect(hm(3600 * 7 + 5 * 60 + 29)).toBe("7:05");
    expect(hm(3600 * 7 + 5 * 60 + 31)).toBe("7:06");
  });

  it("h:mm:ss", () => {
    expect(hms(3725)).toBe("1:02:05");
  });

  it("Dezimalstunden mit Komma", () => {
    expect(decimalHours(5400)).toBe("1,50");
  });
});
