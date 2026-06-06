/**
 * 中文职责说明：语音模块没有 raw live route 证据时只渲染模块骨架和运行时状态，不承诺完整页面还原。
 */
import type { ReactElement, ReactNode } from "react";
import {
  History,
  RefreshCw,
  ScrollText,
  Search,
  Wand2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VoiceRecordPreview } from "../cache";
import { useVoiceModule } from "../hooks";
import { previewText, recordEntries } from "../utils";

export function VoicePage() {
  const { t } = useTranslation();
  const module = useVoiceModule();
  const { workspaceFacts, runtimeFacts } = module;
  const templates = workspaceFacts.templates;
  const vocabulary = workspaceFacts.vocabulary;
  const history = workspaceFacts.history;

  return (
    <div className="space-y-5">
      <VoicePageHeader titleKey="nav.voice" descriptionKey="voice.description" />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard
          labelKey="voice.templateCount"
          value={<MetricIcon icon={<ScrollText />} value={templates.length} />}
        />
        <MetricCard
          labelKey="voice.vocabularyCount"
          value={<MetricIcon icon={<Wand2 />} value={vocabulary.length} />}
        />
        <MetricCard
          labelKey="voice.historyCount"
          value={<MetricIcon icon={<History />} value={history.length} />}
        />
        <MetricCard
          labelKey="voice.runtimeEnabled"
          value={
            <span className="inline-flex flex-wrap gap-2">
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
            </span>
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <QueryPanel titleKey="voice.workspace" state={module.workspaceQuery}>
          <div className="space-y-5">
            <PreviewList
              titleKey="voice.templateCount"
              items={templates}
              emptyKey="voice.emptyTemplates"
              fallbackKey="voice.unknownTemplate"
            />
            <PreviewList
              titleKey="voice.vocabularyCount"
              items={vocabulary}
              emptyKey="voice.emptyVocabulary"
              fallbackKey="voice.unknownVocabulary"
            />
            <PreviewList
              titleKey="voice.historyCount"
              items={history}
              emptyKey="voice.emptyHistory"
              fallbackKey="voice.unknownHistory"
            />
          </div>
        </QueryPanel>

        <QueryPanel titleKey="voice.runtime" state={module.runtimeQuery}>
          <div className="space-y-3">
            <DetailRow label={t("voice.captureState")}>
              {runtimeFacts.captureState || "-"}
            </DetailRow>
            <DetailRow label={t("voice.shortcut")}>
              {runtimeFacts.globalShortcut || "-"}
            </DetailRow>
            <DetailRow label={t("voice.triggerStyle")}>
              {runtimeFacts.triggerStyle || "-"}
            </DetailRow>
            <DetailRow label={t("voice.triggerKey")}>
              {runtimeFacts.triggerKeyLabel || "-"}
            </DetailRow>
            <DetailRow label={t("voice.processingMode")}>
              {runtimeFacts.processingMode || "-"}
            </DetailRow>
            <DetailRow label={t("voice.processingModeId")}>
              {runtimeFacts.processingModeId || "-"}
            </DetailRow>
            <DetailRow label={t("voice.speechModel")}>
              {runtimeFacts.speechModel || "-"}
            </DetailRow>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <h3 className="text-xs font-medium text-muted-foreground">
              {t("voice.requestPermissions")}
            </h3>
            <div className="mt-3">
              <LocalObjectPreview value={runtimeFacts.permissions} />
            </div>
          </div>
        </QueryPanel>

        <QueryPanel titleKey="voice.config" state={module.runtimeQuery}>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label={t("voice.activeAsrProvider")}>
              {runtimeFacts.activeAsrProvider || "-"}
            </DetailRow>
            <DetailRow label={t("voice.activeAsrModel")}>
              {runtimeFacts.activeAsrModel || "-"}
            </DetailRow>
            <DetailRow label={t("voice.capturedApp")}>
              {runtimeFacts.capturedAppName || "-"}
            </DetailRow>
            <DetailRow label={t("voice.capturedBundle")}>
              {runtimeFacts.capturedBundleId || "-"}
            </DetailRow>
          </div>
        </QueryPanel>

        <BentoCard className="min-w-0">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-muted text-muted-foreground">
              <Search className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-foreground">
                {t("voice.injectOverlay")}
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("voice.description")}
              </p>
            </div>
          </div>
        </BentoCard>
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
      <span className="mt-1 block truncate text-lg font-semibold text-foreground">
        {value}
      </span>
    </BentoCard>
  );
}

function QueryPanel({
  titleKey,
  state,
  children,
}: {
  titleKey: string;
  state: {
    isLoading?: boolean;
    isFetching?: boolean;
    isError?: boolean;
    refetch?: () => Promise<unknown>;
  };
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <BentoCard className="min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-foreground">
            {t(titleKey)}
          </h3>
          <StatusLine state={state} />
        </div>
        {state.refetch && (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            disabled={state.isFetching}
            aria-label={t("common.refresh")}
            onClick={() => void state.refetch?.()}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", state.isFetching && "animate-spin")}
            />
          </Button>
        )}
      </div>
      <div className="mt-4">{children}</div>
    </BentoCard>
  );
}

function StatusLine({
  state,
}: {
  state: { isLoading?: boolean; isFetching?: boolean; isError?: boolean };
}) {
  const { t } = useTranslation();
  const key = state.isLoading
    ? "feature.restored.loading"
    : state.isError
      ? "feature.restored.error"
      : state.isFetching
        ? "feature.restored.refreshing"
        : "feature.restored.ready";

  return (
    <span
      className={cn(
        "text-xs text-muted-foreground",
        state.isError && "text-destructive",
      )}
    >
      {t(key)}
    </span>
  );
}

function PreviewList({
  titleKey,
  items,
  emptyKey,
  fallbackKey,
}: {
  titleKey: string;
  items: VoiceRecordPreview[];
  emptyKey: string;
  fallbackKey: string;
}) {
  const { t } = useTranslation();

  return (
    <section>
      <h3 className="text-xs font-medium text-muted-foreground">{t(titleKey)}</h3>
      {items.length === 0 ? (
        <p className="mt-2 rounded-[8px] border border-dashed border-border p-4 text-sm text-muted-foreground">
          {t(emptyKey)}
        </p>
      ) : (
        <div className="mt-2 divide-y divide-border rounded-[8px] border border-border">
          {items.map((item, index) => (
            <div key={item.id || index} className="min-w-0 px-4 py-3">
              <p className="truncate text-sm font-medium text-foreground">
                {item.primary || t(fallbackKey)}
              </p>
              {item.secondary && (
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {item.secondary}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function LocalObjectPreview({ value }: { value: unknown }) {
  const entries = recordEntries(value).slice(0, 4);

  if (entries.length === 0) {
    return <p className="truncate text-sm text-muted-foreground">{previewText(value)}</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, item]) => (
        <div key={key} className="grid gap-2 text-xs sm:grid-cols-[9rem_minmax(0,1fr)]">
          <span className="text-muted-foreground">{key}</span>
          <span className="min-w-0 truncate text-foreground">{previewText(item)}</span>
        </div>
      ))}
    </div>
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

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-foreground">{children}</span>
    </div>
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
