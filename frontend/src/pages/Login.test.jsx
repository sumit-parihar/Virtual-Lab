import { safeNext } from "./Login.jsx";

describe("safeNext (where to go after signing in)", () => {
  it("returns to a page inside the app", () => {
    expect(safeNext("/experiments/simple-linear-regression?section=code")).toBe(
      "/experiments/simple-linear-regression?section=code",
    );
  });

  it("never sends the user to another site", () => {
    expect(safeNext("https://evil.example.com")).toBe("/");
    expect(safeNext("//evil.example.com")).toBe("/");
    expect(safeNext("javascript:alert(1)")).toBe("/");
  });

  it("goes Home when nothing was asked for", () => {
    expect(safeNext(null)).toBe("/");
    expect(safeNext("")).toBe("/");
  });
});
