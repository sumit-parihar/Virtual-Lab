import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

// If the server says the login is no longer valid (expired, signed out elsewhere, password changed,
// account deactivated), clear it and go to the login page. A wrong password on the login form or on the
// change-password form is not a signed-out session, so those requests are left alone.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const signedIn = Boolean(localStorage.getItem("access_token"));
    const isCredentialCheck = url.includes("/auth/login") || url.includes("/auth/change-password");
    if (error.response?.status === 401 && signedIn && !isCredentialCheck) {
      localStorage.removeItem("access_token");
      if (!window.location.pathname.startsWith("/login")) {
        // Explain why on the login page, and come back to this page after signing in again.
        try {
          sessionStorage.setItem(
            "session_notice",
            "Your session has ended (you signed in somewhere else, signed out, or the login expired). Please sign in again.",
          );
        } catch {
          /* storage unavailable: the login page simply shows no notice */
        }
        const next = window.location.pathname + window.location.search;
        window.location.assign(`/login?next=${encodeURIComponent(next)}`);
      }
    }
    return Promise.reject(error);
  }
);

// Attach token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
