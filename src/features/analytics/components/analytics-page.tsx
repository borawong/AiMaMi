import { useMemo, useState, type ReactNode } from "react";
import { Activity, BarChart3, Coins, GitCommitHorizontal, MousePointer2, Timer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BentoCard } from "@/components/ui/bento-card";
import { Input } from "@/components/ui/input";
import { SegmentedOptions } from "@/components/ui/segmented-options";
import { Skeleton } from "@/components/ui/skeleton";
import {
  envelopeData,
  readArray,
  readNumber,
  readString,
} from "@/features/_shared/evidence-data";
import { EvidencePageHeader } from "@/features/_shared/evidence-panels";
import type { AnalyticsRange } from "@/types";
import { type AnalyticsPanelId, useAnalyticsModule } from "../hooks";
import { Heatmap, HeatmapLegend, type HeatmapDay } from "./heatmap";
import {
  BarChart,
  ComboChart,
  DonutChart,
  LineChart,
  RankingChart,
  StackedBarChart,
} from "./svg-charts";

type ActivityRange = "week" | "month" | "year";

const PANELS: AnalyticsPanelId[] = [
  "activity",
  "sessions",
  "token",
  "tools",
  "changes",
  "quota",
];
const ANALYTICS_RANGES: AnalyticsRange[] = ["today", "week", "month"];
const ACTIVITY_RANGES: ActivityRange[] = ["week", "month", "year"];
const CHART_COLOR = "var(--heatmap-color, #3FE6A1)";

export function AnalyticsPage() {
  const { t } = useTranslation();
  const [activePanel, setActivePanel] = useState<AnalyticsPanelId>("activity");
  const [range, setRange] = useState<AnalyticsRange>("week");
  const [activityRange, setActivityRange] = useState<ActivityRange>("year");
  const [quotaAccountKey, setQuotaAccountKey] = useState("");
  const module = useAnalyticsModule(range, {
    activePanel,
    quotaAccountKey,
  });

  return (
    <div className="space-y-5">
      <EvidencePageHeader titleKey="nav.analytics" descriptionKey="analytics.description" />

      <BentoCard className="overflow-visible rounded-[15px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedOptions
            items={PANELS.map((value) => ({
              value,
              label: t(`analytics.panel.${value}`),
            }))}
            value={activePanel}
            onChange={(value) => setActivePanel(value as AnalyticsPanelId)}
          />
          {activePanel === "activity" ? (
            <SegmentedOptions
              items={ACTIVITY_RANGES.map((value) => ({
                value,
                label: t(`analytics.range.${value}`),
              }))}
              value={activityRange}
              onChange={(value) => setActivityRange(value as ActivityRange)}
            />
          ) : (
            <SegmentedOptions
              items={ANALYTICS_RANGES.map((value) => ({
                value,
                label: t(`analytics.range.${value}`),
              }))}
              value={range}
              onChange={(value) => setRange(value as AnalyticsRange)}
            />
          )}
        </div>

        {activePanel === "quota" ? (
          <div className="mt-4 max-w-sm">
            <Input
              value={quotaAccountKey}
              onChange={(event) => setQuotaAccountKey(event.target.value)}
              placeholder={t("analytics.quotaAccountKeyPlaceholder")}
              aria-label={t("analytics.quotaAccountKey")}
            />
          </div>
        ) : null}

        <div className="mt-5">
          {activePanel === "activity" ? (
            <ActivityPanel
              payload={envelopeData(module.usageQuery.data)}
              loading={!module.usageQuery.data && (module.usageQuery.isPending || module.usageQuery.isFetching)}
              range={activityRange}
            />
          ) : null}
          {activePanel === "sessions" ? (
            <SessionsPanel
              payload={envelopeData(module.sessionQuery.data)}
              loading={!module.sessionQuery.data && (module.sessionQuery.isPending || module.sessionQuery.isFetching)}
              range={range}
            />
          ) : null}
          {activePanel === "token" ? (
            <TokenPanel
              payload={envelopeData(module.tokenQuery.data)}
              loading={!module.tokenQuery.data && (module.tokenQuery.isPending || module.tokenQuery.isFetching)}
              range={range}
            />
          ) : null}
          {activePanel === "tools" ? (
            <ToolsPanel
              payload={envelopeData(module.toolQuery.data)}
              loading={!module.toolQuery.data && (module.toolQuery.isPending || module.toolQuery.isFetching)}
            />
          ) : null}
          {activePanel === "changes" ? (
            <ChangesPanel
              payload={envelopeData(module.changeQuery.data)}
              loading={!module.changeQuery.data && (module.changeQuery.isPending || module.changeQuery.isFetching)}
              range={range}
            />
          ) : null}
          {activePanel === "quota" ? (
            <QuotaPanel
              accountKey={quotaAccountKey.trim()}
              payload={envelopeData(module.quotaQuery.data)}
              loading={!module.quotaQuery.data && (module.quotaQuery.isPending || module.quotaQuery.isFetching)}
            />
          ) : null}
        </div>
      </BentoCard>
    </div>
  );
}

