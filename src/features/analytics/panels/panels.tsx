import { type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Coins,
  GitCommitHorizontal,
  MousePointer2,
  Timer,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { BentoCard } from "@/components/ui/bento";
import { Input } from "@/components/ui/input";
import { SegmentedOptions } from "@/components/ui/options";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  AnalyticsActivityRange,
  AnalyticsPageController,
  AnalyticsPanelId,
  AnalyticsStatItem,
} from "../types";
import { Heatmap, HeatmapLegend } from "../components/heatmap";
import {
  BarChart,
  ComboChart,
  DonutChart,
  LineChart,
  RankingChart,
  StackedBarChart,
} from "../components/charts";

const CHART_COLOR = "var(--heatmap-color, #3FE6A1)";
const BLUE_CHART_COLOR = "#7AD6FF";
const WARNING_CHART_COLOR = "#FFD36E";
const READ_CHART_COLOR = "#FF9A8A";

export function AnalyticsPageHeader() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-xl font-semibold tracking-normal">{t("nav.analytics")}</h1>
    </div>
  );
}

export function AnalyticsPanels({ controller }: { controller: AnalyticsPageController }) {
  const { t } = useTranslation();
  return (
    <BentoCard className="overflow-visible rounded-[15px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedOptions
          items={controller.panelOptions.map((item) => ({
            value: item.value,
            label: t(item.labelKey),
          }))}
          value={controller.activePanel}
          onChange={(value) => controller.setActivePanel(value as AnalyticsPanelId)}
        />
        {controller.activePanel === "activity" ? (
          <SegmentedOptions
            items={controller.activityRangeOptions.map((item) => ({
              value: item.value,
              label: t(item.labelKey),
            }))}
            value={controller.activityRange}
            onChange={(value) => controller.setActivityRange(value as AnalyticsActivityRange)}
          />
        ) : (
          <SegmentedOptions
            items={controller.rangeOptions.map((item) => ({
              value: item.value,
              label: t(item.labelKey),
            }))}
            value={controller.range}
            onChange={(value) => controller.setRange(value as AnalyticsPageController["range"])}
          />
        )}
      </div>

      {controller.activePanel === "quota" ? (
        <div className="mt-4 max-w-sm">
          <Input
            value={controller.quotaAccountKey}
            onChange={(event) => controller.setQuotaAccountKey(event.target.value)}
          />
        </div>
      ) : null}

      <div className="mt-5">
        <ActiveAnalyticsPanel controller={controller} />
      </div>
    </BentoCard>
  );
}

function ActiveAnalyticsPanel({ controller }: { controller: AnalyticsPageController }) {
  switch (controller.activePanel) {
    case "activity":
      return <ActivityPanel model={controller.activity} />;
    case "sessions":
      return <SessionsPanel model={controller.sessions} />;
    case "token":
      return <TokenPanel model={controller.token} />;
    case "tools":
      return <ToolsPanel model={controller.tools} />;
    case "changes":
      return <ChangesPanel model={controller.changes} />;
    case "quota":
      return <QuotaPanel model={controller.quota} />;
    default:
      return null;
  }
}

function ActivityPanel({ model }: { model: AnalyticsPageController["activity"] }) {
  const { t } = useTranslation();
  return (
    <PanelBody loading={model.loading} errorMessage={model.errorMessage} empty={model.days.length === 0}>
      <h3 className="mb-4 text-[13px] font-bold">{t("analytics.activityTitle")}</h3>
      <Heatmap data={model.days} />
      <div className="mt-2 flex justify-center">
        <HeatmapLegend />
      </div>
      <StatsRow items={model.stats} />
    </PanelBody>
  );
}

function SessionsPanel({ model }: { model: AnalyticsPageController["sessions"] }) {
  const { t } = useTranslation();
  return (
    <PanelBody loading={model.loading} errorMessage={model.errorMessage} empty={model.data.length === 0}>
      <h3 className="mb-4 text-[13px] font-bold">{t("analytics.sessionTitle")}</h3>
      <BarChart
        data={model.data}
        color={CHART_COLOR}
        renderTooltip={(index) => {
          const item = model.tooltipPoints[index];
          if (!item) return null;
          return (
            <>
              <div className="font-semibold text-foreground">{item.date}</div>
              <div className="text-muted-foreground">
                {item.count} {t("analytics.tabSessions")}
              </div>
            </>
          );
        }}
      />
      <StatsRow items={model.stats} />
    </PanelBody>
  );
}

function TokenPanel({ model }: { model: AnalyticsPageController["token"] }) {
  const { t } = useTranslation();
  return (
    <PanelBody loading={model.loading} errorMessage={model.errorMessage} empty={model.data.length === 0}>
      <h3 className="mb-4 text-[13px] font-bold">{t("analytics.tokenTitle")}</h3>
      <Legend
        items={[
          { color: CHART_COLOR, label: t("analytics.tokenUsage") },
          { color: WARNING_CHART_COLOR, label: t("analytics.tokenCumulative") },
        ]}
      />
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_170px]">
        <ComboChart
          data={model.data}
          lineValues={model.cumulative}
          barColor={CHART_COLOR}
          renderTooltip={(index) => {
            const item = model.tooltipPoints[index];
            if (!item) return null;
            return (
              <>
                <div className="font-semibold text-foreground">{item.date}</div>
                <div className="text-muted-foreground">
                  {t("analytics.tokenUsage")} {item.totalTokensLabel}
                </div>
                <div className="text-muted-foreground">
                  {t("analytics.tokenCumulative")} {item.cumulativeLabel}
                </div>
              </>
            );
          }}
        />
        <DonutChart
          segments={model.segments}
          centerLabel={model.totalTokensLabel}
          centerSub={t("analytics.total")}
          size={130}
        />
      </div>
      <StatsRow items={model.stats} />
    </PanelBody>
  );
}

