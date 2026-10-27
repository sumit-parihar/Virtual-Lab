import { formatScore } from "./format.js";

describe("formatScore", () => {
  it("shows whole numbers without decimals", () => {
    expect(formatScore(100)).toBe("100%");
    expect(formatScore(0)).toBe("0%");
  });

  it("rounds to two decimals", () => {
    expect(formatScore(66.6666)).toBe("66.67%");
    expect(formatScore(80.5)).toBe("80.5%");
  });
});
