import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatInvokeError } from "@/lib/error";
import type {
  AnalyticsRange,
  ChangeAnalyticsPayload,
  QuotaHistoryPayload,
  SessionAnalyticsPayload,
  TokenAnalyticsPayload,
  ToolAnalyticsPayload,
  UsageAnalyticsPayload,
} from "@/types";
import {
  envelopeData,
  formatCompact,
  formatTimestamp,
  readArray,
  readNumber,
  readString,
  remainingQuota,
  shortDate,
} from "../utils";
import type {
  AnalyticsActivityPanelModel,
  AnalyticsActivityRange,
  AnalyticsCacheEnvelope,
  AnalyticsChangePoint,
  AnalyticsChangesPanelModel,
  AnalyticsDataPoint,
  AnalyticsHeatmapDay,
  AnalyticsPageController,
  AnalyticsPanelId,
  AnalyticsPanelQueryState,
  AnalyticsQuotaPanelModel,
  AnalyticsQuotaPoint,
  AnalyticsSessionsPanelModel,
  AnalyticsSessionPoint,
  AnalyticsTokenPanelModel,
  AnalyticsTokenPoint,
  AnalyticsToolsPanelModel,
  AnalyticsToolPoint,
} from "../types";
import { useAnalyticsModule } from "./query";

const PANELS = [
  { value: "activity", labelKey: "analytics.tabActivity" },
  { value: "sessions", labelKey: "analytics.tabSessions" },
  { value: "token", labelKey: "analytics.tabToken" },
  { value: "tools", labelKey: "analytics.tabTools" },
  { value: "changes", labelKey: "analytics.tabChanges" },
  { value: "quota", labelKey: "analytics.tabQuota" },
] as const;

const ANALYTICS_RANGES = [
  { value: "today", labelKey: "analytics.rangeToday" },
  { value: "week", labelKey: "analytics.rangeWeek" },
  { value: "month", labelKey: "analytics.rangeMonth" },
] as const;

const ACTIVITY_RANGES = [
  { value: "week", labelKey: "analytics.rangeWeek" },
  { value: "month", labelKey: "analytics.rangeMonth" },
  { value: "year", labelKey: "analytics.rangeYear" },
] as const;

