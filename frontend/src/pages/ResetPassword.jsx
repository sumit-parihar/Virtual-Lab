import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { authApi } from "../api/auth.js";
import { errorMessage } from "../utils/errors.js";

// Choose a new password with the link from the email.
export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(errorMessage(err, "The password could not be reset. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Choose a new password</h1>
        {done ? (
          <>
            <div className="alert alert--success">Your password has been changed. You can now sign in.</div>
            <Link to="/login" className="btn btn--primary btn--full">Go to sign in</Link>
          </>
        ) : !token ? (
          <>
            <div className="alert alert--error">This reset link is not valid. Please request a new one.</div>
            <Link to="/forgot-password" className="auth-link">Request a new link</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="alert alert--error">{error}</div>}
            <label className="form-label">
              New password
              <input type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
            </label>
            <label className="form-label">
              Confirm new password
              <input type="password" className="form-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
            </label>
            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? "Saving…" : "Set new password"}
            </button>
            <Link to="/forgot-password" className="auth-link">Request a new link</Link>
          </form>
        )}
      </div>
    </div>
  );
}
