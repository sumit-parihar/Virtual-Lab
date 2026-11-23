import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import AuthAside from "../components/AuthAside.jsx";

/** Only a path inside this app ("/experiments/…"), never another site ("//evil.com", "https://…"). */
export function safeNext(value) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

// The notice stays until the user signs in again: the login page can be shown twice when a session ends (once by
// the app, once by the full redirect), and removing it on the first read would lose it.
function readNotice() {
  try {
    return sessionStorage.getItem("session_notice") || "";
  } catch {
    return "";
  }
}

function clearNotice() {
  try {
    sessionStorage.removeItem("session_notice");
  } catch {
    /* nothing to clear */
  }
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const [notice] = useState(readNotice);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      clearNotice();
      if (data.must_change_password) {
        navigate("/change-password");
      } else {
        navigate(next, { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <AuthAside />
      <div className="auth-card">
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-subtitle">Use the email and password from your invitation.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          {notice && !error && <div className="alert alert--info">{notice}</div>}
          {error && <div className="alert alert--error">{error}</div>}
          <label className="form-label">
            Email
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@college.edu"
            />
          </label>
          <label className="form-label">
            Password
            <span className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-field__toggle"
                aria-pressed={showPassword}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </span>
          </label>
          <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
        </form>
      </div>
    </div>
  );
}