const CHART_COLOR = "var(--heatmap-color, #3FE6A1)";
const BLUE_CHART_COLOR = "#7AD6FF";
const WARNING_CHART_COLOR = "#FFD36E";
const INPUT_CHART_COLOR = "#79D0FF";
const OUTPUT_CHART_COLOR = "#7DE6AA";

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function useAnalyticsPageController(): AnalyticsPageController {
  const { t } = useTranslation();
  const [activePanel, setActivePanel] = useState<AnalyticsPanelId>("activity");
  const [range, setRange] = useState<AnalyticsRange>("week");
  const [activityRange, setActivityRange] = useState<AnalyticsActivityRange>("year");
  const [quotaAccountKey, setQuotaAccountKey] = useState("");
  const module = useAnalyticsModule(range, {
    activePanel,
    quotaAccountKey,
  });

  const usagePayload = resolvePanelPayload(module.usageEnvelope, module.usageQuery.data);
  const sessionPayload = resolvePanelPayload(module.sessionEnvelope, module.sessionQuery.data);
  const tokenPayload = resolvePanelPayload(module.tokenEnvelope, module.tokenQuery.data);
  const toolPayload = resolvePanelPayload(module.toolEnvelope, module.toolQuery.data);
  const changePayload = resolvePanelPayload(module.changeEnvelope, module.changeQuery.data);
  const quotaPayload = resolvePanelPayload(module.quotaEnvelope, module.quotaQuery.data);

  const activity = useMemo(
    () =>
      buildActivityPanel(
        envelopeData(usagePayload),
        panelLoading(usagePayload, module.usageQuery),
        panelError(usagePayload, module.usageQuery, t),
        activityRange,
        t,
      ),
    [
      activityRange,
      module.usageQuery.error,
      module.usageQuery.isError,
      module.usageQuery.isFetching,
      module.usageQuery.isPending,
      t,
      usagePayload,
    ],
  );
  const sessions = useMemo(
    () =>
      buildSessionsPanel(
        envelopeData(sessionPayload),
        panelLoading(sessionPayload, module.sessionQuery),
        panelError(sessionPayload, module.sessionQuery, t),
        range,
        t,
      ),
    [
      module.sessionQuery.error,
      module.sessionQuery.isError,
      module.sessionQuery.isFetching,
      module.sessionQuery.isPending,
      range,
      sessionPayload,
      t,
    ],
  );
  const token = useMemo(
    () =>
      buildTokenPanel(
        envelopeData(tokenPayload),
        panelLoading(tokenPayload, module.tokenQuery),
        panelError(tokenPayload, module.tokenQuery, t),
        range,
        t,
      ),
    [
      module.tokenQuery.error,
      module.tokenQuery.isError,
      module.tokenQuery.isFetching,
      module.tokenQuery.isPending,
      range,
      t,
      tokenPayload,
    ],
  );
  const tools = useMemo(
    () =>
      buildToolsPanel(
        envelopeData(toolPayload),
        panelLoading(toolPayload, module.toolQuery),
        panelError(toolPayload, module.toolQuery, t),
        t,
      ),
    [
      module.toolQuery.error,
      module.toolQuery.isError,
      module.toolQuery.isFetching,
      module.toolQuery.isPending,
      t,
      toolPayload,
    ],
  );
  const changes = useMemo(
    () =>
      buildChangesPanel(
        envelopeData(changePayload),
        panelLoading(changePayload, module.changeQuery),
        panelError(changePayload, module.changeQuery, t),
        range,
        t,
      ),
    [
      changePayload,
      module.changeQuery.error,
      module.changeQuery.isError,
      module.changeQuery.isFetching,
      module.changeQuery.isPending,
      range,
      t,
    ],
  );
  const quota = useMemo(
    () =>
      buildQuotaPanel(
        envelopeData(quotaPayload),
        panelLoading(quotaPayload, module.quotaQuery),
        panelError(quotaPayload, module.quotaQuery, t),
        quotaAccountKey,
        t,
      ),
    [
      module.quotaQuery.error,
      module.quotaQuery.isError,
      module.quotaQuery.isFetching,
      module.quotaQuery.isPending,
      quotaAccountKey,
      quotaPayload,
      t,
    ],
  );

  return {
    activePanel,
    range,
    activityRange,
    quotaAccountKey,
    panelOptions: PANELS,
    rangeOptions: ANALYTICS_RANGES,
    activityRangeOptions: ACTIVITY_RANGES,
    setActivePanel,
    setRange,
    setActivityRange,
    setQuotaAccountKey,
    activity,
    sessions,
    token,
    tools,
    changes,
    quota,
  };
}

function resolvePanelPayload<TPayload>(
  envelope: AnalyticsCacheEnvelope<TPayload> | null | undefined,
  queryData: TPayload | undefined,
): TPayload | null | undefined {
  return envelope?.payload ?? (envelope ? null : queryData);
}

function panelLoading(panelPayload: unknown, query: AnalyticsPanelQueryState) {
  return !panelPayload && (query.isPending || query.isFetching);
}

function panelError(panelPayload: unknown, query: AnalyticsPanelQueryState, t: Translate) {
  return !panelPayload && query.isError ? formatInvokeError(query.error, t("common.error")) : null;
}

function buildActivityPanel(
  payload: UsageAnalyticsPayload | null,
  loading: boolean,
  errorMessage: string | null,
  range: AnalyticsActivityRange,
  t: Translate,
): AnalyticsActivityPanelModel {
  const daily = readArray(payload, ["dailyActivity"]);
  const sliceSize = range === "week" ? 7 : range === "month" ? 30 : daily.length;
  const days = daily.slice(-sliceSize).map<AnalyticsHeatmapDay>((item) => ({
    date: readString(item, ["date"], ""),
    level: readNumber(item, ["activityLevel"]),
    count: readNumber(item, ["sessionCount"]),
    activeMinutes: readNumber(item, ["activeMinutes"]),
    tokens: readNumber(item, ["tokens"]),
  }));
  const today = readNumber(payload, ["today.activeMinutesEstimate"]);
  const weekActiveDays = daily
    .slice(-7)
    .filter((item) => readNumber(item, ["sessionCount"]) > 0).length;
  const monthActiveDays = daily
    .slice(-30)
    .filter((item) => readNumber(item, ["sessionCount"]) > 0).length;

  return {
    loading,
    errorMessage,
    days,
    stats: [
      {
        id: "todayActive",
        label: t("analytics.todayActive"),
        value: today ? t("analytics.minutesValue", { count: today }) : "-",
      },
      {
        id: "weekActiveDays",
        label: t("analytics.weekActiveDays"),
        value: `${weekActiveDays} ${t("analytics.days")}`,
      },
      {
        id: "monthActiveDays",
        label: t("analytics.monthActiveDays"),
        value: `${monthActiveDays} ${t("analytics.days")}`,
      },
    ],
  };
}

