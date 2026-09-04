import { describe, expect, it } from "vitest";

import { parseDuration } from "./duration";

describe("parseDuration", () => {
  it("versteht h:mm, Dezimal und Minuten", () => {
    expect(parseDuration("1:30")).toBe(5400);
    expect(parseDuration("0:05")).toBe(300);
    expect(parseDuration("1,5")).toBe(5400);
    expect(parseDuration("1.25 h")).toBe(4500);
    expect(parseDuration("2h")).toBe(7200);
    expect(parseDuration("90m")).toBe(5400);
    expect(parseDuration("90 min")).toBe(5400);
  });

  it("lehnt Unsinn ab", () => {
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("1:75")).toBeNull();
    expect(parseDuration("abc")).toBeNull();
  });
});
