// Save a Blob as a file and build a safe Excel file name for the instructor downloads.
export function saveBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// Mirrors the server's file name: batch_<name>_<year>_experiment_<n>_<kind>.xlsx
export function excelFileName(batch, experimentNumber, kind) {
  const safe = `${batch.name}_${batch.academic_year}`.replace(/[^A-Za-z0-9_-]+/g, "_");
  return `batch_${safe}_experiment_${experimentNumber}_${kind}.xlsx`;
}

// Build a CSV file (text) from a header row and rows; every cell is quoted.
export function csvBlob(header, rows) {
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [header, ...rows].map((r) => r.map(cell).join(","));
  return new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
}