function buildSessionsPanel(
  payload: SessionAnalyticsPayload | null,
  loading: boolean,
  errorMessage: string | null,
  range: AnalyticsRange,
  t: Translate,
): AnalyticsSessionsPanelModel {
  const series = readArray(payload, ["series"]);
  const tooltipPoints = series.map<AnalyticsSessionPoint>((item) => {
    const date = readString(item, ["date"], "");
    const count = readNumber(item, ["count"]);
    return {
      date,
      count,
      label: range === "today" ? t("analytics.today") : shortDate(date),
      value: count,
    };
  });

  return {
    loading,
    errorMessage,
    data: toDataPoints(tooltipPoints),
    tooltipPoints,
    stats: [
      {
        id: "totalSessions",
        label: t("analytics.totalSessions"),
        value: String(readNumber(payload, ["totalSessions"])),
      },
      {
        id: "avgTurns",
        label: t("analytics.avgTurns"),
        value: readNumber(payload, ["avgTurns"]).toFixed(1),
      },
      {
        id: "activeDays",
        label: t("analytics.activeDays"),
        value: String(readNumber(payload, ["activeDays"])),
      },
    ],
  };
}

function buildTokenPanel(
  payload: TokenAnalyticsPayload | null,
  loading: boolean,
  errorMessage: string | null,
  range: AnalyticsRange,
  t: Translate,
): AnalyticsTokenPanelModel {
  const series = readArray(payload, ["series"]);
  const tooltipPoints = series.map<AnalyticsTokenPoint>((item) => {
    const date = readString(item, ["date"], "");
    const totalTokens = readNumber(item, ["totalTokens"]);
    const cumulative = readNumber(item, ["cumulative"]);
    return {
      date,
      totalTokens,
      cumulative,
      totalTokensLabel: formatCompact(totalTokens),
      cumulativeLabel: formatCompact(cumulative),
      label: range === "today" ? t("analytics.today") : shortDate(date),
      value: totalTokens,
    };
  });
  const totalTokens = readNumber(payload, ["totalTokens"]);

  return {
    loading,
    errorMessage,
    data: toDataPoints(tooltipPoints),
    cumulative: tooltipPoints.map((item) => item.cumulative),
    tooltipPoints,
    segments: [
      {
        label: t("analytics.tokenInput"),
        value: readNumber(payload, ["inputTotal"]),
        color: INPUT_CHART_COLOR,
      },
      {
        label: t("analytics.tokenOutput"),
        value: readNumber(payload, ["outputTotal"]),
        color: OUTPUT_CHART_COLOR,
      },
      {
        label: t("analytics.tokenReasoning"),
        value: readNumber(payload, ["reasoningTotal"]),
        color: WARNING_CHART_COLOR,
      },
    ],
    totalTokensLabel: formatCompact(totalTokens),
    stats: [
      {
        id: "totalToken",
        label: t("analytics.totalToken"),
        value: formatCompact(totalTokens),
      },
      {
        id: "avgTokenPerSession",
        label: t("analytics.avgTokenPerSession"),
        value: formatCompact(Math.round(readNumber(payload, ["avgPerSession"]))),
      },
      {
        id: "reasoningPct",
        label: t("analytics.reasoningPct"),
        value: `${Math.round(readNumber(payload, ["reasoningPct"]))}%`,
      },
    ],
  };
}

function buildToolsPanel(
  payload: ToolAnalyticsPayload | null,
  loading: boolean,
  errorMessage: string | null,
  t: Translate,
): AnalyticsToolsPanelModel {
  const topTools = readArray(payload, ["topTools"]);
  const totalCalls = readNumber(payload, ["totalCalls"]);
  const tooltipPoints = topTools.map<AnalyticsToolPoint>((item) => {
    const name = readString(item, ["name"], t("analytics.unknownTool"));
    const count = readNumber(item, ["count"]);
    return {
      name,
      count,
      label: name,
      value: count,
      percentage: totalCalls > 0 ? Math.round((count / totalCalls) * 100) : 0,
    };
  });

  return {
    loading,
    errorMessage,
    data: toDataPoints(tooltipPoints),
    tooltipPoints,
    segments: [
      {
        label: t("analytics.editTasks"),
        value: readNumber(payload, ["editCount"]),
        color: CHART_COLOR,
      },
      {
        label: t("analytics.searchTasks"),
        value: readNumber(payload, ["searchCount"]),
        color: BLUE_CHART_COLOR,
      },
    ],
    totalCalls,
    stats: [
      {
        id: "totalCalls",
        label: t("analytics.totalCalls"),
        value: String(totalCalls),
      },
      {
        id: "toolTypes",
        label: t("analytics.toolTypes"),
        value: String(readNumber(payload, ["distinctCount"])),
      },
      {
        id: "searchPct",
        label: t("analytics.searchPct"),
        value: `${totalCalls > 0 ? Math.round((readNumber(payload, ["searchCount"]) / totalCalls) * 100) : 0}%`,
      },
    ],
  };
}

