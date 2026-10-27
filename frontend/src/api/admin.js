import { api } from "./client.js";

const get = (url, config) => api.get(url, config).then((r) => r.data);
const post = (url, body, config) => api.post(url, body, config).then((r) => r.data);
const patch = (url, body) => api.patch(url, body).then((r) => r.data);

// Admin console API (admin only).
export const adminApi = {
  // Batches
  batches: (includeArchived = false) => get("/admin/batches", { params: { include_archived: includeArchived } }),
  batch: (id) => get(`/admin/batches/${id}`),
  createBatch: (body) => post("/admin/batches", body),
  updateBatch: (id, body) => patch(`/admin/batches/${id}`, body),
  archiveBatch: (id) => post(`/admin/batches/${id}/archive`),
  restoreBatch: (id) => post(`/admin/batches/${id}/restore`),
  setInstructor: (id, instructorId) =>
    api.put(`/admin/batches/${id}/instructor`, { instructor_id: instructorId }).then((r) => r.data),
  removeInstructor: (id) => api.delete(`/admin/batches/${id}/instructor`).then((r) => r.data),

  // Students
  students: (params) => get("/admin/students", { params }),
  addStudent: (body) => post("/admin/students", body),
  updateStudent: (id, body) => patch(`/admin/students/${id}`, body),
  moveStudent: (id, batchId) => post(`/admin/students/${id}/move`, { batch_id: batchId }),
  downloadTemplate: () => get("/admin/students/template", { responseType: "blob" }),
  importFile: (batchId, kind, file) => {
    const form = new FormData();
    form.append("file", file);
    return post(`/admin/batches/${batchId}/students/${kind}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // Instructors
  instructors: () => get("/admin/instructors"),
  createInstructor: (body) => post("/admin/instructors", body),
  updateInstructor: (id, body) => patch(`/admin/instructors/${id}`, body),

  // Accounts
  deactivate: (id) => post(`/admin/users/${id}/deactivate`),
  reactivate: (id) => post(`/admin/users/${id}/reactivate`),
  resendInvitation: (id) => post(`/admin/users/${id}/resend-invitation`),
};
