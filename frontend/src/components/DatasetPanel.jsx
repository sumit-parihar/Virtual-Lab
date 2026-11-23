import { useEffect, useState } from "react";
import { parseCsv } from "../utils/csv.js";
import "./DatasetPanel.css";

/**
 * Read-only "About the dataset" panel, shown in the Guided Lab and the Code Exercise.
 *
 * `info` is the experiment's dataset_info (data only, from backend/scripts/experiment_content/):
 *   name, file_url, description, row_meaning, load_hint, sample_rows,
 *   columns: [{ name, meaning, unit, role: "feature" | "target" | "unused", count? }]
 *     (`count` > 1 describes a group of neighbouring columns in one row, e.g. 64 pixels),
 *   class_column + class_names ({ "0": "setosa", ... }) for classification datasets,
 *   sample_images: { width, height, max } to show each sample row as a small greyscale image (Digits).
 * The row and column counts, the sample rows and the class counts are read from the data file itself,
 * so they always match the data the student's code works with. Nothing can be changed or downloaded here.
 */
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const ROLE_LABELS = {
  feature: "Feature (x)",
  target: "Target (y)",
  unused: "Not used",
};

// Very long decimals (for example 0.038075906433423026) are shortened to 4 places for display only.
const LONG_DECIMAL = /^-?\d+\.\d{5,}$/;
const showCell = (cell) =>
  LONG_DECIMAL.test(cell) ? Number(cell).toFixed(4) : cell;

function SampleImage({ row, shape, label, labelName }) {
  const { width, height, max } = shape;
  const cell = 6;
  return (
    <figure className="dataset-panel__image">
      <svg
        viewBox={`0 0 ${width * cell} ${height * cell}`}
        width={width * cell}
        height={height * cell}
        role="img"
        aria-label={`Image of the digit ${labelName ?? label}`}
      >
        {row.slice(0, width * height).map((value, i) => {
          const shade = Math.round(255 - (Number(value) / max) * 255);
          return (
            <rect
              key={i}
              x={(i % width) * cell}
              y={Math.floor(i / width) * cell}
              width={cell}
              height={cell}
              fill={`rgb(${shade},${shade},${shade})`}
            />
          );
        })}
      </svg>
      <figcaption>
        target = <strong>{label}</strong>
      </figcaption>
    </figure>
  );
}

export default function DatasetPanel({ info, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let current = true;
    fetch(info.file_url)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.text();
      })
      .then((text) => {
        if (current) setData(parseCsv(text));
      })
      .catch(() => {
        if (current)
          setError(
            "Could not load the dataset preview. Please reload the page.",
          );
      });
    return () => {
      current = false;
    };
  }, [info.file_url]);

  const total = data?.rows.length ?? 0;
  const sampleCount = Math.min(info.sample_rows || 8, total);
  // Row numbers of the samples: the first rows, or rows spread evenly through a file sorted by class.
  const sampleIndices = Array.from({ length: sampleCount }, (_, i) =>
    info.sample_spread ? Math.floor((i * total) / sampleCount) : i,
  );
  const samples = data ? sampleIndices.map((i) => data.rows[i]) : [];
  const classNames = info.class_names || {};
  const classIndex =
    data && info.class_column ? data.header.indexOf(info.class_column) : -1;
  const classCounts = {};
  if (classIndex !== -1) {
    for (const row of data.rows)
      classCounts[row[classIndex]] = (classCounts[row[classIndex]] || 0) + 1;
  }
  const shortened = samples.some((row) =>
    row.some((c) => LONG_DECIMAL.test(c)),
  );

  return (
    <details
      className="dataset-panel"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="dataset-panel__summary">
        <span className="dataset-panel__title">
          About the dataset: {info.name}
        </span>
        {data && (
          <span className="dataset-panel__size">
            {plural(data.rows.length, "row")} ×{" "}
            {plural(data.header.length, "column")}
          </span>
        )}
      </summary>

      <div className="dataset-panel__body">
        {info.description && (
          <p className="dataset-panel__text">{info.description}</p>
        )}
        <ul className="dataset-panel__facts">
          {info.row_meaning && <li>Each row is {info.row_meaning}.</li>}
          {info.load_hint && (
            <li>
              Load it in code with <code>{info.load_hint}</code>
            </li>
          )}
        </ul>

        <h4 className="dataset-panel__heading">Columns</h4>
        <div className="dataset-panel__scroll">
          <table className="dataset-panel__table">
            <thead>
              <tr>
                <th scope="col">Column</th>
                <th scope="col">Meaning</th>
                <th scope="col">Unit</th>
                <th scope="col">Role</th>
              </tr>
            </thead>
            <tbody>
              {info.columns.map((col) => (
                <tr key={col.name}>
                  <td>
                    <code>{col.name}</code>
                    {col.count > 1 && (
                      <div className="dataset-panel__count">
                        {col.count} columns
                      </div>
                    )}
                  </td>
                  <td>{col.meaning}</td>
                  <td>{col.unit || "—"}</td>
                  <td>
                    <span
                      className={`dataset-panel__role dataset-panel__role--${col.role}`}
                    >
                      {ROLE_LABELS[col.role] || col.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {classIndex !== -1 && (
          <>
            <h4 className="dataset-panel__heading">Rows in each class</h4>
            <ul className="dataset-panel__classes">
              {Object.entries(classCounts).map(([label, count]) => (
                <li key={label}>
                  <code>{label}</code>
                  {classNames[label] && <> = {classNames[label]}</>}:{" "}
                  {plural(count, "row")}
                </li>
              ))}
            </ul>
          </>
        )}

        <h4 className="dataset-panel__heading">Sample records</h4>
        {error && <div className="alert alert--error">{error}</div>}
        {!data && !error && <p className="dataset-panel__text">Loading…</p>}
        {data && info.sample_images && (
          <>
            <p className="dataset-panel__note">
              The first {sampleCount} of {data.rows.length} rows, each drawn as
              the image its{" "}
              {info.sample_images.width * info.sample_images.height} pixel
              columns describe (darker = higher value).
            </p>
            <div className="dataset-panel__images">
              {samples.map((row, i) => {
                const label = row[row.length - 1];
                return (
                  <SampleImage
                    key={i}
                    row={row}
                    shape={info.sample_images}
                    label={label}
                    labelName={classNames[label]}
                  />
                );
              })}
            </div>
          </>
        )}
        {data && !info.sample_images && (
          <>
            <p className="dataset-panel__note">
              {info.sample_spread
                ? `${sampleCount} of the ${total} rows, spread evenly through the file (# is the row number).`
                : `The first ${sampleCount} of ${total} rows.`}
              {shortened && " Long decimals are shortened to 4 places here."}
            </p>
            <div className="dataset-panel__scroll">
              <table className="dataset-panel__table dataset-panel__table--data">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    {data.header.map((h) => (
                      <th scope="col" key={h}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {samples.map((row, i) => (
                    <tr key={sampleIndices[i]}>
                      <td className="dataset-panel__index">
                        {sampleIndices[i]}
                      </td>
                      {row.map((cell, j) => (
                        <td key={j}>{showCell(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </details>
  );
}
