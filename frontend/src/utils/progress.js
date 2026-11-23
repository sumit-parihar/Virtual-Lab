import { SECTION_LABELS } from "../constants/sections.js";

// Backend section keys whose experiment-page id differs (the page uses ?section=<id>).
const PAGE_ID = { "aim-objectives": "aim", "code-exercise": "code-editor" };

/** The experiment page's ?section= id for a backend section key. */
export function sectionPageId(key) {
  return PAGE_ID[key] || key;
}

/** A short label for a section key ("Title / Overview" → "Overview"). */
export function shortSectionLabel(key) {
  if (key === "overview") return "Overview";
  if (key === "aim-objectives") return "Aim";
  if (key === "theory") return "Theory";
  return SECTION_LABELS[key] || key;
}

/**
 * Join the experiment list (slug, title, aim, order_index) with the student's progress rows
 * (GET /dashboards/student). Each result has done/total sections, the overall status and the
 * first section not yet completed. Experiments without a progress row count as not started.
 */
export function mergeProgress(experiments, progressRows) {
  const byId = new Map((progressRows || []).map((row) => [String(row.experiment_id), row]));
  return [...experiments]
    .sort((a, b) => a.order_index - b.order_index)
    .map((exp) => {
      const row = byId.get(String(exp.id));
      const sections = row?.sections || [];
      const done = sections.filter((s) => s.completed).length;
      const next = sections.find((s) => !s.completed);
      return {
        ...exp,
        sections,
        done,
        total: sections.length,
        status: row?.overall_status || "not_started",
        nextKey: next?.key || null,
        assignmentScore: row?.assignment_score ?? null,
        assignmentDone: row?.assignment === "completed",
        hasAssignment: Boolean(row?.has_assignment),
      };
    });
}

/** The experiment to continue: the first one in progress, else the first not started. Null when all are complete. */
export function pickContinue(rows) {
  return rows.find((r) => r.status === "in_progress") || rows.find((r) => r.status !== "completed") || null;
}

/** Whole-number percentage of completed sections; 100 only when every section is done. */
export function overallPercent(rows) {
  const total = rows.reduce((n, r) => n + r.total, 0);
  const done = rows.reduce((n, r) => n + r.done, 0);
  if (total === 0) return 0;
  if (done === total) return 100;
  return Math.min(99, Math.round((done / total) * 100));
}

export const STATUS_LABEL = { not_started: "Not Attempted", in_progress: "In Progress", completed: "Completed" };
export const STATUS_BADGE = { not_started: "badge--gray", in_progress: "badge--yellow", completed: "badge--green" };
