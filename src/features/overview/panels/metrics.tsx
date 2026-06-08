import { Activity, Server, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento";
import type {
  OverviewBoolBadgeModel,
  OverviewMetricIcon,
  OverviewMetricModel,
} from "../types";

export function OverviewMetricCards({ metrics }: { metrics: OverviewMetricModel[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {metrics.map((metric) => (
        <OverviewMetricCard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}

function OverviewMetricCard({ metric }: { metric: OverviewMetricModel }) {
  const { t } = useTranslation();

  return (
    <BentoCard compact>
      <span className="text-xs text-muted-foreground">{t(metric.labelKey)}</span>
      <span className="mt-1 block truncate text-lg font-semibold text-foreground">
        <OverviewMetricValue metric={metric} />
      </span>
      {metric.hintKey ? (
        <span className="mt-1 block truncate text-xs text-muted-foreground">
          {t(metric.hintKey, metric.hintParams)}
        </span>
      ) : null}
    </BentoCard>
  );
}

function OverviewMetricValue({ metric }: { metric: OverviewMetricModel }) {
  if (metric.value.type === "badges") {
    return (
      <span className="inline-flex flex-wrap gap-2">
        {metric.value.badges.map((badge) => (
          <OverviewBoolBadge key={badge.id} badge={badge} />
        ))}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <MetricIcon icon={metric.value.icon} />
      {metric.value.value}
    </span>
  );
}

function MetricIcon({ icon }: { icon: OverviewMetricIcon }) {
  if (icon === "activity") return <Activity className="h-4 w-4 text-muted-foreground" />;
  if (icon === "server") return <Server className="h-4 w-4 text-muted-foreground" />;
  return <Sparkles className="h-4 w-4 text-muted-foreground" />;
}

function OverviewBoolBadge({ badge }: { badge: OverviewBoolBadgeModel }) {
  const { t } = useTranslation();
  const statusKey = badge.value ? badge.trueKey : badge.falseKey;

  return (
    <Badge variant={badge.value ? "default" : "outline"} className="shrink-0">
      {t(badge.labelKey)} {t(statusKey)}
    </Badge>
  );
}
