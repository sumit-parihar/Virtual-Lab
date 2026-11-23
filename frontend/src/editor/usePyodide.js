import { useState, useRef, useCallback, useEffect } from "react";

/** Longest time a student's code may run before it is stopped (loading Python is not counted). */
export const RUN_TIME_LIMIT_MS = 60000;
// true only for demos over a tunnel: load Python from the public CDN instead of this app's own copy (see pyodideWorker.js).
const PYODIDE_FROM_CDN = import.meta.env.VITE_PYODIDE_FROM_CDN === "true";

/**
 * usePyodide — manages the lifecycle of the Pyodide Web Worker.
 *
 * Returns { status, stdout, result, notice, run, stop }.
 *   status: "idle" | "loading" | "running" | "done" | "error" | "stopped"
 *   notice: why a run was stopped (Stop button or time limit), else ""
 *
 * Python in a worker cannot be interrupted, so Stop (and the time limit) end the worker; the next run starts a
 * fresh one. The worker is also ended when the component using this hook goes away (leaving the experiment page),
 * so a worker never outlives its page.
 */
export function usePyodide() {
  const workerRef = useRef(null);
  const readyRef = useRef(false); // Python has finished loading in the current worker
  const pendingRef = useRef(null); // the run in progress: { resolve, handler, timer }
  const [status, setStatus] = useState("idle");
  const [stdout, setStdout] = useState([]);
  const [result, setResult] = useState(null); // { output, error }
  const [notice, setNotice] = useState("");

  function ensureWorker() {
    if (workerRef.current) return workerRef.current;
    // Vite needs literal worker options, hence two branches.
    workerRef.current = PYODIDE_FROM_CDN
      ? new Worker(new URL("./pyodideWorker.js", import.meta.url), { type: "classic", name: "pyodide-cdn" })
      : new Worker(new URL("./pyodideWorker.js", import.meta.url), { type: "classic" });
    readyRef.current = false;
    return workerRef.current;
  }

  function endWorker() {
    const pending = pendingRef.current;
    if (pending) {
      clearTimeout(pending.timer);
      workerRef.current?.removeEventListener("message", pending.handler);
    }
    pendingRef.current = null;
    workerRef.current?.terminate();
    workerRef.current = null;
    readyRef.current = false;
    return pending;
  }

  const stop = useCallback((message = "Stopped. Your code did not finish, so there is no result.") => {
    const pending = endWorker();
    if (!pending) return;
    setStatus("stopped");
    setResult(null);
    setNotice(message);
    pending.resolve(null);
  }, []);

  const run = useCallback(
    (code, allowedImports, files) =>
      new Promise((resolve) => {
        setStdout([]);
        setResult(null);
        setNotice("");
        const worker = ensureWorker();
        const pending = { resolve, handler: null, timer: null };

        const start = () => {
          setStatus("running");
          pending.timer = setTimeout(
            () =>
              stop(
                `Stopped: your code ran for more than ${RUN_TIME_LIMIT_MS / 1000} seconds. ` +
                  "Check for an endless loop (for example while True:) and run it again.",
              ),
            RUN_TIME_LIMIT_MS,
          );
          worker.postMessage({ type: "run", code, allowedImports, files });
        };

        pending.handler = (e) => {
          const { type, text, output, error } = e.data;
          if (type === "ready") {
            readyRef.current = true;
            start();
          } else if (type === "stdout") {
            setStdout((prev) => [...prev, text]);
          } else if (type === "result") {
            clearTimeout(pending.timer);
            worker.removeEventListener("message", pending.handler);
            pendingRef.current = null;
            setStatus(error ? "error" : "done");
            setResult({ output, error });
            resolve({ output, error });
          }
        };

        worker.addEventListener("message", pending.handler);
        pendingRef.current = pending;
        if (readyRef.current) start();
        else setStatus("loading");
      }),
    [stop],
  );

  // End the worker when the page that uses it goes away.
  useEffect(() => () => endWorker(), []);

  return { status, stdout, result, notice, run, stop };
}
