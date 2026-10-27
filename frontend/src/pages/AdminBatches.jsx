import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../api/admin.js";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import { errorMessage } from "../utils/errors.js";
import "./InstructorConsole.css";
import "./AdminConsole.css";

// All batches with their instructor and student count. The admin creates batches here.
export default function AdminBatches() {
  const [batches, setBatches] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    adminApi
      .batches(showArchived)
      .then(setBatches)
      .catch((err) => setError(errorMessage(err, "Could not load the batches. Please try again.")))
      .finally(() => setLoading(false));
  }, [showArchived]);

  useEffect(load, [load]);

  const columns = [
    {
      key: "name",
      label: "Batch",
      value: (b) => b.name,
      render: (b) => (
        <Link to={`/admin/batches/${b.id}`} className="admin-link">
          {b.name}
        </Link>
      ),
    },
    { key: "year", label: "Academic year", value: (b) => b.academic_year },
    {
      key: "instructor",
      label: "Instructor",
      value: (b) => b.instructor?.full_name || "",
      render: (b) =>
        b.instructor ? (
          <span>
            {b.instructor.full_name}
            {!b.instructor.is_active && <span className="badge badge--gray admin-inline-badge">Deactivated</span>}
          </span>
        ) : (
          <span className="ic-muted">Not assigned</span>
        ),
    },
    { key: "students", label: "Students", value: (b) => b.student_count },
    {
      key: "state",
      label: "Status",
      value: (b) => (b.is_archived ? 1 : 0),
      render: (b) =>
        b.is_archived ? <span className="badge badge--gray">Archived</span> : <span className="badge badge--green">Active</span>,
    },
    {
      key: "open",
      label: "Action",
      value: () => 0,
      render: (b) => (
        <Link to={`/admin/batches/${b.id}`} className="btn btn--sm btn--ghost">
          Open
        </Link>
      ),
    },
  ];

  return (
    <div className="ic-page">
      <div className="ic-header">
        <h1 className="ic-page__title">Batches</h1>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => setCreating(true)}>
          Add batch
        </button>
      </div>

      <label className="admin-check">
        <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
        Show archived batches
      </label>

      {error && (
        <div className="alert alert--error ic-alert">
          <span>{error}</span>
          <button type="button" className="btn btn--sm btn--ghost" onClick={load}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="page-loading">Loading batches…</div>
      ) : (
        !error && (
          <DataTable
            columns={columns}
            rows={batches}
            rowKey={(b) => b.id}
            searchText={(b) => `${b.name} ${b.academic_year} ${b.instructor?.full_name || ""}`}
            searchPlaceholder="Search batches"
            emptyMessage="No batches yet. Use Add batch to create the first one."
            initialSort={{ key: "name", dir: "asc" }}
          />
        )
      )}

      {creating && (
        <BatchForm
          title="Add batch"
          onClose={() => setCreating(false)}
          onSubmit={(values) => adminApi.createBatch(values)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </div>
  );
}

// Name and academic year form, used to add and to edit a batch.
export function BatchForm({ title, initial, onClose, onSubmit, onSaved }) {
  const [form, setForm] = useState({ name: initial?.name || "", academic_year: initial?.academic_year || "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      onSaved(await onSubmit(form));
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form className="admin-form" onSubmit={submit}>
        {error && <div className="alert alert--error">{error}</div>}
        <label className="form-label">
          Batch name
          <input className="form-input" required placeholder="TE-CSE-A" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="form-label">
          Academic year
          <input className="form-input" required placeholder="2026-27" value={form.academic_year} onChange={(e) => setForm({ ...form, academic_year: e.target.value })} />
        </label>
        <div className="admin-form__buttons">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}
