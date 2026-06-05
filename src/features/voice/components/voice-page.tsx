/**
 * 中文职责说明：voice 页面渲染语音 workspace 与 runtime 状态，不 owning 语音处理事务。
 */
import type { ReactElement } from "react";
import { History, ScrollText, Wand2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  envelopeData,
  readArray,
  readBoolean,
  readString,
} from "@/features/_shared/evidence-data";
import {
  BoolBadge,
  EvidencePageHeader,
  MetricCard,
  QueryPanel,
  RecordList,
  RecordSummary,
} from "@/features/_shared/evidence-panels";
import { useVoiceModule } from "../hooks";

export function VoicePage() {
  const { t } = useTranslation();
  const module = useVoiceModule();
  const workspace = envelopeData(module.workspaceQuery.data);
  const runtime = envelopeData(module.runtimeQuery.data);
  const templates = readArray(workspace, ["templates"]);
  const vocabulary = readArray(workspace, ["vocabulary"]);
  const history = readArray(workspace, ["history"]);
  const supported = readBoolean(runtime, ["supported"]);
  const enabled = readBoolean(runtime, ["enabled"]);

  return (
    <div className="space-y-5">
      <EvidencePageHeader
        titleKey="nav.voice"
        descriptionKey="voice.description"
        actions={[module.requestPermissionsAction]}
      />

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
                value={supported}
                trueKey="voice.supported"
                falseKey="voice.unsupported"
              />
              <BoolBadge
                value={enabled}
                trueKey="overview.enabled"
                falseKey="overview.disabled"
              />
            </span>
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <QueryPanel titleKey="voice.workspace" state={module.workspaceQuery}>
          <RecordList
            items={templates}
            emptyKey="voice.emptyTemplates"
            renderItem={(template) => (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {readString(template, ["title", "name", "id"], t("voice.unknownTemplate"))}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {readString(template, ["description", "kind"], "")}
                </p>
              </div>
            )}
          />
        </QueryPanel>
        <QueryPanel titleKey="voice.runtime" state={module.runtimeQuery}>
          <div className="space-y-3">
            <RuntimeRow label={t("voice.captureState")} value={readString(runtime, ["captureState"], "-")} />
            <RuntimeRow label={t("voice.shortcut")} value={readString(runtime, ["globalShortcut"], "-")} />
            <RuntimeRow label={t("voice.processingMode")} value={readString(runtime, ["processingMode"], "-")} />
            <RecordSummary value={readRuntimePermissions(runtime)} />
          </div>
        </QueryPanel>
      </div>
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

function RuntimeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-foreground">{value}</span>
    </div>
  );
}

function readRuntimePermissions(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return (value as Record<string, unknown>).permissions ?? null;
}
