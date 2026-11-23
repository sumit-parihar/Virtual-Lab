import { useEffect, useState } from "react";
import { parseCsv } from "../../utils/csv.js";

/**
 * Load a presaved dataset for a guided lab: the CSV file (numbers) and, optionally, its split file
 * (the test rows of the Code Exercise's train_test_split). Read-only; nothing is saved.
 * Returns { data: { header, rows, testRows } | null, error }.
 */
export default function useLabData(csvUrl, splitUrl) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    const getText = (url) =>
      fetch(url).then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.text();
      });
    Promise.all([
      getText(csvUrl),
      splitUrl ? getText(splitUrl) : Promise.resolve(null),
    ])
      .then(([csvText, splitText]) => {
        if (!current) return;
        const { header, rows } = parseCsv(csvText);
        setData({
          header,
          rows: rows.map((row) => row.map(Number)),
          testRows: splitText ? JSON.parse(splitText).test_rows : [],
        });
      })
      .catch(() => {
        if (current)
          setError(
            "Could not load the dataset for this lab. Please check your connection and reload the page.",
          );
      });
    return () => {
      current = false;
    };
  }, [csvUrl, splitUrl]);

  return { data, error };
}
