import { mergeProgress, overallPercent, pickContinue, sectionPageId } from "./progress.js";

const experiments = [
  { id: "b", slug: "two", title: "Two", order_index: 2 },
  { id: "a", slug: "one", title: "One", order_index: 1 },
  { id: "c", slug: "three", title: "Three", order_index: 3 },
];
const rows = [
  {
    experiment_id: "a",
    overall_status: "completed",
    sections: [{ key: "overview", completed: true }, { key: "assignment", completed: true }],
    assignment: "completed",
    assignment_score: 80,
    has_assignment: true,
  },
  {
    experiment_id: "b",
    overall_status: "in_progress",
    sections: [{ key: "overview", completed: true }, { key: "code-exercise", completed: false }],
  },
];

describe("progress helpers", () => {
  it("joins progress by experiment id, in experiment order", () => {
    const merged = mergeProgress(experiments, rows);
    expect(merged.map((r) => r.slug)).toEqual(["one", "two", "three"]);
    expect(merged[1]).toMatchObject({ done: 1, total: 2, status: "in_progress", nextKey: "code-exercise" });
    expect(merged[2]).toMatchObject({ done: 0, total: 0, status: "not_started", nextKey: null });
    expect(merged[0]).toMatchObject({ assignmentDone: true, assignmentScore: 80 });
  });

  it("continues the first experiment in progress", () => {
    expect(pickContinue(mergeProgress(experiments, rows)).slug).toBe("two");
  });

  it("gives 100% only when every section is done", () => {
    expect(overallPercent(mergeProgress(experiments, rows))).toBe(75);
    expect(overallPercent(mergeProgress(experiments.slice(1, 2), []))).toBe(0);
  });

  it("maps backend section keys to page ids", () => {
    expect(sectionPageId("code-exercise")).toBe("code-editor");
    expect(sectionPageId("aim-objectives")).toBe("aim");
    expect(sectionPageId("theory")).toBe("theory");
  });
});
