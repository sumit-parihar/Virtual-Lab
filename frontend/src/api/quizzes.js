import { api } from "./client.js";

export const quizzesApi = {
  submit: (quizId, answers) =>
    api.post(`/quizzes/${quizId}/submit`, { answers }).then((r) => r.data),

  create: (experimentId, data) =>
    api.post(`/experiments/${experimentId}/quizzes`, data).then((r) => r.data),
};
