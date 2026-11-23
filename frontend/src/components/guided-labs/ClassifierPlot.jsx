import { useMemo } from "react";
import PlotFrame from "./PlotFrame.jsx";

/**
 * Shared plot for the classification labs: shaded decision regions (what the model predicts at every spot),
 * training points (filled) and test points (rings), coloured by their real class.
 *
 * props: id, domain {x, y}, xLabel, yLabel, classes [{ value, label }], train, test (points {x, y, cls}),
 *   predict(x, y) -> class value (in the plot's units; omit to draw no regions), cells (grid resolution),
 *   onPick(x, y) optional click handler, children(scale) optional extra drawing on top.
 */
export const CLASS_COLORS = ["#2563eb", "#ea580c", "#16a34a", "#9333ea"];

export function classColor(classes, value) {
  const i = classes.findIndex((c) => c.value === value);
  return CLASS_COLORS[i < 0 ? 0 : i % CLASS_COLORS.length];
}

export default function ClassifierPlot({
  id,
  domain,
  xLabel,
  yLabel,
  classes,
  train,
  test,
  predict,
  cells = 64,
  onPick,
  children,
}) {
  const [x0, x1] = domain.x;
  const [y0, y1] = domain.y;
  const rows = Math.round(cells * 0.8);

  const grid = useMemo(() => {
    if (!predict) return [];
    const out = [];
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cells; c += 1) {
        const xv = x0 + ((c + 0.5) / cells) * (x1 - x0);
        const yv = y0 + ((r + 0.5) / rows) * (y1 - y0);
        out.push({ c, r, cls: predict(xv, yv) });
      }
    }
    return out;
  }, [predict, cells, rows, x0, x1, y0, y1]);

  // Click position in SVG units, turned into feature values with the plot's scale.
  function pick(e, s) {
    const svg = e.currentTarget.ownerSVGElement;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const local = pt.matrixTransform(svg.getScreenCTM().inverse());
    onPick(s.invertX(local.x), s.invertY(local.y));
  }

  return (
    <PlotFrame
      id={id}
      xDomain={domain.x}
      yDomain={domain.y}
      xLabel={xLabel}
      yLabel={yLabel}
      ariaLabel={`Scatter plot of ${yLabel} against ${xLabel}, coloured by class, with the model's decision regions`}
    >
      {(s) => {
        const cw = (s.right - s.left) / cells;
        const ch = (s.bottom - s.top) / rows;
        return (
          <g>
            {/* Solid cells inside one faded group, so overlapping cell edges do not show as lines. */}
            <g opacity={0.16}>
              {grid.map((g) => (
                <rect
                  key={`${g.c}-${g.r}`}
                  x={s.left + g.c * cw}
                  y={s.bottom - (g.r + 1) * ch}
                  width={cw + 0.6}
                  height={ch + 0.6}
                  fill={classColor(classes, g.cls)}
                />
              ))}
            </g>
            {onPick && (
              <rect
                x={s.left}
                y={s.top}
                width={s.right - s.left}
                height={s.bottom - s.top}
                fill="transparent"
                style={{ cursor: "crosshair" }}
                onClick={(e) => pick(e, s)}
              />
            )}
            {train.map((p, i) => (
              <circle
                key={`tr${i}`}
                cx={s.x(p.x)}
                cy={s.y(p.y)}
                r={4.2}
                fill={classColor(classes, p.cls)}
                fillOpacity={0.85}
                stroke="#ffffff"
                strokeWidth={0.8}
                pointerEvents="none"
              />
            ))}
            {test.map((p, i) => (
              <circle
                key={`te${i}`}
                cx={s.x(p.x)}
                cy={s.y(p.y)}
                r={4.6}
                fill="#ffffff"
                stroke={classColor(classes, p.cls)}
                strokeWidth={2.2}
                pointerEvents="none"
              />
            ))}
            {children && children(s)}
          </g>
        );
      }}
    </PlotFrame>
  );
}

export function ClassLegend({ classes, showTest = true }) {
  return (
    <div className="lab__legend">
      {classes.map((c) => (
        <span key={c.value}>
          <i
            className="lab-key lab-key--dot"
            style={{ background: classColor(classes, c.value) }}
          />{" "}
          {c.label}
        </span>
      ))}
      <span>
        <i className="lab-key lab-key--dot lab-key--muted" /> filled = training
      </span>
      {showTest && (
        <span>
          <i className="lab-key lab-key--ring" /> ring = test
        </span>
      )}
    </div>
  );
}
