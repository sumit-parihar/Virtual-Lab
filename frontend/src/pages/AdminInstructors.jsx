import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../api/admin.js";
import { AccountStatus } from "../components/admin/AccountBadges.jsx";
import DataTable from "../components/DataTable.jsx";
import Modal from "../components/Modal.jsx";
import { errorMessage } from "../utils/errors.js";
import "./InstructorConsole.css";
import "./AdminConsole.css";

// Instructor accounts: add, edit, resend the invitation, deactivate.
export default function AdminInstructors() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [form, setForm] = useState(null); // null | { mode: "add" } | { mode: "edit", user }

  const load = useCallback(() => {
    setError("");
    return adminApi
      .instructors()
      .then(setInstructors)
      .catch((err) => setError(errorMessage(err, "Could not load the instructors. Please try again.")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function run(action, success) {
    setNotice(null);
    try {
      const result = await action();
      setNotice({ type: "success", text: typeof success === "function" ? success(result) : success });
      load();
    } catch (err) {
      setNotice({ type: "error", text: errorMessage(err) });
    }
  }

  function toggleActive(i) {
    if (i.is_active) {
      const warning = i.batches.length
        ? ` They still teach ${i.batches.map((b) => b.name).join(", ")}; those batches will need a new instructor.`
        : "";
      if (!window.confirm(`Deactivate ${i.full_name}? They will not be able to log in.${warning}`)) return;
      run(() => adminApi.deactivate(i.id), `${i.full_name} was deactivated.${warning}`);
    } else {
      run(() => adminApi.reactivate(i.id), `${i.full_name} was reactivated.`);
    }
  }

  function resend(i) {
    if (!window.confirm(`Send ${i.full_name} a new temporary password by email? Their current password stops working.`)) return;
    run(() => adminApi.resendInvitation(i.id), (u) =>
      u.invitation === "failed" ? "The email could not be sent." : `A new temporary password was sent to ${u.email}.`
    );
  }

  const columns = [
    { key: "name", label: "Name", value: (i) => i.full_name },
    { key: "email", label: "Email", value: (i) => i.email },
    {
      key: "batches",
      label: "Batches",
      value: (i) => i.batches.map((b) => b.name).join(", "),
      render: (i) =>
        i.batches.length ? (
          <span className="admin-batch-list">
            {i.batches.map((b) => (
              <Link key={b.id} to={`/admin/batches/${b.id}`} className="admin-link">{b.name}</Link>
            ))}
          </span>
        ) : (
          <span className="ic-muted">None</span>
        ),
    },
    { key: "status", label: "Status", value: (i) => i.account_state, render: (i) => <AccountStatus user={i} /> },
    {
      key: "actions",
      label: "Actions",
      value: () => 0,
      render: (i) => (
        <div className="admin-actions">
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => setForm({ mode: "edit", user: i })}>Edit</button>
          {i.is_active && (
            <button type="button" className="btn btn--sm btn--ghost" onClick={() => resend(i)}>
              {i.account_state === "invited" ? "Resend invitation" : "Reset password"}
            </button>
          )}
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => toggleActive(i)}>
            {i.is_active ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ic-page">
      <div className="ic-header">
        <h1 className="ic-page__title">Instructors</h1>
        <button type="button" className="btn btn--primary btn--sm" onClick={() => setForm({ mode: "add" })}>
          Add instructor
        </button>
      </div>

      {notice && <div className={`alert alert--${notice.type}`}>{notice.text}</div>}
      {error && (
        <div className="alert alert--error ic-alert">
          <span>{error}</span>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => { setLoading(true); load(); }}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="page-loading">Loading instructors…</div>
      ) : (
        !error && (
          <DataTable
            columns={columns}
            rows={instructors}
            rowKey={(i) => i.id}
            searchText={(i) => `${i.full_name} ${i.email}`}
            searchPlaceholder="Search by name or email"
            emptyMessage="No instructors yet. Use Add instructor to create one."
            initialSort={{ key: "name", dir: "asc" }}
          />
        )
      )}

      {form && (
        <InstructorForm
          mode={form.mode}
          user={form.user}
          onClose={() => setForm(null)}
          onSaved={(saved, emailChanged) => {
            const wasAdd = form.mode === "add";
            setForm(null);
            setNotice({
              type: saved.invitation === "failed" ? "error" : "success",
              text: wasAdd
                ? `${saved.full_name} was added. A temporary password is being emailed to ${saved.email}.`
                : emailChanged && saved.account_state === "invited"
                  ? "Saved. The email changed, so please resend the invitation for the new address to receive the temporary password."
                  : "Saved.",
            });
            load();
          }}
        />
      )}
    </div>
  );
}

function InstructorForm({ mode, user, onClose, onSaved }) {
  const [values, setValues] = useState({ full_name: user?.full_name || "", email: user?.email || "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved =
        mode === "add" ? await adminApi.createInstructor(values) : await adminApi.updateInstructor(user.id, values);
      onSaved(saved, mode === "edit" && saved.email !== user.email);
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  }

  return (
    <Modal title={mode === "add" ? "Add instructor" : "Edit instructor"} onClose={onClose}>
      <form className="admin-form" onSubmit={submit}>
        {error && <div className="alert alert--error">{error}</div>}
        <label className="form-label">
          Name
          <input className="form-input" required value={values.full_name} onChange={(e) => setValues({ ...values, full_name: e.target.value })} />
        </label>
        <label className="form-label">
          Email
          <input className="form-input" type="email" required value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} />
        </label>
        {mode === "add" && (
          <p className="ic-muted">A random temporary password is emailed to the instructor, who must change it at the first login.</p>
        )}
        <div className="admin-form__buttons">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? "Saving…" : mode === "add" ? "Add instructor" : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}