function ToolsPanel({ model }: { model: AnalyticsPageController["tools"] }) {
  const { t } = useTranslation();
  return (
    <PanelBody loading={model.loading} errorMessage={model.errorMessage} empty={model.data.length === 0}>
      <h3 className="mb-4 text-[13px] font-bold">{t("analytics.toolTitle")}</h3>
      <div className="grid items-start gap-4 lg:grid-cols-[1fr_170px]">
        <RankingChart
          data={model.data}
          color={CHART_COLOR}
          renderTooltip={(index) => {
            const item = model.tooltipPoints[index];
            if (!item) return null;
            return (
              <>
                <div className="font-semibold text-foreground">{item.name}</div>
                <div className="text-muted-foreground">
                  {item.count} {t("analytics.totalCalls")}
                </div>
                <div className="text-muted-foreground">{item.percentage}%</div>
              </>
            );
          }}
        />
        <DonutChart
          segments={model.segments}
          centerLabel={String(model.totalCalls)}
          centerSub={t("analytics.totalCalls")}
          size={130}
        />
      </div>
      <StatsRow items={model.stats} />
    </PanelBody>
  );
}

function ChangesPanel({ model }: { model: AnalyticsPageController["changes"] }) {
  const { t } = useTranslation();
  return (
    <PanelBody loading={model.loading} errorMessage={model.errorMessage} empty={model.data.length === 0}>
      <h3 className="mb-4 text-[13px] font-bold">{t("analytics.changeTitle")}</h3>
      <Legend
        items={[
          { color: CHART_COLOR, label: t("analytics.writeOps") },
          { color: READ_CHART_COLOR, label: t("analytics.readOps") },
          { color: BLUE_CHART_COLOR, label: t("analytics.totalOps") },
        ]}
      />
      <StackedBarChart
        data={model.data}
        colorA={CHART_COLOR}
        colorB={READ_CHART_COLOR}
        lineColor={BLUE_CHART_COLOR}
        renderTooltip={(index) => {
          const item = model.tooltipPoints[index];
          if (!item) return null;
          return (
            <>
              <div className="font-semibold text-foreground">{item.date}</div>
              <div className="text-muted-foreground">
                {t("analytics.writeOps")} {item.writeOps}
              </div>
              <div className="text-muted-foreground">
                {t("analytics.readOps")} {item.readOps}
              </div>
              <div className="text-muted-foreground">
                {t("analytics.totalOps")} {item.commands}
              </div>
            </>
          );
        }}
      />
      <StatsRow items={model.stats} />
    </PanelBody>
  );
}

function QuotaPanel({ model }: { model: AnalyticsPageController["quota"] }) {
  const { t } = useTranslation();
  const empty = !model.accountKey || model.labels.length < 2;
  return (
    <PanelBody
      loading={model.loading}
      errorMessage={model.errorMessage}
      empty={empty}
    >
      <h3 className="mb-4 text-[13px] font-bold">{t("analytics.quotaTitle")}</h3>
      <Legend
        items={[
          { color: CHART_COLOR, label: t("analytics.quota5h") },
          { color: BLUE_CHART_COLOR, label: t("analytics.quota1w") },
        ]}
      />
      <LineChart
        labels={model.labels}
        series={[
          { label: t("analytics.quota5h"), values: model.primaryRemaining },
          { label: t("analytics.quota1w"), values: model.secondaryRemaining },
        ]}
        colors={[CHART_COLOR, BLUE_CHART_COLOR]}
        yMax={100}
        ySuffix="%"
        renderTooltip={(index) => {
          const point = model.tooltipPoints[index];
          if (!point) return null;
          return (
            <>
              <div className="font-semibold text-foreground">{point.formattedTimestamp}</div>
              <div className="text-muted-foreground">
                {t("analytics.quota5h")} {point.primaryRemainingLabel}
              </div>
              <div className="text-muted-foreground">
                {t("analytics.quota1w")} {point.secondaryRemainingLabel}
              </div>
            </>
          );
        }}
      />
      <StatsRow items={model.stats} />
    </PanelBody>
  );
}

function PanelBody({
  loading,
  errorMessage,
  empty,
  children,
}: {
  loading: boolean;
  errorMessage: string | null;
  empty: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  if (loading) return <ChartSkeleton />;
  if (errorMessage) {
    return (
      <div className="flex min-h-[260px] flex-col items-center justify-center gap-1 rounded-[8px] border border-dashed border-destructive/50 px-4 text-center text-sm">
        <span className="font-medium text-destructive">{t("common.error")}</span>
        <span className="text-muted-foreground">{errorMessage}</span>
      </div>
    );
  }
  if (empty) {
    return (
      <div className="min-h-[260px] rounded-[8px] border border-dashed border-border" />
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

function StatsRow({ items }: { items: AnalyticsStatItem[] }) {
  return (
    <div className="mt-4 flex flex-wrap items-center divide-x divide-border border-t border-border pt-3.5 [&>*]:px-7 [&>*:first-child]:pl-0 [&>*:last-child]:pr-0">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col items-center gap-0.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            {statIcon(item.id)}
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

function statIcon(id: string) {
  const className = "h-3.5 w-3.5";
  switch (id) {
    case "todayActive":
      return <Activity className={className} />;
    case "weekActiveDays":
      return <Timer className={className} />;
    case "monthActiveDays":
      return <BarChart3 className={className} />;
    case "totalToken":
      return <Coins className={className} />;
    case "totalCalls":
      return <MousePointer2 className={className} />;
    case "writeTotal":
      return <GitCommitHorizontal className={className} />;
    default:
      return null;
  }
}
