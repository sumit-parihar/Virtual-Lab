import { useState } from "react";
import { adminApi } from "../../api/admin.js";
import { errorMessage } from "../../utils/errors.js";
import Modal from "../Modal.jsx";

// Add one student by hand. The same checks as the import file apply.
// Pass `batch` to fix the batch (batch page) or `batches` to let the admin pick one (Students page).
export default function AddStudent({ batch, batches = [], onClose, onAdded }) {
  const [form, setForm] = useState({ roll_number: "", full_name: "", email: "", batch_id: batch?.id || "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      onAdded(await adminApi.addStudent(form));
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal title="Add student" onClose={onClose}>
      <form className="admin-form" onSubmit={submit}>
        {error && <div className="alert alert--error">{error}</div>}
        {batch ? (
          <p className="ic-muted">
            Batch: <strong>{batch.name}</strong> ({batch.academic_year})
          </p>
        ) : (
          <label className="form-label">
            Batch
            <select className="form-select" required value={form.batch_id} onChange={set("batch_id")}>
              <option value="">Select a batch</option>
              {batches.filter((b) => !b.is_archived).map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.academic_year})</option>
              ))}
            </select>
          </label>
        )}
        <label className="form-label">URN<input className="form-input" required value={form.roll_number} onChange={set("roll_number")} /></label>
        <label className="form-label">Name<input className="form-input" required value={form.full_name} onChange={set("full_name")} /></label>
        <label className="form-label">Email<input className="form-input" type="email" required value={form.email} onChange={set("email")} /></label>
        <p className="ic-muted">A random temporary password is emailed to the student, who must change it at the first login.</p>
        <div className="admin-form__buttons">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? "Adding…" : "Add student"}</button>
        </div>
      </form>
    </Modal>
  );
}
