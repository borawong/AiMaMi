import { Activity, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento";
import { formatDateTime } from "@/lib/time";
import type {
  DaemonAutoswitchMetricModel,
  DaemonAutoswitchMetricValue,
} from "../types";

export function DaemonAutoswitchMetrics({
  metrics,
}: {
  metrics: DaemonAutoswitchMetricModel[];
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {metrics.map((metric) => (
        <DaemonMetricCard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}

function DaemonMetricCard({ metric }: { metric: DaemonAutoswitchMetricModel }) {
  return (
    <BentoCard compact className="rounded-[8px]">
      <span className="block min-w-0 truncate text-lg font-semibold text-foreground">
        <DaemonMetricValue value={metric.value} />
      </span>
    </BentoCard>
  );
}

function DaemonMetricValue({ value }: { value: DaemonAutoswitchMetricValue }) {
  const { t } = useTranslation();

  if (value.kind === "badge") {
    return (
      <Badge variant={value.value ? "default" : "outline"} className="shrink-0">
        {t(value.value ? value.trueKey : value.falseKey)}
      </Badge>
    );
  }

  if (value.kind === "time") {
    return (
      <span className="inline-flex min-w-0 items-center gap-2">
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate">
          {value.value ? formatDateTime(value.value) : "-"}
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Activity className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{value.value}</span>
    </span>
  );
}