function ActivityPanel({
  payload,
  loading,
  range,
}: {
  payload: unknown;
  loading: boolean;
  range: ActivityRange;
}) {
  const { t } = useTranslation();
  const daily = readArray(payload, ["dailyActivity"]);
  const today = readNumber(payload, ["today.activeMinutesEstimate"]);
  const days = useMemo(() => {
    const sliceSize = range === "week" ? 7 : range === "month" ? 30 : daily.length;
    return daily.slice(-sliceSize).map<HeatmapDay>((item) => ({
      date: readString(item, ["date"], ""),
      level: readNumber(item, ["activityLevel"]),
      count: readNumber(item, ["sessionCount"]),
      activeMinutes: readNumber(item, ["activeMinutes"]),
      tokens: readNumber(item, ["tokens"]),
    }));
  }, [daily, range]);
  const weekActiveDays = daily.slice(-7).filter((item) => readNumber(item, ["sessionCount"]) > 0).length;
  const monthActiveDays = daily.slice(-30).filter((item) => readNumber(item, ["sessionCount"]) > 0).length;

  return (
    <PanelBody loading={loading} empty={days.length === 0}>
      <h3 className="mb-4 text-[13px] font-bold">{t("analytics.activityTitle")}</h3>
      <Heatmap data={days} />
      <div className="mt-2 flex justify-center">
        <HeatmapLegend />
      </div>
      <StatsRow
        items={[
          { label: t("analytics.todayActive"), value: formatMinutes(today, t("analytics.minutesValue")), icon: <Activity className="h-3.5 w-3.5" /> },
          { label: t("analytics.weekActiveDays"), value: t("analytics.daysValue", { count: weekActiveDays }), icon: <Timer className="h-3.5 w-3.5" /> },
          { label: t("analytics.monthActiveDays"), value: t("analytics.daysValue", { count: monthActiveDays }), icon: <BarChart3 className="h-3.5 w-3.5" /> },
        ]}
      />
    </PanelBody>
  );
}

function SessionsPanel({
  payload,
  loading,
  range,
}: {
  payload: unknown;
  loading: boolean;
  range: AnalyticsRange;
}) {
  const { t } = useTranslation();
  const series = readArray(payload, ["series"]);
  const data = series.map((item) => ({
    label: range === "today" ? t("analytics.today") : shortDate(readString(item, ["date"], "")),
    value: readNumber(item, ["count"]),
  }));

  return (
    <PanelBody loading={loading} empty={data.length === 0}>
      <h3 className="mb-4 text-[13px] font-bold">{t("analytics.sessionTitle")}</h3>
      <BarChart
        data={data}
        color={CHART_COLOR}
        renderTooltip={(index) => {
          const item = series[index];
          if (!item) return null;
          return (
            <>
              <div className="font-semibold text-foreground">{readString(item, ["date"], "")}</div>
              <div className="text-muted-foreground">
                {readNumber(item, ["count"])} {t("analytics.panel.sessions")}
              </div>
            </>
          );
        }}
      />
      <StatsRow
        items={[
          { label: t("analytics.totalSessions"), value: String(readNumber(payload, ["totalSessions"])) },
          { label: t("analytics.avgTurns"), value: readNumber(payload, ["avgTurns"]).toFixed(1) },
          { label: t("analytics.activeDays"), value: String(readNumber(payload, ["activeDays"])) },
        ]}
      />
    </PanelBody>
  );
}

