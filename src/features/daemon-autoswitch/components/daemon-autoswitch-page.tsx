/**
 * 中文职责说明：daemon-autoswitch 页面渲染后台自动切换状态，不拥有后台任务事务。
 */
import { Activity, Clock, SlidersHorizontal, ToggleLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  envelopeData,
  readBoolean,
  readNumber,
  readString,
} from "@/features/_shared/evidence-data";
import {
  BoolBadge,
  EvidencePageHeader,
  MetricCard,
  QueryPanel,
  RecordSummary,
} from "@/features/_shared/evidence-panels";
import { formatDateTime } from "@/lib/format-time";
import { useDaemonAutoswitchModule } from "../hooks";

export function DaemonAutoswitchPage() {
  const { t } = useTranslation();
  const module = useDaemonAutoswitchModule();
  const bootstrap = envelopeData(module.bootstrapQuery.data);
  const pending = envelopeData(module.pendingQuery.data);
  const autoSwitch = envelopeData(readBootstrapPath(bootstrap, "autoSwitch"));
  const enabledEvidence = readBooleanField(autoSwitch, "enabled");
  const enabled = enabledEvidence ?? readBoolean(autoSwitch, ["enabled"]);
  const serviceState = readString(autoSwitch, ["serviceState"], "");
  const writtenAt = readNumber(bootstrap, ["writtenAt"]);

  return (
    <div className="space-y-5">
      <EvidencePageHeader
        titleKey="nav.daemonAutoswitch"
        descriptionKey="daemonAutoswitch.description"
        actions={[
          module.runOnceAction,
          module.dismissPendingAction,
          module.confirmPendingAction,
          module.confirmPendingAndRestartAction,
        ]}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          labelKey="daemonAutoswitch.enabled"
          value={
            <BoolBadge
              value={enabled}
              trueKey="overview.enabled"
              falseKey="overview.disabled"
            />
          }
        />
        <MetricCard
          labelKey="daemonAutoswitch.serviceState"
          value={
            <span className="inline-flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              {serviceState || "-"}
            </span>
          }
        />
        <MetricCard
          labelKey="daemonAutoswitch.writtenAt"
          value={
            <span className="inline-flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {writtenAt ? formatDateTime(writtenAt) : "-"}
            </span>
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <QueryPanel titleKey="daemonAutoswitch.bootstrap" state={module.bootstrapQuery}>
          <div className="flex items-center gap-2 rounded-[8px] border border-border p-3 text-sm text-muted-foreground">
            <ToggleLeft className="h-4 w-4 shrink-0" />
            <RecordSummary value={autoSwitch} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              aria-label={t("daemonAutoswitch.actionSetAutoSwitch")}
              disabled={module.setAutoSwitchAction.isPending || enabledEvidence === null}
              onClick={() => {
                if (enabledEvidence === null) return;
                void module.setAutoSwitchAction.run(!enabledEvidence);
              }}
            >
              <ToggleLeft className="h-3.5 w-3.5" />
            </Button>
            {/* 阈值配置需要两个真实输入字段；当前切片没有设置表单 owner，先保留禁用边界。 */}
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              disabled
              aria-label={t("daemonAutoswitch.actionConfigureAutoSwitch")}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </Button>
          </div>
        </QueryPanel>
        <QueryPanel titleKey="daemonAutoswitch.pending" state={module.pendingQuery}>
          <RecordSummary value={pending} />
        </QueryPanel>
      </div>
    </div>
  );
}

function readBootstrapPath(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return (value as Record<string, unknown>)[key] ?? null;
}

function readBooleanField(value: unknown, key: string) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const field = (value as Record<string, unknown>)[key];
  return typeof field === "boolean" ? field : null;
}
