/**
 * 中文职责说明：voice feature 页面只装配本模块交互壳，具体交互归 panels owner。
 */
import type { ReactElement, ReactNode } from "react";
import { History, Mic, ScrollText, Wand2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import {
  VoiceConfigPanel,
  VoiceOverlayPanel,
  VoiceRuntimePanel,
  VoiceWorkspacePanel,
} from "../panels";
import { useVoiceModule } from "../hooks";

export function VoicePage() {
  const module = useVoiceModule();
  const { workspaceFacts, runtimeFacts } = module;

  return (
    <div className="space-y-5">
      <VoicePageHeader titleKey="nav.voice" descriptionKey="voice.description" />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard
          labelKey="voice.templateCount"
          value={
            <MetricIcon icon={<ScrollText />} value={workspaceFacts.templates.length} />
          }
        />
        <MetricCard
          labelKey="voice.vocabularyCount"
          value={<MetricIcon icon={<Wand2 />} value={workspaceFacts.vocabulary.length} />}
        />
        <MetricCard
          labelKey="voice.historyCount"
          value={<MetricIcon icon={<History />} value={workspaceFacts.history.length} />}
        />
        <MetricCard
          labelKey="voice.runtimeEnabled"
          value={
            <span className="inline-flex min-w-0 flex-wrap gap-2">
              <BoolBadge
                value={runtimeFacts.supported}
                trueKey="voice.supported"
                falseKey="voice.unsupported"
              />
              <BoolBadge
                value={runtimeFacts.enabled}
                trueKey="overview.enabled"
                falseKey="overview.disabled"
              />
              <Badge variant="outline" className="max-w-full truncate">
                <Mic className="h-3.5 w-3.5" />
                {runtimeFacts.captureState || "-"}
              </Badge>
            </span>
          }
        />
      </div>

      <div className="grid gap-4 2xl:grid-cols-2">
        <VoiceWorkspacePanel module={module} />
        <VoiceRuntimePanel module={module} />
        <VoiceConfigPanel module={module} />
        <VoiceOverlayPanel module={module} />
      </div>
    </div>
  );
}

function VoicePageHeader({
  titleKey,
  descriptionKey,
}: {
  titleKey: string;
  descriptionKey: string;
}) {
  const { t } = useTranslation();

  return (
    <section className="border-b border-border pb-4">
      <h2 className="text-lg font-semibold text-foreground">{t(titleKey)}</h2>
      <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
        {t(descriptionKey)}
      </p>
    </section>
  );
}

function MetricCard({
  labelKey,
  value,
}: {
  labelKey: string;
  value: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <BentoCard compact>
      <span className="text-xs text-muted-foreground">{t(labelKey)}</span>
      <span className="mt-1 block min-w-0 text-lg font-semibold text-foreground">
        {value}
      </span>
    </BentoCard>
  );
}

function BoolBadge({
  value,
  trueKey,
  falseKey,
}: {
  value: boolean;
  trueKey: string;
  falseKey: string;
}) {
  const { t } = useTranslation();

  return (
    <Badge variant={value ? "default" : "outline"} className="shrink-0">
      {t(value ? trueKey : falseKey)}
    </Badge>
  );
}

function MetricIcon({ icon, value }: { icon: ReactElement; value: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      {icon}
      {value}
    </span>
  );
}
