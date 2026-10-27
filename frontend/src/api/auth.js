import { api } from "./client.js";

export const authApi = {
  login: (email, password) =>
    api.post("/auth/login", { email, password }).then((r) => r.data),

  me: () => api.get("/auth/me").then((r) => r.data),

  // Ends the session on the server. The token is passed in because the caller clears it straight away.
  logout: (token) =>
    api.post("/auth/logout", null, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.data),

  profile: () => api.get("/auth/profile").then((r) => r.data),

  forgotPassword: (email) => api.post("/auth/forgot-password", { email }).then((r) => r.data),

  resetPassword: (token, new_password) =>
    api.post("/auth/reset-password", { token, new_password }).then((r) => r.data),

  changePassword: (current_password, new_password) =>
    api.post("/auth/change-password", { current_password, new_password }).then((r) => r.data),
};
