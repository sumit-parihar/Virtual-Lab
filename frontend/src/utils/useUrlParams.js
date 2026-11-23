import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Page state kept in the address (?key=value), so a refresh, Back/Forward or a shared link restores it.
 * update({ key: value, … }) changes several keys in one step (an empty value removes the key). Filters and typing
 * replace the history entry; pass { push: true } for steps the Back button should return to (such as tabs).
 */
export function useUrlParams() {
  const [params, setParams] = useSearchParams();
  const update = useCallback(
    (changes, { push = false } = {}) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(changes)) {
            if (value === null || value === undefined || value === "") next.delete(key);
            else next.set(key, String(value));
          }
          return next;
        },
        { replace: !push },
      ),
    [setParams],
  );
  return [params, update];
}
