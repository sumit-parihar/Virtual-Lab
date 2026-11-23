import { useState } from "react";

/**
 * Numbered "try this" tasks for a guided lab. Each step has a task and an explanation
 * that the student reveals after trying it. Shared by every guided lab.
 * steps = [{ task: string, explanation: string }]
 */
export default function GuidedSteps({ steps }) {
  const [open, setOpen] = useState({});
  if (!steps?.length) return null;

  return (
    <div className="lab-steps">
      <h3 className="lab-steps__title">Try these steps</h3>
      <ol className="lab-steps__list">
        {steps.map((step, i) => (
          <li key={i} className="lab-steps__item">
            <p className="lab-steps__task">{step.task}</p>
            {step.explanation && (
              <>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  aria-expanded={Boolean(open[i])}
                  onClick={() =>
                    setOpen((prev) => ({ ...prev, [i]: !prev[i] }))
                  }
                >
                  {open[i] ? "Hide explanation" : "Show explanation"}
                </button>
                {open[i] && (
                  <p className="lab-steps__explanation">{step.explanation}</p>
                )}
              </>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
