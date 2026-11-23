// Read a simple CSV file (header row, comma-separated, no quoted commas) as used by the
// dataset files in public/datasets/. Returns the header and the rows as arrays of strings.
export function parseCsv(text) {
  const lines = text
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");
  if (lines.length === 0) return { header: [], rows: [] };
  const split = (line) => line.split(",").map((cell) => cell.trim());
  return { header: split(lines[0]), rows: lines.slice(1).map(split) };
}
