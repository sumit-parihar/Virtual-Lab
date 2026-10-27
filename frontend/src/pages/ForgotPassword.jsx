import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../api/auth.js";
import { errorMessage } from "../utils/errors.js";

// Ask for a reset link. The reply is the same for every email, by design.
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(errorMessage(err, "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Forgot password</h1>
        {sent ? (
          <>
            <div className="alert alert--info">
              If this email belongs to an account, we have sent a link to reset the password. The link works once and expires in 30 minutes.
            </div>
            <Link to="/login" className="auth-link">Back to sign in</Link>
          </>
        ) : (
          <>
            <p className="auth-subtitle">Enter your email and we will send you a link to choose a new password.</p>
            <form onSubmit={handleSubmit} className="auth-form">
              {error && <div className="alert alert--error">{error}</div>}
              <label className="form-label">
                Email
                <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@college.edu" />
              </label>
              <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </button>
              <Link to="/login" className="auth-link">Back to sign in</Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
