import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../api/admin.js";
import AddStudent from "../components/admin/AddStudent.jsx";
import StudentTable from "../components/admin/StudentTable.jsx";
import { errorMessage } from "../utils/errors.js";
import "./InstructorConsole.css";
import "./AdminConsole.css";

// All students, optionally for one batch. Students are added to a batch from the batch page.
export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    adminApi.batches(true).then(setBatches).catch(() => setBatches([]));
  }, []);

  const load = useCallback(() => {
    setError("");
    return adminApi
      .students(batchId ? { batch_id: batchId } : {})
      .then(setStudents)
      .catch((err) => setError(errorMessage(err, "Could not load the students. Please try again.")))
      .finally(() => setLoading(false));
  }, [batchId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  return (
    <div className="ic-page">
      <div className="ic-header">
        <h1 className="ic-page__title">Students</h1>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => setAdding(true)}>
          Add student
        </button>
      </div>

      {notice && <div className="alert alert--success">{notice}</div>}

      <div className="admin-toolbar">
        <label className="form-label admin-inline-label">
          Batch
          <select className="form-select admin-select" value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            <option value="">All batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.academic_year}){b.is_archived ? " – archived" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className="alert alert--error ic-alert">
          <span>{error}</span>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => { setLoading(true); load(); }}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="page-loading">Loading students…</div>
      ) : (
        !error && (
          <StudentTable
            students={students}
            onChanged={load}
            showBatch
            emptyMessage="No students found. Add students from a batch page."
          />
        )
      )}

      {adding && (
        <AddStudent
          batches={batches}
          onClose={() => setAdding(false)}
          onAdded={(s) => {
            setAdding(false);
            setNotice(`${s.full_name} was added. A temporary password is being emailed to ${s.email}.`);
            load();
          }}
        />
      )}
    </div>
  );
}