function TokenPanel({
  payload,
  loading,
  range,
}: {
  payload: unknown;
  loading: boolean;
  range: AnalyticsRange;
}) {
  const { t } = useTranslation();
  const series = readArray(payload, ["series"]);
  const data = series.map((item) => ({
    label: range === "today" ? t("analytics.today") : shortDate(readString(item, ["date"], "")),
    value: readNumber(item, ["totalTokens"]),
  }));
  const cumulative = series.map((item) => readNumber(item, ["cumulative"]));
  const totalTokens = readNumber(payload, ["totalTokens"]);
  const segments = [
    { label: t("analytics.tokenInput"), value: readNumber(payload, ["inputTotal"]), color: "#79D0FF" },
    { label: t("analytics.tokenOutput"), value: readNumber(payload, ["outputTotal"]), color: "#7DE6AA" },
    { label: t("analytics.tokenReasoning"), value: readNumber(payload, ["reasoningTotal"]), color: "#FFD36E" },
  ];

  return (
    <PanelBody loading={loading} empty={data.length === 0}>
      <h3 className="mb-4 text-[13px] font-bold">{t("analytics.tokenTitle")}</h3>
      <Legend
        items={[
          { color: CHART_COLOR, label: t("analytics.tokenUsage") },
          { color: "#FFD36E", label: t("analytics.tokenCumulative") },
        ]}
      />
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_170px]">
        <ComboChart
          data={data}
          lineValues={cumulative}
          barColor={CHART_COLOR}
          renderTooltip={(index) => {
            const item = series[index];
            if (!item) return null;
            return (
              <>
                <div className="font-semibold text-foreground">{readString(item, ["date"], "")}</div>
                <div className="text-muted-foreground">
                  {t("analytics.tokenUsage")} {formatCompact(readNumber(item, ["totalTokens"]))}
                </div>
                <div className="text-muted-foreground">
                  {t("analytics.tokenCumulative")} {formatCompact(readNumber(item, ["cumulative"]))}
                </div>
              </>
            );
          }}
        />
        <DonutChart
          segments={segments}
          centerLabel={formatCompact(totalTokens)}
          centerSub={t("analytics.total")}
          size={130}
        />
      </div>
      <StatsRow
        items={[
          { label: t("analytics.totalToken"), value: formatCompact(totalTokens), icon: <Coins className="h-3.5 w-3.5" /> },
          { label: t("analytics.avgTokenPerSession"), value: formatCompact(Math.round(readNumber(payload, ["avgPerSession"]))) },
          { label: t("analytics.reasoningPct"), value: `${Math.round(readNumber(payload, ["reasoningPct"]))}%` },
        ]}
      />
    </PanelBody>
  );
}

