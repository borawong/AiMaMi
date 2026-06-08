import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { formatMonthShort, formatHeatmapDate, formatDuration } from "@/lib/time";
import { useTranslation } from "react-i18next";
import { ChartTooltip } from "./tooltip";

export interface HeatmapDay {
  date: string;
  level: number;
  count: number;
  activeMinutes?: number;
  tokens?: number;
}

interface HeatmapProps {
  data: HeatmapDay[];
  colorVar?: string;
}

const CELL = 13;
const GAP = 3;
const ROWS = 7;

export function Heatmap({ data, colorVar = "var(--heatmap-color, #3FE6A1)" }: HeatmapProps) {
  const { t } = useTranslation();
  const [tooltip, setTooltip] = useState<{ x: number; y: number; day: HeatmapDay } | null>(null);

  const grid = useMemo(() => {
    const cols: HeatmapDay[][] = [];
    let col: HeatmapDay[] = [];

    const firstDate = data.length > 0 ? new Date(data[0].date + "T00:00:00") : new Date();
    const startPad = firstDate.getDay();
    for (let i = 0; i < startPad; i++) {
      col.push({ date: "", level: -1, count: 0 });
    }

    for (const day of data) {
      col.push(day);
      if (col.length === ROWS) {
        cols.push(col);
        col = [];
      }
    }
    if (col.length > 0) {
      while (col.length < ROWS) col.push({ date: "", level: -1, count: 0 });
      cols.push(col);
    }
    return cols;
  }, [data]);

  const months = useMemo(() => {
    const result: { label: string; col: number }[] = [];
    let lastMonth = -1;
    grid.forEach((col, ci) => {
      const firstValid = col.find((d) => d.date);
      if (!firstValid) return;
      const m = new Date(firstValid.date + "T00:00:00").getMonth();
      if (m !== lastMonth) {
        lastMonth = m;
        result.push({
          label: formatMonthShort(new Date(firstValid.date + "T00:00:00")),
          col: ci,
        });
      }
    });
    return result;
  }, [grid]);

  const width = grid.length * (CELL + GAP) + GAP;
  const height = ROWS * (CELL + GAP) + GAP + 18;

  return (
    <div className="relative overflow-x-auto">
      <svg width={width} height={height} className="block">
        {months.map((m) => (
          <text
            key={`${m.label}-${m.col}`}
            x={m.col * (CELL + GAP) + GAP}
            y={12}
            className="fill-muted-foreground text-[10px]"
          >
            {m.label}
          </text>
        ))}
        {grid.map((col, ci) =>
          col.map((day, ri) => {
            if (day.level < 0) return null;
            const x = ci * (CELL + GAP) + GAP;
            const y = ri * (CELL + GAP) + GAP + 18;
            return (
              <rect
                key={`${ci}-${ri}`}
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx={2.5}
                fill={levelColor(day.level, colorVar)}
                className="transition-colors duration-150"
                onMouseEnter={(e) => {
                  setTooltip({
                    x: e.clientX,
                    y: e.clientY - 6,
                    day,
                  });
                }}
                onMouseMove={(e) => {
                  setTooltip({
                    x: e.clientX,
                    y: e.clientY - 6,
                    day,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          }),
        )}
      </svg>
      {tooltip && tooltip.day.date && (
        <ChartTooltip x={tooltip.x} y={tooltip.y}>
          <div className="font-semibold text-foreground">{formatHeatmapDate(tooltip.day.date)}</div>
          <div className="text-muted-foreground">
            {tooltip.day.count} {t("analytics.tabSessions")}
          </div>
          {tooltip.day.activeMinutes != null && tooltip.day.activeMinutes > 0 && (
            <div className="text-muted-foreground">
              {t("analytics.todayActive")}{" "}
              {formatDuration(tooltip.day.activeMinutes)}
            </div>
          )}
          {tooltip.day.tokens != null && tooltip.day.tokens > 0 && (
            <div className="text-muted-foreground">
              {t("analytics.tabToken")} {formatHeatmapTokenCount(tooltip.day.tokens)}
            </div>
          )}
        </ChartTooltip>
      )}
    </div>
  );
}

function levelColor(level: number, base: string): string {
  if (level === 0) return "var(--heatmap-empty, hsl(var(--muted) / 0.5))";
  const opacity = [0, 0.25, 0.5, 0.75, 1][level] ?? 1;
  return `color-mix(in srgb, ${base} ${Math.round(opacity * 100)}%, transparent)`;
}

function formatHeatmapTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return String(tokens);
}

export function HeatmapLegend({ colorVar = "var(--heatmap-color, #3FE6A1)" }: { colorVar?: string }) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
      <span>{t("analytics.heatmap.less")}</span>
      {[0, 1, 2, 3, 4].map((l) => (
        <span
          key={l}
          className={cn("inline-block h-[11px] w-[11px] rounded-[2px]")}
          style={{ backgroundColor: levelColor(l, colorVar) }}
        />
      ))}
      <span>{t("analytics.heatmap.more")}</span>
    </div>
  );
}