function buildChangesPanel(
  payload: ChangeAnalyticsPayload | null,
  loading: boolean,
  errorMessage: string | null,
  range: AnalyticsRange,
  t: Translate,
): AnalyticsChangesPanelModel {
  const series = readArray(payload, ["series"]);
  const tooltipPoints = series.map<AnalyticsChangePoint>((item) => {
    const date = readString(item, ["date"], "");
    const writeOps = readNumber(item, ["writeOps"]);
    const readOps = readNumber(item, ["readOps"]);
    const commands = readNumber(item, ["commands"]);
    return {
      date,
      label: range === "today" ? t("analytics.today") : shortDate(date),
      a: writeOps,
      b: readOps,
      line: commands,
      writeOps,
      readOps,
      commands,
    };
  });

  return {
    loading,
    errorMessage,
    data: tooltipPoints,
    tooltipPoints,
    stats: [
      {
        id: "writeTotal",
        label: t("analytics.writeTotal"),
        value: String(readNumber(payload, ["writeCommands"])),
      },
      {
        id: "readTotal",
        label: t("analytics.readTotal"),
        value: String(readNumber(payload, ["readCommands"])),
      },
      {
        id: "netTotal",
        label: t("analytics.netTotal"),
        value: String(readNumber(payload, ["totalCommands"])),
      },
      {
        id: "filesTotal",
        label: t("analytics.filesTotal"),
        value: String(readNumber(payload, ["otherCommands"])),
      },
    ],
  };
}

function buildQuotaPanel(
  payload: QuotaHistoryPayload | null,
  loading: boolean,
  errorMessage: string | null,
  quotaAccountKey: string,
  t: Translate,
): AnalyticsQuotaPanelModel {
  const accountKey = quotaAccountKey.trim();
  const points = readArray(payload, ["points"]);
  const tooltipPoints = points.map<AnalyticsQuotaPoint>((point) => {
    const timestamp = readNumber(point, ["timestamp"]);
    const primaryRemaining = remainingQuota(point, "primaryUsedPercent");
    const secondaryRemaining = remainingQuota(point, "secondaryUsedPercent");
    const date = new Date(timestamp * 1000);
    return {
      timestamp,
      label: Number.isNaN(date.getTime()) ? "" : `${date.getMonth() + 1}/${date.getDate()}`,
      formattedTimestamp: formatTimestamp(timestamp),
      primaryRemaining,
      secondaryRemaining,
      primaryRemainingLabel: `${Math.round(primaryRemaining)}%`,
      secondaryRemainingLabel: `${Math.round(secondaryRemaining)}%`,
    };
  });
  const lastPoint = tooltipPoints[tooltipPoints.length - 1];

  return {
    loading,
    errorMessage,
    accountKey,
    emptyKey: accountKey ? "analytics.emptySeries" : "analytics.quotaAccountKeyRequired",
    labels: tooltipPoints.map((point) => point.label),
    primaryRemaining: tooltipPoints.map((point) => point.primaryRemaining),
    secondaryRemaining: tooltipPoints.map((point) => point.secondaryRemaining),
    tooltipPoints,
    stats: [
      {
        id: "quota5h",
        label: t("analytics.quota5h"),
        value: lastPoint?.primaryRemainingLabel ?? "0%",
      },
      {
        id: "quota1w",
        label: t("analytics.quota1w"),
        value: lastPoint?.secondaryRemainingLabel ?? "0%",
      },
    ],
  };
}

function toDataPoints(points: readonly AnalyticsDataPoint[]) {
  return points.map<AnalyticsDataPoint>((point) => ({
    label: point.label,
    value: point.value,
  }));
}
