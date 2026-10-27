import { useEffect, useState } from "react";
import { adminApi } from "../../api/admin.js";
import { errorMessage } from "../../utils/errors.js";
import DataTable from "../DataTable.jsx";
import Modal from "../Modal.jsx";
import { AccountStatus } from "./AccountBadges.jsx";

// Students with their account state and the admin actions: edit, move, resend invitation, deactivate.
export default function StudentTable({ students, onChanged, showBatch = false, emptyMessage }) {
  const [notice, setNotice] = useState(null); // { type: "success" | "error", text }
  const [editing, setEditing] = useState(null);
  const [moving, setMoving] = useState(null);

  async function run(action, success) {
    setNotice(null);
    try {
      const result = await action();
      setNotice({ type: "success", text: typeof success === "function" ? success(result) : success });
      onChanged();
    } catch (err) {
      setNotice({ type: "error", text: errorMessage(err) });
    }
  }

  function toggleActive(s) {
    if (s.is_active) {
      if (!window.confirm(`Deactivate ${s.full_name}? They will not be able to log in. Their records are kept.`)) return;
      run(() => adminApi.deactivate(s.id), `${s.full_name} was deactivated.`);
    } else {
      run(() => adminApi.reactivate(s.id), `${s.full_name} was reactivated.`);
    }
  }

  function resend(s) {
    if (!window.confirm(`Send ${s.full_name} a new temporary password by email? Their current password stops working.`)) return;
    run(() => adminApi.resendInvitation(s.id), (u) =>
      u.invitation === "failed" ? "The email could not be sent." : `A new temporary password was sent to ${u.email}.`
    );
  }

  const columns = [
    { key: "urn", label: "URN", value: (s) => s.roll_number || "", render: (s) => s.roll_number || "—" },
    { key: "name", label: "Name", value: (s) => s.full_name },
    { key: "email", label: "Email", value: (s) => s.email },
    ...(showBatch
      ? [{
          key: "batch",
          label: "Batch",
          value: (s) => (s.batch ? `${s.batch.name} ${s.batch.academic_year}` : ""),
          render: (s) =>
            s.batch ? (
              <span>
                {s.batch.name} <span className="ic-muted">({s.batch.academic_year})</span>
                {s.batch.is_archived && <span className="badge badge--gray admin-inline-badge">Archived</span>}
              </span>
            ) : (
              <span className="ic-muted">No batch</span>
            ),
        }]
      : []),
    { key: "status", label: "Status", value: (s) => s.account_state, render: (s) => <AccountStatus user={s} /> },
    {
      key: "actions",
      label: "Actions",
      value: () => 0,
      render: (s) => (
        <div className="admin-actions">
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => setEditing(s)}>Edit</button>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => setMoving(s)} disabled={!s.is_active}>Move</button>
          {s.is_active && (
            <button type="button" className="btn btn--sm btn--ghost" onClick={() => resend(s)}>
              {s.account_state === "invited" ? "Resend invitation" : "Reset password"}
            </button>
          )}
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => toggleActive(s)}>
            {s.is_active ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {notice && <div className={`alert alert--${notice.type}`}>{notice.text}</div>}
      <DataTable
        columns={columns}
        rows={students}
        rowKey={(s) => s.id}
        searchText={(s) => `${s.full_name} ${s.email} ${s.roll_number || ""}`}
        searchPlaceholder="Search by name, email or URN"
        emptyMessage={emptyMessage}
        initialSort={{ key: "urn", dir: "asc" }}
      />
      {editing && (
        <EditStudent
          student={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated, emailChanged) => {
            setEditing(null);
            setNotice({
              type: "success",
              text:
                emailChanged && updated.account_state === "invited"
                  ? "Saved. The email changed, so please resend the invitation for the new address to receive the temporary password."
                  : "Saved.",
            });
            onChanged();
          }}
        />
      )}
      {moving && (
        <MoveStudent
          student={moving}
          onClose={() => setMoving(null)}
          onMoved={(s) => {
            setMoving(null);
            setNotice({ type: "success", text: `${s.full_name} was moved. Their progress and scores moved with them.` });
            onChanged();
          }}
        />
      )}
    </>
  );
}

function EditStudent({ student, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: student.full_name,
    roll_number: student.roll_number || "",
    email: student.email,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await adminApi.updateStudent(student.id, form);
      onSaved(updated, updated.email !== student.email);
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit student" onClose={onClose}>
      <form className="admin-form" onSubmit={submit}>
        {error && <div className="alert alert--error">{error}</div>}
        <label className="form-label">Name<input className="form-input" required value={form.full_name} onChange={set("full_name")} /></label>
        <label className="form-label">URN<input className="form-input" required value={form.roll_number} onChange={set("roll_number")} /></label>
        <label className="form-label">Email<input className="form-input" type="email" required value={form.email} onChange={set("email")} /></label>
        <div className="admin-form__buttons">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}

function MoveStudent({ student, onClose, onMoved }) {
  const [batches, setBatches] = useState(null);
  const [target, setTarget] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .batches()
      .then((all) => !cancelled && setBatches(all.filter((b) => b.id !== student.batch?.id)))
      .catch((err) => {
        if (cancelled) return;
        setBatches([]);
        setError(errorMessage(err, "Could not load the batches."));
      });
    return () => {
      cancelled = true;
    };
  }, [student]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      onMoved(await adminApi.moveStudent(student.id, target));
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal title={`Move ${student.full_name}`} onClose={onClose}>
      <form className="admin-form" onSubmit={submit}>
        {error && <div className="alert alert--error">{error}</div>}
        <p className="ic-muted">
          Current batch: {student.batch ? `${student.batch.name} (${student.batch.academic_year})` : "none"}. The student's
          progress and scores move with them.
        </p>
        <label className="form-label">
          New batch
          <select className="form-select" required value={target} onChange={(e) => setTarget(e.target.value)} disabled={batches === null}>
            <option value="">{batches === null ? "Loading…" : "Select a batch"}</option>
            {(batches || []).map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.academic_year})</option>
            ))}
          </select>
        </label>
        <div className="admin-form__buttons">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={saving || !target}>{saving ? "Moving…" : "Move student"}</button>
        </div>
      </form>
    </Modal>
  );
}
