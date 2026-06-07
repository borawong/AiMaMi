import type { ReactNode } from "react";
import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type {
  TrayShellMetricProps,
  TrayShellMetricsProps,
} from "../types";

export function TrayShellMetrics({ metrics }: TrayShellMetricsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {metrics.map((metric) => (
        <TrayShellMetric key={metric.id} metric={metric} />
      ))}
    </div>
  );
}

function TrayShellMetric({ metric }: TrayShellMetricProps) {
  const { t } = useTranslation();

  return (
    <MetricFrame label={t(metric.labelKey)}>
      <TrayShellMetricValue metric={metric} />
    </MetricFrame>
  );
}

function TrayShellMetricValue({ metric }: TrayShellMetricProps) {
  const { t } = useTranslation();

  if (metric.kind === "ready") {
    const connected = Boolean(metric.value);
    return (
      <Badge variant={connected ? "default" : "outline"}>
        {t(connected ? "common.success" : "common.error")}
      </Badge>
    );
  }

  if (metric.loading) {
    return (
      <span className="text-sm text-muted-foreground">
        {t("common.loading")}
      </span>
    );
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{String(metric.value || "-")}</span>
    </span>
  );
}

function MetricFrame({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 min-w-0 text-lg font-semibold text-foreground">
        {children}
      </div>
    </div>
  );
}
