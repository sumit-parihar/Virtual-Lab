import { useState } from "react";
import Editor, { loader } from "@monaco-editor/react";
import { usePyodide } from "../editor/usePyodide.js";
import { codeSubmissionsApi } from "../api/codeSubmissions.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useConfirm } from "./ConfirmDialog.jsx";
import "./CodeEditor.css";

// With VITE_SELF_HOST_EDITOR=true the Monaco editor files come from /monaco/vs (created by `npm run setup:editor`)
// instead of the public CDN.
if (import.meta.env.VITE_SELF_HOST_EDITOR === "true") {
  loader.config({ paths: { vs: "/monaco/vs" } });
}

/**
 * CodeEditor — Module 6 (Client-side Code Execution Engine).
 *
 * Props:
 *   experiment    — full experiment object (id, starter_code, allowed_imports, code_dataset_url)
 *   onSubmitted   — callback called with CodeSubmissionOut after successful submit
 *   canSubmit     — false for instructors/admins: they can run code but not submit it
 */
function readDraft(key) {
  try {
    return key ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function writeDraft(key, value) {
  try {
    if (!key) return;
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* storage full or blocked: the draft is simply not kept */
  }
}

export default function CodeEditor({ experiment, onSubmitted, canSubmit = true }) {
  const confirm = useConfirm();
  const { user } = useAuth();
  const starter = experiment?.starter_code || "# Write your Python code here\n";
  // The student's own draft, kept in this browser so it survives a refresh (one per user and experiment).
  const draftKey = user && experiment ? `ml-lab:code:${user.id}:${experiment.id}` : null;
  const [code, setCode] = useState(() => readDraft(draftKey) ?? starter);
  const { status, stdout, result, notice, run, stop } = usePyodide();

  function changeCode(value) {
    const next = value || "";
    setCode(next);
    writeDraft(draftKey, next === starter ? null : next);
  }

  async function resetToStarter() {
    if (code !== starter) {
      const ok = await confirm({
        title: "Reset to the starter code?",
        message: "Your code in this editor will be replaced with the original starter code. Your changes will be lost.",
        confirmLabel: "Reset code",
        danger: true,
      });
      if (!ok) return;
    }
    setCode(starter);
    writeDraft(draftKey, null);
  }
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [datasetError, setDatasetError] = useState("");
  const [submittedOutput, setSubmittedOutput] = useState(null); // what the student submitted, shown with the verdict

  // Optional dataset file: copied into the browser's Python environment under its file name.
  const datasetUrl = experiment?.code_dataset_url || "";
  const datasetName = datasetUrl
    ? new URL(datasetUrl, window.location.origin).pathname.split("/").pop()
    : "";

  const isRunning = status === "loading" || status === "running";

  async function handleRun() {
    const allowedImports = experiment?.allowed_imports || [];
    setDatasetError("");
    let files = {};
    if (datasetUrl) {
      try {
        const res = await fetch(datasetUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        files = { [datasetName]: await res.text() };
      } catch {
        setDatasetError("Could not load the dataset file. Please check your connection and try again.");
        return;
      }
    }
    await run(code, allowedImports, files);
  }

  async function handleSubmit() {
    if (!result) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const sub = await codeSubmissionsApi.submit(
        experiment.id,
        code,
        result.error ? null : result.output,
        result.error || null
      );
      setSubmittedOutput(result.error ? null : result.output ?? null);
      setSubmitResult(sub);
      onSubmitted?.(sub);
    } catch (err) {
      setSubmitError(err.response?.data?.detail || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  const statusLabel = {
    idle: "Ready",
    loading: "Loading Pyodide…",
    running: "Running…",
    done: "Done",
    error: "Error",
    stopped: "Stopped",
  }[status] || "Ready";

  return (
    <div className="code-editor">
      <div className="code-editor__shell">
        <div className="code-editor__toolbar">
          <span className="code-editor__file">
            main.py
            {code !== starter && <span className="code-editor__saved"> · saved in this browser</span>}
          </span>
          <div className="code-editor__actions">
            {!isRunning && (
              <button type="button" className="code-editor__btn code-editor__btn--quiet" onClick={resetToStarter} disabled={code === starter}>
                Reset to starter code
              </button>
            )}
            {isRunning ? (
              <button type="button" className="code-editor__btn code-editor__btn--stop" onClick={() => stop()}>
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2" /></svg>
                Stop
              </button>
            ) : (
              <button type="button" className="code-editor__btn code-editor__btn--run" onClick={handleRun}>
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4l13 8-13 8z" /></svg>
                Run
              </button>
            )}
            {result && canSubmit && (
              <button type="button" className="code-editor__btn code-editor__btn--submit" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit"}
              </button>
            )}
          </div>
        </div>

        <div className="code-editor__monaco">
          <Editor
            height="380px"
            defaultLanguage="python"
            theme="vs-dark"
            value={code}
            onChange={changeCode}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', Consolas, monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
              padding: { top: 12 },
            }}
          />
        </div>

        <div className="code-editor__statusbar">
          <span className={`code-editor__status code-editor__status--${status}`} role="status">
            {statusLabel}
          </span>
          {(experiment?.allowed_imports?.length > 0 || datasetName) && (
            <span className="code-editor__meta">
              {experiment?.allowed_imports?.length > 0 && <>Allowed imports: {experiment.allowed_imports.join(", ")}</>}
              {experiment?.allowed_imports?.length > 0 && datasetName && " · "}
              {datasetName && <>Dataset file: {datasetName}</>}
            </span>
          )}
        </div>
      </div>

      {/* stdout output */}
      {(stdout.length > 0 || result) && (
        <div className="code-editor__output">
          <div className="code-editor__output-label">Output</div>
          <pre className="code-editor__stdout">
            {stdout.join("\n")}
            {result?.error && (
              <span className="code-editor__error">{"\n" + result.error}</span>
            )}
            {result && !result.error && result.output != null && (
              <span className="code-editor__result">
                {"\n→ result: " + JSON.stringify(result.output)}
              </span>
            )}
          </pre>
        </div>
      )}

      {/* Submission result: the student's own output and whether it is correct */}
      {submitResult && (
        <div className={`alert ${submitResult.status === "matched" ? "alert--success" : submitResult.status === "error" ? "alert--error" : "alert--warning"}`}>
          <strong>
            {submitResult.status === "matched" ? "✓ Correct" : submitResult.status === "error" ? "✗ Error" : "✗ Incorrect"}
          </strong>{" "}
          —{" "}
          {submitResult.status === "matched"
            ? "your output matches the expected result."
            : submitResult.status === "error"
              ? "your code raised an error, so it could not be checked."
              : "your output does not match the expected result. Review your code and try again."}
          {submitResult.status !== "error" && (
            <div className="code-editor__verdict-output">
              <span>Your output (result):</span>
              <pre>{submittedOutput === null ? "(no value stored in result)" : JSON.stringify(submittedOutput)}</pre>
            </div>
          )}
        </div>
      )}

      {notice && <div className="alert alert--warning">{notice}</div>}
      {submitError && <div className="alert alert--error">{submitError}</div>}
      {datasetError && <div className="alert alert--error">{datasetError}</div>}

      {!canSubmit && (
        <p className="code-editor__note">View only: instructors and admins can run code but not submit it.</p>
      )}

      {/* Note about client-side execution */}
      <p className="code-editor__note">
        Your code runs entirely in your browser via Pyodide (Python in WebAssembly). It never
        reaches our servers.
      </p>
    </div>
  );
}
