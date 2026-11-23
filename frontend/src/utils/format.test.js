import { formatScore, scoreTone } from "./format.js";

describe("scoreTone", () => {
  it("bands scores at 70 and 40, and is neutral without a score", () => {
    expect(scoreTone(100)).toBe("good");
    expect(scoreTone(70)).toBe("good");
    expect(scoreTone(69.99)).toBe("mid");
    expect(scoreTone(40)).toBe("mid");
    expect(scoreTone(39)).toBe("low");
    expect(scoreTone(0)).toBe("low");
    expect(scoreTone(null)).toBe("neutral");
    expect(scoreTone(undefined)).toBe("neutral");
  });
});

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
