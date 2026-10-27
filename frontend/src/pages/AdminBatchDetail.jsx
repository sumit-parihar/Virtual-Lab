import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminApi } from "../api/admin.js";
import AddStudent from "../components/admin/AddStudent.jsx";
import ImportStudents from "../components/admin/ImportStudents.jsx";
import StudentTable from "../components/admin/StudentTable.jsx";
import { errorMessage } from "../utils/errors.js";
import { BatchForm } from "./AdminBatches.jsx";
import "./InstructorConsole.css";
import "./AdminConsole.css";

// One batch: its details, its single instructor, a student import and the enrolled students.
export default function AdminBatchDetail() {
  const { batchId } = useParams();
  const [batch, setBatch] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [choice, setChoice] = useState("");

  const load = useCallback(() => {
    setError("");
    return Promise.all([adminApi.batch(batchId), adminApi.instructors()])
      .then(([b, i]) => {
        setBatch(b);
        setInstructors(i);
      })
      .catch((err) => setError(errorMessage(err, "Could not load this batch. Please try again.")))
      .finally(() => setLoading(false));
  }, [batchId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  async function run(action, success) {
    setNotice(null);
    try {
      await action();
      setNotice({ type: "success", text: success });
      setChoice("");
      await load();
    } catch (err) {
      setNotice({ type: "error", text: errorMessage(err) });
    }
  }

  if (loading) return <div className="page-loading">Loading batch…</div>;

  if (error || !batch) {
    return (
      <div className="ic-page">
        <Link to="/admin/batches" className="ic-back">← All batches</Link>
        <div className="alert alert--error ic-alert">
          <span>{error || "Batch not found."}</span>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => { setLoading(true); load(); }}>Retry</button>
        </div>
      </div>
    );
  }

  const current = batch.instructor;
  const choices = instructors.filter((i) => i.is_active && i.id !== current?.id);

  return (
    <div className="ic-page">
      <Link to="/admin/batches" className="ic-back">← All batches</Link>
      <div className="ic-header">
        <h1 className="ic-page__title">
          {batch.name} <span className="ic-muted admin-year">({batch.academic_year})</span>
          {batch.is_archived && <span className="badge badge--gray admin-inline-badge">Archived</span>}
        </h1>
        <div className="admin-actions">
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => setEditing(true)}>Edit</button>
          {batch.is_archived ? (
            <button type="button" className="btn btn--sm btn--primary" onClick={() => run(() => adminApi.restoreBatch(batch.id), "The batch was restored.")}>Restore</button>
          ) : (
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() =>
                window.confirm("Archive this batch? It is hidden from the lists and from the instructor, and nothing is deleted. You can restore it later.") &&
                run(() => adminApi.archiveBatch(batch.id), "The batch was archived.")
              }
            >
              Archive
            </button>
          )}
        </div>
      </div>

      {notice && <div className={`alert alert--${notice.type}`}>{notice.text}</div>}

      <section className="card admin-card">
        <h2 className="admin-card__title">Instructor</h2>
        {current ? (
          <p>
            <strong>{current.full_name}</strong>
            {!current.is_active && <span className="badge badge--gray admin-inline-badge">Deactivated</span>}
          </p>
        ) : (
          <p className="ic-muted">No instructor is assigned to this batch yet.</p>
        )}
        {current && !current.is_active && (
          <div className="alert alert--warning">This instructor is deactivated and cannot log in. Please assign a new instructor.</div>
        )}

        {!batch.is_archived && (
          <div className="admin-toolbar">
            <select className="form-select admin-select" value={choice} onChange={(e) => setChoice(e.target.value)} aria-label="Instructor">
              <option value="">{current ? "Replace with…" : "Select an instructor"}</option>
              {choices.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.full_name} ({i.email})
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn--sm btn--primary"
              disabled={!choice}
              onClick={() => run(() => adminApi.setInstructor(batch.id, choice), current ? "The instructor was replaced." : "The instructor was assigned.")}
            >
              {current ? "Replace instructor" : "Assign instructor"}
            </button>
            {current && (
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={() =>
                  window.confirm(`Remove ${current.full_name} from this batch? The batch will have no instructor.`) &&
                  run(() => adminApi.removeInstructor(batch.id), "The instructor was removed.")
                }
              >
                Remove instructor
              </button>
            )}
          </div>
        )}
      </section>

      <ImportStudents batch={batch} onImported={load} />

      <section className="admin-card">
        <div className="ic-header">
          <h2 className="admin-card__title">Students ({batch.student_count})</h2>
          {!batch.is_archived && (
            <button type="button" className="btn btn--sm btn--primary" onClick={() => setAdding(true)}>
              Add student
            </button>
          )}
        </div>
        <StudentTable
          students={batch.students}
          onChanged={load}
          emptyMessage="No students are enrolled in this batch yet. Add them with a file above."
        />
      </section>

      {adding && (
        <AddStudent
          batch={batch}
          onClose={() => setAdding(false)}
          onAdded={(s) => {
            setAdding(false);
            setNotice({ type: "success", text: `${s.full_name} was added. A temporary password is being emailed to ${s.email}.` });
            load();
          }}
        />
      )}

      {editing && (
        <BatchForm
          title="Edit batch"
          initial={batch}
          onClose={() => setEditing(false)}
          onSubmit={(values) => adminApi.updateBatch(batch.id, values)}
          onSaved={() => {
            setEditing(false);
            setNotice({ type: "success", text: "Saved." });
            load();
          }}
        />
      )}
    </div>
  );
}
