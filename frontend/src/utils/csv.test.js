import { parseCsv } from "./csv.js";

describe("parseCsv", () => {
  it("returns the header and the rows as strings", () => {
    expect(parseCsv("YearsExperience,Salary\n1.2,39344\n1.4,46206\n")).toEqual({
      header: ["YearsExperience", "Salary"],
      rows: [
        ["1.2", "39344"],
        ["1.4", "46206"],
      ],
    });
  });

  it("handles Windows line endings, a BOM and blank lines", () => {
    expect(parseCsv("﻿a,b\r\n1,2\r\n\r\n3,4\r\n")).toEqual({
      header: ["a", "b"],
      rows: [
        ["1", "2"],
        ["3", "4"],
      ],
    });
  });

  it("returns nothing for an empty file", () => {
    expect(parseCsv("")).toEqual({ header: [], rows: [] });
  });
});