function ToolsPanel({ payload, loading }: { payload: unknown; loading: boolean }) {
  const { t } = useTranslation();
  const topTools = readArray(payload, ["topTools"]);
  const data = topTools.map((item) => ({
    label: readString(item, ["name"], t("analytics.unknownTool")),
    value: readNumber(item, ["count"]),
  }));
  const total = readNumber(payload, ["totalCalls"]);
  const segments = [
    { label: t("analytics.editTasks"), value: readNumber(payload, ["editCount"]), color: CHART_COLOR },
    { label: t("analytics.searchTasks"), value: readNumber(payload, ["searchCount"]), color: "#7AD6FF" },
  ];

  return (
    <PanelBody loading={loading} empty={data.length === 0}>
      <h3 className="mb-4 text-[13px] font-bold">{t("analytics.toolTitle")}</h3>
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_170px]">
        <RankingChart
          data={data}
          color={CHART_COLOR}
          renderTooltip={(index) => {
            const item = topTools[index];
            if (!item) return null;
            const count = readNumber(item, ["count"]);
            return (
              <>
                <div className="font-semibold text-foreground">
                  {readString(item, ["name"], t("analytics.unknownTool"))}
                </div>
                <div className="text-muted-foreground">
                  {count} {t("analytics.totalCalls")}
                </div>
                <div className="text-muted-foreground">
                  {total > 0 ? Math.round((count / total) * 100) : 0}%
                </div>
              </>
            );
          }}
        />
        <DonutChart
          segments={segments}
          centerLabel={String(total)}
          centerSub={t("analytics.totalCalls")}
          size={130}
        />
      </div>
      <StatsRow
        items={[
          { label: t("analytics.totalCalls"), value: String(total), icon: <MousePointer2 className="h-3.5 w-3.5" /> },
          { label: t("analytics.toolTypes"), value: String(readNumber(payload, ["distinctCount"])) },
          { label: t("analytics.searchPct"), value: `${total > 0 ? Math.round((readNumber(payload, ["searchCount"]) / total) * 100) : 0}%` },
        ]}
      />
    </PanelBody>
  );
}

function ChangesPanel({
  payload,
  loading,
  range,
}: {
  payload: unknown;
  loading: boolean;
  range: AnalyticsRange;
}) {
  const { t } = useTranslation();
  const series = readArray(payload, ["series"]);
  const data = series.map((item) => ({
    label: range === "today" ? t("analytics.today") : shortDate(readString(item, ["date"], "")),
    a: readNumber(item, ["writeOps"]),
    b: readNumber(item, ["readOps"]),
    line: readNumber(item, ["commands"]),
  }));

  return (
    <PanelBody loading={loading} empty={data.length === 0}>
      <h3 className="mb-4 text-[13px] font-bold">{t("analytics.changeTitle")}</h3>
      <Legend
        items={[
          { color: CHART_COLOR, label: t("analytics.writeOps") },
          { color: "#FF9A8A", label: t("analytics.readOps") },
          { color: "#7AD6FF", label: t("analytics.totalOps") },
        ]}
      />
      <StackedBarChart
        data={data}
        colorA={CHART_COLOR}
        renderTooltip={(index) => {
          const item = series[index];
          if (!item) return null;
          return (
            <>
              <div className="font-semibold text-foreground">{readString(item, ["date"], "")}</div>
              <div className="text-muted-foreground">
                {t("analytics.writeOps")} {readNumber(item, ["writeOps"])}
              </div>
              <div className="text-muted-foreground">
                {t("analytics.readOps")} {readNumber(item, ["readOps"])}
              </div>
              <div className="text-muted-foreground">
                {t("analytics.totalOps")} {readNumber(item, ["commands"])}
              </div>
            </>
          );
        }}
      />
      <StatsRow
        items={[
          { label: t("analytics.writeTotal"), value: String(readNumber(payload, ["writeCommands"])), icon: <GitCommitHorizontal className="h-3.5 w-3.5" /> },
          { label: t("analytics.readTotal"), value: String(readNumber(payload, ["readCommands"])) },
          { label: t("analytics.netTotal"), value: String(readNumber(payload, ["totalCommands"])) },
          { label: t("analytics.filesTotal"), value: String(readNumber(payload, ["otherCommands"])) },
        ]}
      />
    </PanelBody>
  );
}

