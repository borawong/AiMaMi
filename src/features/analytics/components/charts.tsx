import { useState, useRef, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChartTooltip } from "./tooltip";

// ---------------------------------------------------------------------------
// 共享类型与工具
// ---------------------------------------------------------------------------

const TARGET_FONT_PX = 10;

function useScaledFont(viewBoxW: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [fs, setFs] = useState(TARGET_FONT_PX);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setFs(TARGET_FONT_PX * viewBoxW / w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [viewBoxW]);
  return { ref, fs };
}

export interface DataPoint {
  label: string;
  value: number;
}

interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const DEFAULT_M: Margins = { top: 14, right: 8, bottom: 28, left: 36 };

function niceMax(v: number): number {
  if (v <= 0) return 10;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return nice * mag;
}

function formatTick(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1)}K`;
  return String(v);
}

function yTicks(max: number, count = 4): number[] {
  const step = max / count;
  return Array.from({ length: count + 1 }, (_, i) => Math.round(i * step));
}

function shouldShowLabel(i: number, total: number, maxLabels = 5): boolean {
  if (total <= maxLabels) return true;
  const step = Math.ceil(total / maxLabels);
  if (i % step === 0) return true;
  if (i === total - 1) {
    const lastStepped = Math.floor(i / step) * step;
    return i - lastStepped >= step * 0.6;
  }
  return false;
}

function smoothLine(pts: [number, number][], yMin?: number, yMax?: number): string {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M${pts[0][0]},${pts[0][1]} L${pts[1][0]},${pts[1][1]}`;
  const clampY = (v: number) => {
    if (yMin != null) v = Math.max(v, yMin);
    if (yMax != null) v = Math.min(v, yMax);
    return v;
  };
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(i + 2, pts.length - 1)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = clampY(p1[1] + (p2[1] - p0[1]) / 6);
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = clampY(p2[1] - (p3[1] - p1[1]) / 6);
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

function smoothArea(pts: [number, number][], baseY: number, yMin?: number, yMax?: number): string {
  const line = smoothLine(pts, yMin, yMax);
  if (!line || pts.length < 2) return "";
  return `${line} L${pts[pts.length - 1][0].toFixed(1)},${baseY.toFixed(1)} L${pts[0][0].toFixed(1)},${baseY.toFixed(1)} Z`;
}

function tooltipPoint(event: React.MouseEvent<Element>) {
  return { x: event.clientX, y: event.clientY };
}

// ---------------------------------------------------------------------------
// 柱状图组件
// ---------------------------------------------------------------------------

export interface BarChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  className?: string;
  renderTooltip?: (index: number) => ReactNode;
}

