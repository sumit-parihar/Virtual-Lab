import "./labs.css";

/**
 * Shared SVG frame for the guided labs: grid, axes, ticks and axis labels. The drawing itself is passed as
 * `children(scale)`, where scale = { x(v), y(v), left, right, top, bottom }, and is clipped to the plot area.
 */
const PAD = { left: 56, right: 14, top: 14, bottom: 48 };

export function niceTicks(min, max, count = 5) {
  const raw = (max - min) / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10]
    .map((f) => f * magnitude)
    .find((s) => s >= raw);
  const out = [];
  for (
    let v = Math.ceil(min / step) * step;
    v <= max + step * 1e-9;
    v += step
  ) {
    out.push(Number(v.toFixed(10)));
  }
  return out;
}

const tickLabel = (v) =>
  Math.abs(v) >= 1000
    ? new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(v)
    : String(Number(v.toFixed(3)));

export default function PlotFrame({
  id,
  width = 520,
  height = 420,
  xDomain,
  yDomain,
  xLabel,
  yLabel,
  xTicks = 6,
  yTicks = 5,
  ariaLabel,
  children,
}) {
  const left = PAD.left;
  const right = width - PAD.right;
  const top = PAD.top;
  const bottom = height - PAD.bottom;
  const [x0, x1] = xDomain;
  const [y0, y1] = yDomain;
  const scale = {
    x: (v) => left + ((v - x0) / (x1 - x0)) * (right - left),
    y: (v) => bottom - ((v - y0) / (y1 - y0)) * (bottom - top),
    invertX: (px) => x0 + ((px - left) / (right - left)) * (x1 - x0),
    invertY: (py) => y0 + ((bottom - py) / (bottom - top)) * (y1 - y0),
    left,
    right,
    top,
    bottom,
  };
  const clipId = `${id}-clip`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="lab-plot"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={left} y={top} width={right - left} height={bottom - top} />
        </clipPath>
      </defs>
      {niceTicks(x0, x1, xTicks).map((t) => (
        <g key={`x${t}`}>
          <line
            className="lab-plot__grid"
            x1={scale.x(t)}
            x2={scale.x(t)}
            y1={top}
            y2={bottom}
          />
          <text
            className="lab-plot__tick"
            x={scale.x(t)}
            y={bottom + 18}
            textAnchor="middle"
          >
            {tickLabel(t)}
          </text>
        </g>
      ))}
      {niceTicks(y0, y1, yTicks).map((t) => (
        <g key={`y${t}`}>
          <line
            className="lab-plot__grid"
            x1={left}
            x2={right}
            y1={scale.y(t)}
            y2={scale.y(t)}
          />
          <text
            className="lab-plot__tick"
            x={left - 8}
            y={scale.y(t) + 4}
            textAnchor="end"
          >
            {tickLabel(t)}
          </text>
        </g>
      ))}
      <line
        className="lab-plot__axis"
        x1={left}
        x2={right}
        y1={bottom}
        y2={bottom}
      />
      <line
        className="lab-plot__axis"
        x1={left}
        x2={left}
        y1={top}
        y2={bottom}
      />
      <text
        className="lab-plot__axis-label"
        x={(left + right) / 2}
        y={height - 8}
        textAnchor="middle"
      >
        {xLabel}
      </text>
      <text
        className="lab-plot__axis-label"
        transform={`translate(14 ${(top + bottom) / 2}) rotate(-90)`}
        textAnchor="middle"
      >
        {yLabel}
      </text>
      <g clipPath={`url(#${clipId})`}>{children(scale)}</g>
    </svg>
  );
}
