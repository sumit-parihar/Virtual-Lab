import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ConfirmContext = createContext(null);

/**
 * A styled replacement for window.confirm. Wrap the app once in <ConfirmProvider>, then:
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title, message, confirmLabel, danger }))) return;
 * Escape, the Cancel button or a click on the dark background answers "no".
 */
export function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null); // { title, message, confirmLabel, danger, resolve }

  const confirm = useCallback(
    (options) => new Promise((resolve) => setRequest({ confirmLabel: "Confirm", ...options, resolve })),
    [],
  );

  function answer(value) {
    request?.resolve(value);
    setRequest(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && <ConfirmDialog request={request} onAnswer={answer} />}
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({ request, onAnswer }) {
  const cancelRef = useRef(null);
  const previousFocus = useRef(typeof document !== "undefined" ? document.activeElement : null);

  useEffect(() => {
    // The safe choice gets the focus; focus returns to where it was afterwards.
    cancelRef.current?.focus();
    const back = previousFocus.current;
    const onKey = (e) => e.key === "Escape" && onAnswer(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      back?.focus?.();
    };
  }, [onAnswer]);

  return (
    <div className="modal__backdrop" onMouseDown={(e) => e.target === e.currentTarget && onAnswer(false)}>
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-message">
        <h2 className="modal__title" id="confirm-title" style={{ marginBottom: "0.6rem" }}>
          {request.title}
        </h2>
        <p className="confirm__message" id="confirm-message">
          {request.message}
        </p>
        <div className="confirm__buttons">
          <button type="button" className="btn btn--ghost" ref={cancelRef} onClick={() => onAnswer(false)}>
            Cancel
          </button>
          <button type="button" className={`btn ${request.danger ? "btn--danger" : "btn--primary"}`} onClick={() => onAnswer(true)}>
            {request.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Ask a yes/no question in a styled dialog. Outside a provider (for example in a unit test) it falls back to window.confirm. */
export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  return confirm || ((options) => Promise.resolve(window.confirm(options.message)));
}
