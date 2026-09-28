import { describe, expect, it } from "vitest";
import { findDashes } from "./check-dashes.mjs";

describe("findDashes", () => {
  it("reports em and en dashes with line and column", () => {
    const EM = String.fromCharCode(0x2014);
    const EN = String.fromCharCode(0x2013);
    const text = `a ${EM} b\nplain line\nx ${EN} y`;
    expect(findDashes(text)).toEqual([
      { line: 1, col: 3 },
      { line: 3, col: 3 },
    ]);
  });

  it("ignores hyphens and minus signs", () => {
    expect(findDashes("a - b, 3-4, -1")).toEqual([]);
  });
});
