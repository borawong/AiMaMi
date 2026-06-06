import { History, Mic, ScrollText, Wand2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento";
import type { VoiceMetricIcon, VoiceMetricModel } from "../types";

export function VoiceMetrics({ metrics }: { metrics: VoiceMetricModel[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {metrics.map((metric) => (
        <VoiceMetricCard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}

function VoiceMetricCard({ metric }: { metric: VoiceMetricModel }) {
  const { t } = useTranslation();

  return (
    <BentoCard compact>
      <span className="text-xs text-muted-foreground">
        {t(metric.labelKey)}
      </span>
      <span className="mt-1 block min-w-0 text-lg font-semibold text-foreground">
        <VoiceMetricValue metric={metric} />
      </span>
    </BentoCard>
  );
}

function VoiceMetricValue({ metric }: { metric: VoiceMetricModel }) {
  if (metric.kind === "runtime") {
    return <VoiceRuntimeMetric metric={metric} />;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <VoiceMetricIcon icon={metric.icon} />
      {metric.value}
    </span>
  );
}

function VoiceRuntimeMetric({ metric }: { metric: VoiceMetricModel }) {
  const { t } = useTranslation();

  if (metric.kind !== "runtime") return null;

  return (
    <span className="inline-flex min-w-0 flex-wrap gap-2">
      <Badge variant={metric.supported ? "default" : "outline"}>
        {t(metric.supported ? "voice.supported" : "voice.unsupported")}
      </Badge>
      <Badge variant={metric.enabled ? "default" : "outline"}>
        {t(metric.enabled ? "overview.enabled" : "overview.disabled")}
      </Badge>
      <Badge variant="outline" className="max-w-full truncate">
        <Mic className="h-3.5 w-3.5" />
        {metric.captureState || "-"}
      </Badge>
    </span>
  );
}

function VoiceMetricIcon({ icon }: { icon: VoiceMetricIcon }) {
  if (icon === "templates") return <ScrollText />;
  if (icon === "vocabulary") return <Wand2 />;
  return <History />;
}
