import { csvBlob, excelFileName } from "./download.js";

const readText = (blob) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsText(blob);
  });

describe("excelFileName", () => {
  it("builds a safe file name", () => {
    expect(excelFileName({ name: "TE CSE/A", academic_year: "2026-27" }, 8, "status")).toBe(
      "batch_TE_CSE_A_2026-27_experiment_8_status.xlsx"
    );
  });
});

describe("csvBlob", () => {
  it("quotes every cell and escapes quotes", async () => {
    const blob = csvBlob(["Row", "Name"], [[2, 'He said "hi"'], [3, null]]);
    const text = await readText(blob);
    expect(text).toContain('"Row","Name"');
    expect(text).toContain('"2","He said ""hi"""');
    expect(text).toContain('"3",""');
    expect(blob.type).toMatch(/text\/csv/);
  });
});
