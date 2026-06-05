import type { DailyView } from "../data";
import { formatNumber } from "../data";

interface ViewsChartProps {
  data: DailyView[];
}

export function ViewsChart({ data }: ViewsChartProps) {
  const maxViews = Math.max(...data.map((d) => d.views));
  const peakDay = data.reduce((a, b) => (a.views > b.views ? a : b));
  const peakDate = new Date(peakDay.date).toLocaleDateString("en-US", { month: "long", day: "numeric" });

  const padding = { top: 40, right: 16, bottom: 40, left: 16 };
  const width = 800;
  const height = 300;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - (d.views / maxViews) * chartH,
    ...d,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  // Y-axis grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    y: padding.top + chartH - pct * chartH,
    label: formatNumber(Math.round(pct * maxViews)),
  }));

  // X-axis labels (show every 5th date)
  const xLabels = points.filter((_, i) => i % 5 === 0 || i === points.length - 1);

  // Peak point
  const peakPoint = points.reduce((a, b) => (a.y < b.y ? a : b));

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-xs text-accent font-semibold">PEAK</span>
        <span className="font-mono text-xs text-text-secondary">
          {peakDate}: {formatNumber(peakDay.views)} views, the campaign&apos;s peak so far
        </span>
      </div>

      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          {gridLines.map((g) => (
            <g key={g.y}>
              <line
                x1={padding.left}
                y1={g.y}
                x2={width - padding.right}
                y2={g.y}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
              />
              <text
                x={padding.left + 2}
                y={g.y - 4}
                fill="#6b6558"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
              >
                {g.label}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <defs>
            <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5A623" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#viewsGradient)" />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#F5A623"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#0F0D0B" stroke="#F5A623" strokeWidth="1.5" />
          ))}

          {/* Peak marker */}
          <circle cx={peakPoint.x} cy={peakPoint.y} r="5" fill="#F5A623" opacity="0.3" />
          <circle cx={peakPoint.x} cy={peakPoint.y} r="3" fill="#F5A623" />

          {/* X-axis labels */}
          {xLabels.map((p) => {
            const d = new Date(p.date);
            const label = `${d.getMonth() + 1}/${d.getDate()}`;
            return (
              <text
                key={p.date}
                x={p.x}
                y={height - 8}
                fill="#6b6558"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
