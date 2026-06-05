/**
 * 中文职责说明：analytics 页面渲染用量、会话、token、工具和变更分析，不直接发起 IPC。
 */
import { useState, type ReactElement } from "react";
import { BarChart3, Code2, Coins, History, MousePointer2, Timer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { SegmentedOptions } from "@/components/ui/segmented-options";
import {
  envelopeData,
  readArray,
  readNumber,
  readString,
} from "@/features/_shared/evidence-data";
import {
  EvidencePageHeader,
  MetricCard,
  QueryPanel,
  RecordList,
} from "@/features/_shared/evidence-panels";
import type { AnalyticsRange } from "@/types";
import { type AnalyticsPanelId, useAnalyticsModule } from "../hooks";

const ranges: AnalyticsRange[] = ["today", "week", "month"];
const panels: AnalyticsPanelId[] = [
  "usage",
  "sessions",
  "tokens",
  "tools",
  "changes",
  "quota",
];

export function AnalyticsPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState<AnalyticsRange>("week");
  const [activePanel, setActivePanel] = useState<AnalyticsPanelId>("usage");
  const [quotaAccountKey, setQuotaAccountKey] = useState("");
  const module = useAnalyticsModule(range, {
    activePanel,
    quotaAccountKey,
  });
  const usage = envelopeData(module.usageQuery.data);
  const sessions = envelopeData(module.sessionQuery.data);
  const tokens = envelopeData(module.tokenQuery.data);
  const tools = envelopeData(module.toolQuery.data);
  const changes = envelopeData(module.changeQuery.data);
  const quota = envelopeData(module.quotaQuery.data);

  return (
    <div className="space-y-5">
      <EvidencePageHeader titleKey="nav.analytics" descriptionKey="analytics.description" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedOptions
          items={panels.map((value) => ({
            value,
            label: t(`analytics.panel.${value}`),
          }))}
          value={activePanel}
          onChange={(value) => setActivePanel(value as AnalyticsPanelId)}
        />
        <SegmentedOptions
          items={ranges.map((value) => ({
            value,
            label: t(`analytics.range.${value}`),
          }))}
          value={range}
          onChange={(value) => setRange(value as AnalyticsRange)}
        />
      </div>

      {activePanel === "quota" ? (
        <div className="max-w-sm">
          <Input
            value={quotaAccountKey}
            onChange={(event) => setQuotaAccountKey(event.target.value)}
            placeholder={t("analytics.quotaAccountKeyPlaceholder")}
            aria-label={t("analytics.quotaAccountKey")}
          />
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-5">
        <MetricCard
          labelKey="analytics.todaySessions"
          value={<MetricValue icon={<BarChart3 />} value={readNumber(usage, ["today.sessionCount"])} />}
        />
        <MetricCard
          labelKey="analytics.activeDays"
          value={<MetricValue icon={<Timer />} value={readNumber(usage, ["sessionStats.activeDays"])} />}
        />
        <MetricCard
          labelKey="analytics.totalTokens"
          value={<MetricValue icon={<Coins />} value={readNumber(tokens, ["totalTokens"])} />}
        />
        <MetricCard
          labelKey="analytics.toolCalls"
          value={<MetricValue icon={<MousePointer2 />} value={readNumber(tools, ["totalCalls"])} />}
        />
        <MetricCard
          labelKey="analytics.writeCommands"
          value={<MetricValue icon={<Code2 />} value={readNumber(changes, ["writeCommands"])} />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <QueryPanel titleKey="analytics.usage" state={module.usageQuery}>
          <RecordList
            items={readArray(usage, ["dailyActivity", "series"])}
            emptyKey="analytics.emptySeries"
          />
        </QueryPanel>
        <QueryPanel titleKey="analytics.sessions" state={module.sessionQuery}>
          <RecordList
            items={readArray(sessions, ["series", "items"])}
            emptyKey="analytics.emptySeries"
          />
        </QueryPanel>
        <QueryPanel titleKey="analytics.tokens" state={module.tokenQuery}>
          <RecordList
            items={readArray(tokens, ["series"])}
            emptyKey="analytics.emptySeries"
          />
        </QueryPanel>
        <QueryPanel titleKey="analytics.tools" state={module.toolQuery}>
          <RecordList
            items={readArray(tools, ["topTools", "items"])}
            emptyKey="analytics.emptySeries"
            renderItem={(tool) => (
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-foreground">
                  {readString(tool, ["name"], t("analytics.unknownTool"))}
                </span>
                <span className="text-sm text-muted-foreground">
                  {readNumber(tool, ["count"])}
                </span>
              </div>
            )}
          />
        </QueryPanel>
        <QueryPanel titleKey="analytics.quotaHistory" state={module.quotaQuery}>
          <RecordList
            items={readArray(quota, ["points", "items", "series"])}
            emptyKey={
              quotaAccountKey.trim()
                ? "analytics.emptySeries"
                : "analytics.quotaAccountKeyRequired"
            }
            renderItem={(point) => (
              <div className="flex min-w-0 items-center justify-between gap-3">
                <span className="inline-flex min-w-0 items-center gap-2">
                  <History className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium text-foreground">
                    {readString(point, ["accountKey"], quotaAccountKey)}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatQuotaPoint(point)}
                </span>
              </div>
            )}
          />
        </QueryPanel>
      </div>
    </div>
  );
}

function MetricValue({ icon, value }: { icon: ReactElement; value: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      {icon}
      {value}
    </span>
  );
}

function formatQuotaPoint(point: unknown) {
  const primary = readNumber(point, ["primaryUsedPercent"]);
  const secondary = readNumber(point, ["secondaryUsedPercent"]);
  return `${Math.round(primary)}% / ${Math.round(secondary)}%`;
}