function QuotaPanel({
  accountKey,
  payload,
  loading,
}: {
  accountKey: string;
  payload: unknown;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const points = readArray(payload, ["points"]);
  const labels = points.map((point) => {
    const date = new Date(readNumber(point, ["timestamp"]) * 1000);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  const primaryRemaining = points.map((point) => remainingQuota(point, "primaryUsedPercent"));
  const secondaryRemaining = points.map((point) => remainingQuota(point, "secondaryUsedPercent"));
  const lastPrimary = primaryRemaining[primaryRemaining.length - 1] ?? 0;
  const lastSecondary = secondaryRemaining[secondaryRemaining.length - 1] ?? 0;
  const empty = !accountKey || points.length < 2;

  return (
    <PanelBody loading={loading} empty={empty} emptyKey={accountKey ? "analytics.emptySeries" : "analytics.quotaAccountKeyRequired"}>
      <h3 className="mb-4 text-[13px] font-bold">{t("analytics.quotaTitle")}</h3>
      <Legend
        items={[
          { color: CHART_COLOR, label: t("analytics.quota5h") },
          { color: "#7AD6FF", label: t("analytics.quota1w") },
        ]}
      />
      <LineChart
        labels={labels}
        series={[
          { label: t("analytics.quota5h"), values: primaryRemaining },
          { label: t("analytics.quota1w"), values: secondaryRemaining },
        ]}
        colors={[CHART_COLOR, "#7AD6FF"]}
        yMax={100}
        ySuffix="%"
        renderTooltip={(index) => {
          const point = points[index];
          if (!point) return null;
          return (
            <>
              <div className="font-semibold text-foreground">
                {formatTimestamp(readNumber(point, ["timestamp"]))}
              </div>
              <div className="text-muted-foreground">
                {t("analytics.quota5h")} {Math.round(primaryRemaining[index] ?? 0)}%
              </div>
              <div className="text-muted-foreground">
                {t("analytics.quota1w")} {Math.round(secondaryRemaining[index] ?? 0)}%
              </div>
            </>
          );
        }}
      />
      <StatsRow
        items={[
          { label: t("analytics.quota5h"), value: `${Math.round(lastPrimary)}%` },
          { label: t("analytics.quota1w"), value: `${Math.round(lastSecondary)}%` },
        ]}
      />
    </PanelBody>
  );
}

function PanelBody({
  loading,
  empty,
  emptyKey = "analytics.emptySeries",
  children,
}: {
  loading: boolean;
  empty: boolean;
  emptyKey?: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  if (loading) return <ChartSkeleton />;
  if (empty) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-[8px] border border-dashed border-border text-sm text-muted-foreground">
        {t(emptyKey)}
      </div>
    );
  }
  return <>{children}</>;
}

function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex h-[160px] items-end gap-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton
            key={index}
            className="flex-1 rounded-[8px]"
            style={{ height: `${48 + (index % 4) * 22}px` }}
          />
        ))}
      </div>
      <div className="flex items-center divide-x divide-border border-t border-border pt-3.5 [&>*]:px-7 [&>*:first-child]:pl-0">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsRow({
  items,
}: {
  items: { label: string; value: string; icon?: ReactNode }[];
}) {
  return (
    <div className="mt-4 flex flex-wrap items-center divide-x divide-border border-t border-border pt-3.5 [&>*]:px-7 [&>*:first-child]:pl-0 [&>*:last-child]:pr-0">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-0.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            {item.icon}
            {item.label}
          </span>
          <span className="text-sm font-bold">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="relative inline-flex h-[9px] w-[9px] items-center justify-center">
            <span className="absolute inset-0 rounded-full opacity-20" style={{ background: item.color }} />
            <span className="relative h-[5px] w-[5px] rounded-full" style={{ background: item.color }} />
          </span>
          {item.label}
        </span>
      ))}
    </div>
  );
}

function shortDate(value: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatTimestamp(value: number) {
  if (!value) return "";
  const date = new Date(value * 1000);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCompact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return String(value);
}

function formatMinutes(value: number, unit: string) {
  if (!value) return "-";
  return `${value} ${unit}`;
}

function remainingQuota(point: unknown, key: string) {
  const used = readNumber(point, [key], Number.NaN);
  return Number.isFinite(used) ? Math.max(0, 100 - used) : 0;
}