export function BarChart({
  data,
  color = "#79D0FF",
  height = 160,
  className,
  renderTooltip,
}: BarChartProps) {
  const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null);
  const w = 680;
  const { ref: containerRef, fs } = useScaledFont(w);
  const m = DEFAULT_M;
  const innerW = w - m.left - m.right;
  const innerH = height - m.top - m.bottom;

  const maxVal = niceMax(Math.max(...data.map((d) => d.value), 1));
  const ticks = yTicks(maxVal);
  const barW = Math.min(28, (innerW / data.length) * 0.6);
  const gap = innerW / data.length;

  return (
    <div className="relative" ref={containerRef}>
      <svg
        viewBox={`0 0 ${w} ${height}`}
        className={cn("w-full", className)}
        preserveAspectRatio="xMidYMid meet"
      >
        {ticks.map((t) => {
          const y = m.top + innerH - (t / maxVal) * innerH;
          return (
            <g key={t}>
              <line x1={m.left} y1={y} x2={w - m.right} y2={y} stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.5} strokeDasharray={t === 0 ? "none" : "3,3"} />
              <text x={m.left - 6} y={y + 3} textAnchor="end" className="fill-muted-foreground" fontSize={fs}>{formatTick(t)}</text>
            </g>
          );
        })}
        {data.map((_, i) => {
          if (!shouldShowLabel(i, data.length)) return null;
          const x = m.left + i * gap + gap / 2;
          return <line key={`vg-${i}`} x1={x} y1={m.top} x2={x} y2={m.top + innerH} stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.5} strokeDasharray="3,3" />;
        })}

        {data.map((d, i) => {
          const x = m.left + i * gap + (gap - barW) / 2;
          const barH = (d.value / maxVal) * innerH;
          const y = m.top + innerH - barH;
          return (
            <rect key={`bar-${i}`} x={x} y={y} width={barW} height={Math.max(barH, 0)} rx={3} fill={color} fillOpacity={hover?.idx === i ? 1 : 0.85} className="transition-[fill-opacity] duration-150" />
          );
        })}

        {/* 不可见命中区域 */}
        {data.map((_, i) => {
          const x = m.left + i * gap;
          return (
            <rect
              key={`hit-${i}`}
              x={x} y={m.top} width={gap} height={innerH}
              fill="transparent"
              onMouseEnter={(e) => {
                setHover({ idx: i, ...tooltipPoint(e) });
              }}
              onMouseMove={(e) => setHover({ idx: i, ...tooltipPoint(e) })}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}

        {data.map((d, i) => {
          if (!shouldShowLabel(i, data.length)) return null;
          const x = m.left + i * gap + gap / 2;
          return <text key={i} x={x} y={height - 4} textAnchor="middle" className="fill-muted-foreground" fontSize={fs}>{d.label}</text>;
        })}
      </svg>
      {hover && renderTooltip && (
        <ChartTooltip x={hover.x} y={hover.y}>{renderTooltip(hover.idx)}</ChartTooltip>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 折线图组件（支持双线与面积填充）
// ---------------------------------------------------------------------------

export interface LineSeriesItem {
  label: string;
  values: number[];
}

export interface LineChartProps {
  labels: string[];
  series: LineSeriesItem[];
  colors: string[];
  height?: number;
  yMax?: number;
  ySuffix?: string;
  className?: string;
  renderTooltip?: (index: number) => ReactNode;
}

export function LineChart({
  labels,
  series,
  colors,
  height = 180,
  yMax: forcedMax,
  ySuffix = "",
  className,
  renderTooltip,
}: LineChartProps) {
  const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null);
  const w = 680;
  const { ref: containerRef, fs } = useScaledFont(w);
  const m = DEFAULT_M;
  const innerW = w - m.left - m.right;
  const innerH = height - m.top - m.bottom;
  const n = labels.length;

  const allVals = series.flatMap((s) => s.values);
  const maxVal = forcedMax ?? niceMax(Math.max(...allVals, 1));
  const ticks = yTicks(maxVal);

  const toX = (i: number) => m.left + (i / Math.max(n - 1, 1)) * innerW;
  const toY = (v: number) => m.top + innerH - (v / maxVal) * innerH;
  const colW = n > 1 ? innerW / (n - 1) : innerW;

  return (
    <div className="relative" ref={containerRef}>
      <svg
        viewBox={`0 0 ${w} ${height}`}
        className={cn("w-full", className)}
        preserveAspectRatio="xMidYMid meet"
      >
        {ticks.map((t) => {
          const y = toY(t);
          return (
            <g key={t}>
              <line x1={m.left} y1={y} x2={w - m.right} y2={y} stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.5} strokeDasharray={t === 0 ? "none" : "3,3"} />
              <text x={m.left - 6} y={y + 3} textAnchor="end" className="fill-muted-foreground" fontSize={fs}>{formatTick(t)}{ySuffix}</text>
            </g>
          );
        })}
        {labels.map((_, i) => {
          if (!shouldShowLabel(i, n)) return null;
          const x = toX(i);
          return <line key={`vg-${i}`} x1={x} y1={m.top} x2={x} y2={m.top + innerH} stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.5} strokeDasharray="3,3" />;
        })}

        {series.map((s, si) => {
          const pts: [number, number][] = s.values.map((v, i) => [toX(i), toY(v)]);
          const linePath = smoothLine(pts, m.top, m.top + innerH);
          const areaPath = smoothArea(pts, toY(0), m.top, m.top + innerH);
          return (
            <g key={si}>
              <path d={areaPath} fill={colors[si]} opacity={0.06} />
              <path d={linePath} fill="none" stroke={colors[si]} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}

        {/* 悬停时高亮圆点 */}
        {hover && series.map((s, si) => (
          <circle key={si} cx={toX(hover.idx)} cy={toY(s.values[hover.idx] ?? 0)} r={4} fill={colors[si]} stroke="var(--popover)" strokeWidth={2} />
        ))}

        {/* 不可见命中区域 */}
        {labels.map((_, i) => {
          const x = toX(i) - colW / 2;
          return (
            <rect
              key={`hit-${i}`}
              x={Math.max(x, m.left)} y={m.top} width={colW} height={innerH}
              fill="transparent"
              onMouseEnter={(e) => {
                setHover({ idx: i, ...tooltipPoint(e) });
              }}
              onMouseMove={(e) => setHover({ idx: i, ...tooltipPoint(e) })}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}

        {labels.map((l, i) => {
          if (!shouldShowLabel(i, n)) return null;
          return <text key={i} x={toX(i)} y={height - 4} textAnchor="middle" className="fill-muted-foreground" fontSize={fs}>{l}</text>;
        })}
      </svg>
      {hover && renderTooltip && (
        <ChartTooltip x={hover.x} y={hover.y}>{renderTooltip(hover.idx)}</ChartTooltip>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 组合图组件（柱状图与折线叠加）
// ---------------------------------------------------------------------------

export interface ComboChartProps {
  data: DataPoint[];
  lineValues: number[];
  barColor?: string;
  lineColor?: string;
  height?: number;
  className?: string;
  renderTooltip?: (index: number) => ReactNode;
}

export function ComboChart({
  data,
  lineValues,
  barColor = "#7DE6AA",
  lineColor = "#FFD36E",
  height = 140,
  className,
  renderTooltip,
}: ComboChartProps) {
  const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null);
  const w = 400;
  const { ref: containerRef, fs } = useScaledFont(w);
  const m = { top: 14, right: 8, bottom: 28, left: 36 };
  const innerW = w - m.left - m.right;
  const innerH = height - m.top - m.bottom;
  const n = data.length;

  const barMax = niceMax(Math.max(...data.map((d) => d.value), 1));
  const lineMax = niceMax(Math.max(...lineValues, 1));
  const barW = Math.min(30, (innerW / n) * 0.6);
  const gap = innerW / n;

  const toBarY = (v: number) => m.top + innerH - (v / barMax) * innerH;
  const toLineY = (v: number) => m.top + innerH - (v / lineMax) * innerH;
  const toX = (i: number) => m.left + i * gap + gap / 2;

  return (
    <div className="relative" ref={containerRef}>
      <svg
        viewBox={`0 0 ${w} ${height}`}
        className={cn("w-full", className)}
        preserveAspectRatio="xMidYMid meet"
      >
        {[0, 0.33, 0.66, 1].map((f, i) => {
          const y = m.top + innerH * (1 - f);
          return <line key={i} x1={m.left} y1={y} x2={w - m.right} y2={y} stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.5} strokeDasharray={f === 0 ? "none" : "3,3"} />;
        })}
        {data.map((_, i) => {
          if (!shouldShowLabel(i, n, 4)) return null;
          const x = toX(i);
          return <line key={`vg-${i}`} x1={x} y1={m.top} x2={x} y2={m.top + innerH} stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.5} strokeDasharray="3,3" />;
        })}

        {data.map((d, i) => {
          const x = toX(i) - barW / 2;
          const barH = (d.value / barMax) * innerH;
          return <rect key={`bar-${i}`} x={x} y={toBarY(d.value)} width={barW} height={Math.max(barH, 0)} rx={3} fill={barColor} fillOpacity={hover?.idx === i ? 1 : 0.85} className="transition-[fill-opacity] duration-150" />;
        })}

        <path d={smoothLine(lineValues.map((v, i) => [toX(i), toLineY(v)]), m.top, m.top + innerH)} fill="none" stroke={lineColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {hover && (
          <circle cx={toX(hover.idx)} cy={toLineY(lineValues[hover.idx] ?? 0)} r={3.5} fill={lineColor} stroke="var(--popover)" strokeWidth={2} />
        )}

        {/* 不可见命中区域 */}
        {data.map((_, i) => {
          const x = m.left + i * gap;
          return (
            <rect
              key={`hit-${i}`}
              x={x} y={m.top} width={gap} height={innerH}
              fill="transparent"
              onMouseEnter={(e) => {
                setHover({ idx: i, ...tooltipPoint(e) });
              }}
              onMouseMove={(e) => setHover({ idx: i, ...tooltipPoint(e) })}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}

        {data.map((d, i) => {
          if (!shouldShowLabel(i, n, 4)) return null;
          return <text key={i} x={toX(i)} y={height - 4} textAnchor="middle" className="fill-muted-foreground" fontSize={fs}>{d.label}</text>;
        })}
      </svg>
      {hover && renderTooltip && (
        <ChartTooltip x={hover.x} y={hover.y}>{renderTooltip(hover.idx)}</ChartTooltip>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 环形图组件
// ---------------------------------------------------------------------------

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  centerLabel?: string;
  centerSub?: string;
  size?: number;
  className?: string;
  renderTooltip?: (index: number) => ReactNode;
}

export function DonutChart({
  segments,
  centerLabel,
  centerSub,
  size = 140,
  className,
  renderTooltip,
}: DonutChartProps) {
  const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null);
  const r = 50;
  const sw = 24;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct = seg.value / total;
    const dash = pct * circumference;
    const arc = { ...seg, dash, offset: -offset };
    offset += dash;
    return arc;
  });

  return (
    <div className={cn("relative flex flex-col items-center gap-3", className)}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--accent)" strokeWidth={sw} />
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={c} cy={c} r={r}
            fill="none" stroke={arc.color} strokeWidth={sw}
            strokeDasharray={`${arc.dash} ${circumference}`}
            strokeDashoffset={arc.offset}
            transform={`rotate(-90,${c},${c})`}
            strokeLinecap="butt"
            opacity={hover != null && hover.idx !== i ? 0.4 : 1}
            className="transition-opacity duration-150"
            onMouseEnter={(e) => {
              setHover({ idx: i, ...tooltipPoint(e) });
            }}
            onMouseMove={(e) => setHover({ idx: i, ...tooltipPoint(e) })}
            onMouseLeave={() => setHover(null)}
          />
        ))}
        {centerLabel && (
          <text x={c} y={centerSub ? c - 6 : c} textAnchor="middle" dominantBaseline="central" className="fill-foreground" fontSize={14} fontWeight={700}>{centerLabel}</text>
        )}
        {centerSub && (
          <text x={c} y={c + 12} textAnchor="middle" dominantBaseline="central" className="fill-muted-foreground" fontSize={10}>{centerSub}</text>
        )}
      </svg>
      <div className="space-y-1" style={{ width: size }}>
        {segments.map((seg, i) => (
          <div key={seg.label} className={cn("flex items-center justify-between text-xs transition-opacity duration-150", hover != null && hover.idx !== i && "opacity-40")}>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: seg.color }} />
              {seg.label}
            </span>
            <span className="font-semibold text-foreground">
              {total > 0 ? `${Math.round((seg.value / total) * 100)}%` : "0%"}
            </span>
          </div>
        ))}
      </div>
      {hover && renderTooltip && (
        <ChartTooltip x={hover.x} y={hover.y}>{renderTooltip(hover.idx)}</ChartTooltip>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 堆叠柱状图组件（用于变更：写入与读取并列，带折线）
// ---------------------------------------------------------------------------

export interface StackedBarPoint {
  label: string;
  a: number;
  b: number;
  line?: number;
}

export interface StackedBarChartProps {
  data: StackedBarPoint[];
  colorA?: string;
  colorB?: string;
  lineColor?: string;
  height?: number;
  className?: string;
  renderTooltip?: (index: number) => ReactNode;
}

export function StackedBarChart({
  data,
  colorA = "#7DE6AA",
  colorB = "#FF9A8A",
  lineColor = "#7AD6FF",
  height = 160,
  className,
  renderTooltip,
}: StackedBarChartProps) {
  const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null);
  const w = 680;
  const { ref: containerRef, fs } = useScaledFont(w);
  const m = DEFAULT_M;
  const innerW = w - m.left - m.right;
  const innerH = height - m.top - m.bottom;
  const n = data.length;

  const maxVal = niceMax(Math.max(...data.map((d) => Math.max(d.a, d.b, d.line ?? 0)), 1));
  const ticks = yTicks(maxVal);
  const pairW = Math.min(40, (innerW / n) * 0.7);
  const halfBar = pairW / 2 - 1;
  const gap = innerW / n;

  const toY = (v: number) => m.top + innerH - (v / maxVal) * innerH;
  const toX = (i: number) => m.left + i * gap + gap / 2;

  const hasLine = data.some((d) => d.line != null);

  return (
    <div className="relative" ref={containerRef}>
      <svg
        viewBox={`0 0 ${w} ${height}`}
        className={cn("w-full", className)}
        preserveAspectRatio="xMidYMid meet"
      >
        {ticks.map((t) => {
          const y = toY(t);
          return (
            <g key={t}>
              <line x1={m.left} y1={y} x2={w - m.right} y2={y} stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.5} strokeDasharray={t === 0 ? "none" : "3,3"} />
              <text x={m.left - 6} y={y + 3} textAnchor="end" className="fill-muted-foreground" fontSize={fs}>{formatTick(t)}</text>
            </g>
          );
        })}
        {data.map((_, i) => {
          if (!shouldShowLabel(i, n)) return null;
          const x = toX(i);
          return <line key={`vg-${i}`} x1={x} y1={m.top} x2={x} y2={m.top + innerH} stroke="currentColor" strokeOpacity={0.1} strokeWidth={0.5} strokeDasharray="3,3" />;
        })}

        {data.map((d, i) => {
          const cx = toX(i);
          const isHovered = hover?.idx === i;
          return (
            <g key={i}>
              <rect x={cx - halfBar - 1} y={toY(d.a)} width={halfBar} height={Math.max((d.a / maxVal) * innerH, 0)} rx={2} fill={colorA} fillOpacity={isHovered ? 1 : 0.85} className="transition-[fill-opacity] duration-150" />
              <rect x={cx + 1} y={toY(d.b)} width={halfBar} height={Math.max((d.b / maxVal) * innerH, 0)} rx={2} fill={colorB} fillOpacity={isHovered ? 1 : 0.85} className="transition-[fill-opacity] duration-150" />
            </g>
          );
        })}

        {hasLine && (
          <path d={smoothLine(data.map((d, i) => [toX(i), toY(d.line ?? 0)]), m.top, m.top + innerH)} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {hover && hasLine && (
          <circle cx={toX(hover.idx)} cy={toY(data[hover.idx]?.line ?? 0)} r={4} fill={lineColor} stroke="var(--popover)" strokeWidth={2} />
        )}

        {/* 不可见命中区域 */}
        {data.map((_, i) => {
          const x = m.left + i * gap;
          return (
            <rect
              key={`hit-${i}`}
              x={x} y={m.top} width={gap} height={innerH}
              fill="transparent"
              onMouseEnter={(e) => {
                setHover({ idx: i, ...tooltipPoint(e) });
              }}
              onMouseMove={(e) => setHover({ idx: i, ...tooltipPoint(e) })}
              onMouseLeave={() => setHover(null)}
            />
          );
        })}

        {data.map((d, i) => {
          if (!shouldShowLabel(i, n)) return null;
          return <text key={i} x={toX(i)} y={height - 4} textAnchor="middle" className="fill-muted-foreground" fontSize={fs}>{d.label}</text>;
        })}
      </svg>
      {hover && renderTooltip && (
        <ChartTooltip x={hover.x} y={hover.y}>{renderTooltip(hover.idx)}</ChartTooltip>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 排名图组件（顶部工具的水平柱状图）
// ---------------------------------------------------------------------------

export interface RankingItem {
  label: string;
  value: number;
}

export interface RankingChartProps {
  data: RankingItem[];
  color?: string;
  totalCalls?: number;
  className?: string;
  renderTooltip?: (index: number) => ReactNode;
}

export function RankingChart({
  data,
  color = "#79D0FF",
  className,
  renderTooltip,
}: RankingChartProps) {
  const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null);
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn("relative space-y-2", className)}>
      {data.map((item, i) => (
        <div
          key={item.label}
        className={cn("flex items-center gap-2.5 rounded-md px-1 -mx-1 transition-colors", hover?.idx === i && "bg-accent/50")}
        onMouseEnter={(e) => {
          setHover({ idx: i, ...tooltipPoint(e) });
        }}
        onMouseMove={(e) => setHover({ idx: i, ...tooltipPoint(e) })}
        onMouseLeave={() => setHover(null)}
      >
          <span className="w-[120px] shrink-0 truncate text-right text-xs text-muted-foreground">{item.label}</span>
          <div className="h-5 flex-1 overflow-hidden rounded bg-accent">
            <div className="h-full rounded transition-[width] duration-500" style={{ width: `${(item.value / maxVal) * 100}%`, background: color }} />
          </div>
          <span className="w-9 text-right text-[11px] font-semibold tabular-nums text-muted-foreground">{item.value}</span>
        </div>
      ))}
      {hover && renderTooltip && (
        <ChartTooltip x={hover.x} y={hover.y}>{renderTooltip(hover.idx)}</ChartTooltip>
      )}
    </div>
  );
}
