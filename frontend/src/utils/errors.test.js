import { errorMessage } from "./errors.js";

describe("errorMessage", () => {
  it("uses the text the server sent", () => {
    expect(errorMessage({ response: { data: { detail: "Already in this batch" } } })).toBe("Already in this batch");
  });

  it("joins validation messages", () => {
    const err = { response: { data: { detail: [{ msg: "bad email" }, { msg: "too short" }] } } };
    expect(errorMessage(err)).toBe("bad email; too short");
  });

  it("falls back when there is no detail", () => {
    expect(errorMessage(new Error("network"))).toMatch(/something went wrong/i);
    expect(errorMessage({}, "Custom")).toBe("Custom");
  });
});
