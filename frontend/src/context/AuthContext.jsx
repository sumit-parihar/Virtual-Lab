import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../api/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while hydrating from localStorage
  const [connectionError, setConnectionError] = useState(false); // the server could not be reached

  // Restore the session from localStorage. Only a 401 (login no longer valid) signs the user out; a network
  // or server error keeps the login so the user can retry once the server is back.
  const restore = useCallback(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      setConnectionError(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    authApi
      .me()
      .then((u) => {
        setUser(u);
        setConnectionError(false);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem("access_token");
          setUser(null);
        } else {
          setConnectionError(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(restore, [restore]);

  // Keep every open tab in step: signing out (or in) in one tab updates the others.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "access_token") restore();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [restore]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem("access_token", data.access_token);
    const profile = await authApi.me();
    setUser(profile);
    return data; // caller can inspect must_change_password
  }, []);

  const logout = useCallback(() => {
    const token = localStorage.getItem("access_token");
    localStorage.removeItem("access_token");
    setUser(null);
    if (token) authApi.logout(token).catch(() => {}); // best effort: the browser is already signed out
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await authApi.me();
    setUser(u);
    return u;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, connectionError, retry: restore, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
