import { useState } from "react";
import { adminApi } from "../../api/admin.js";
import { csvBlob, saveBlob } from "../../utils/download.js";
import { errorMessage } from "../../utils/errors.js";

const STATUS = {
  ready: { label: "Ready", cls: "badge--green" },
  created: { label: "Created", cls: "badge--green" },
  enrolled: { label: "Added", cls: "badge--green" },
  skipped: { label: "Skipped", cls: "badge--yellow" },
  invalid: { label: "Invalid", cls: "badge--red" },
};

// Add students to a batch from a CSV or Excel file: check the file first, then import the good rows.
export default function ImportStudents({ batch, onImported }) {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null); // preview or import result
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setFile(null);
    setResult(null);
    setError("");
  }

  async function call(kind) {
    setBusy(true);
    setError("");
    try {
      const data = await adminApi.importFile(batch.id, kind, file);
      setResult(data);
      if (kind === "import") onImported();
    } catch (err) {
      setError(errorMessage(err, "The file could not be processed."));
    } finally {
      setBusy(false);
    }
  }

  async function downloadTemplate() {
    try {
      saveBlob(await adminApi.downloadTemplate(), "student_import_template.xlsx");
    } catch (err) {
      setError(errorMessage(err, "The template could not be downloaded."));
    }
  }

  function downloadProblems() {
    const problems = result.rows.filter((r) => r.status === "skipped" || r.status === "invalid");
    const blob = csvBlob(
      ["Row", "URN", "Name", "Email", "Status", "Reason"],
      problems.map((r) => [r.row, r.urn, r.name, r.email, STATUS[r.status].label, r.reason])
    );
    saveBlob(blob, `rows_not_imported_${batch.name}.csv`.replace(/[^A-Za-z0-9_.-]+/g, "_"));
  }

  const problems = result ? result.skipped + result.invalid : 0;

  return (
    <section className="card admin-card">
      <h2 className="admin-card__title">Add students</h2>
      <p className="ic-muted">
        Upload a CSV or Excel file with the columns <strong>URN</strong>, <strong>Name</strong> and <strong>Email</strong>.
        New students receive a temporary password by email. Check the file first; rows with problems are skipped.
      </p>

      {batch.is_archived ? (
        <div className="alert alert--warning">This batch is archived. Restore it to add students.</div>
      ) : (
        <>
          {error && <div className="alert alert--error">{error}</div>}
          <div className="admin-toolbar">
            <input
              key={result ? "done" : "pick"}
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => {
                setFile(e.target.files[0] || null);
                setResult(null);
                setError("");
              }}
            />
            <button type="button" className="btn btn--sm btn--primary" disabled={!file || busy || (result && !result.preview)} onClick={() => call("preview")}>
              {busy && !result ? "Checking…" : "Check file"}
            </button>
            <button type="button" className="btn btn--sm btn--ghost" onClick={downloadTemplate}>Download template</button>
          </div>
        </>
      )}

      {result && (
        <div className="admin-import">
          <div className="admin-import__summary">
            {result.preview ? (
              <strong>{result.ready} of {result.total} rows are ready to import.</strong>
            ) : (
              <strong>Import finished: {result.ready} added, {problems} not imported.</strong>
            )}
            <span className="ic-muted"> Skipped: {result.skipped} · Invalid: {result.invalid}</span>
          </div>

          <div className="ic-table-wrap admin-import__table">
            <table className="ic-table">
              <thead>
                <tr><th>Row</th><th>URN</th><th>Name</th><th>Email</th><th>Result</th><th>Reason</th></tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.row}>
                    <td>{r.row}</td>
                    <td>{r.urn || "—"}</td>
                    <td>{r.name || "—"}</td>
                    <td>{r.email || "—"}</td>
                    <td><span className={`badge ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span></td>
                    <td>{r.reason || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-toolbar">
            {result.preview && (
              <button type="button" className="btn btn--primary" disabled={busy || result.ready === 0} onClick={() => call("import")}>
                {busy ? "Importing…" : `Import ${result.ready} student${result.ready === 1 ? "" : "s"}`}
              </button>
            )}
            {problems > 0 && (
              <button type="button" className="btn btn--ghost" onClick={downloadProblems}>Download rows with problems (CSV)</button>
            )}
            <button type="button" className="btn btn--ghost" onClick={reset}>{result.preview ? "Cancel" : "Add another file"}</button>
          </div>
          {result.preview && problems > 0 && (
            <p className="ic-muted">Rows with problems will be skipped. Fix them in the file and upload them again later.</p>
          )}
        </div>
      )}
    </section>
  );
}
