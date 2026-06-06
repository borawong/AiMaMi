/**
 * 中文职责说明：overview 页面聚合各模块只读事实，不 owning 模块私有业务状态。
 */
import type { ReactElement } from "react";
import { Activity, Bell, FolderCheck, KeyRound, Merge, Server, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  envelopeData,
  readArray,
  readBoolean,
  readNumber,
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
import { formatDateTime } from "@/lib/format-time";
import { useOverviewModule } from "../hooks";

export function OverviewPage() {
  const { t } = useTranslation();
  const module = useOverviewModule();
  const snapshot = envelopeData(module.snapshotQuery.data);
  const usage = envelopeData(module.usageQuery.data);
  const mcp = envelopeData(module.mcpQuery.data);
  const skills = envelopeData(module.skillsQuery.data);
  const notificationState = envelopeData(module.notificationStateQuery.data);
  const mysteryUnlockGrants = envelopeData(module.mysteryUnlockGrantsQuery.data);
  const deviceId = module.deviceIdQuery.data ?? "";
  const mcpItems = readArray(mcp, ["items", "servers"]);
  const skillItems = readArray(skills, ["items", "skills"]);
  const authExists = readBoolean(snapshot, ["status.paths.authExists", "paths.authExists"]);
  const registryExists = readBoolean(snapshot, [
    "status.paths.registryExists",
    "paths.registryExists",
  ]);
  const todaySessions = readNumber(usage, ["today.sessionCount"]);
  const activeMinutes = readNumber(usage, ["today.activeMinutesEstimate"]);

  return (
    <div className="space-y-5">
      <EvidencePageHeader
        titleKey="nav.overview"
        descriptionKey="overview.description"
        actions={[module.refreshUsageAction, module.focusMainWindowAction]}
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard
          labelKey="overview.todaySessions"
          value={
            <span className="inline-flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              {todaySessions}
            </span>
          }
          hint={t("overview.todayActive", { minutes: activeMinutes })}
        />
        <MetricCard
          labelKey="overview.statMcp"
          value={
            <span className="inline-flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" />
              {mcpItems.length || readNumber(mcp, ["total"])}
            </span>
          }
        />
        <MetricCard
          labelKey="overview.statSkills"
          value={
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              {skillItems.length || readNumber(skills, ["total"])}
            </span>
          }
        />
        <MetricCard
          labelKey="overview.healthTitle"
          value={
            <span className="inline-flex flex-wrap gap-2">
              <BoolBadge
                value={authExists}
                trueKey="overview.healthAuthOk"
                falseKey="overview.healthAuthMissing"
              />
              <BoolBadge
                value={registryExists}
                trueKey="overview.healthRegistryOk"
                falseKey="overview.healthRegistryMissing"
              />
            </span>
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <QueryPanel titleKey="overview.snapshot" state={module.snapshotQuery}>
          <div className="space-y-3 text-sm">
            <HealthRow
              label={t("overview.deviceId")}
              value={deviceId || "-"}
            />
            <HealthRow
              label={t("overview.healthCodexHome")}
              value={readString(snapshot, ["status.paths.codexHome", "paths.codexHome"], "")}
            />
            <HealthRow
              label={t("overview.usageSource")}
              value={readString(snapshot, ["status.usageSource", "usageSource"], "")}
            />
          </div>
        </QueryPanel>
        <QueryPanel titleKey="overview.usage" state={module.usageQuery}>
          <RecordList
            items={readArray(usage, ["dailyActivity"])}
            emptyKey="analytics.emptySeries"
          />
        </QueryPanel>
        <QueryPanel titleKey="overview.mcp" state={module.mcpQuery}>
          <RecordList items={mcpItems} emptyKey="mcp.empty" />
        </QueryPanel>
        <QueryPanel titleKey="overview.skills" state={module.skillsQuery}>
          <RecordList
            items={skillItems}
            emptyKey="skills.empty"
            renderItem={(skill) => (
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {readString(skill, ["title", "name", "id"], t("skills.empty"))}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {formatOptionalTime(readNumber(skill, ["updatedAt"]))}
                  </p>
                </div>
                <FolderCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            )}
          />
        </QueryPanel>
        <QueryPanel
          titleKey="overview.notificationState"
          state={module.notificationStateQuery}
        >
          <RecordSummary value={notificationState} />
        </QueryPanel>
        <QueryPanel
          titleKey="overview.mysteryGrants"
          state={module.mysteryUnlockGrantsQuery}
        >
          <RecordSummary value={mysteryUnlockGrants} />
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            {/* 远端设备密钥与 grants 合并需要完整安全交互证据，当前切片只保留禁用边界。 */}
            <BoundaryButton
              icon={<KeyRound />}
              label={t("overview.remoteSecretBoundary")}
            />
            <BoundaryButton
              icon={<Bell />}
              label={t("overview.importRemoteSecretBoundary")}
            />
            <BoundaryButton
              icon={<Merge />}
              label={t("overview.mergeMysteryGrantsBoundary")}
            />
          </div>
        </QueryPanel>
      </div>
    </div>
  );
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-foreground">{value}</span>
    </div>
  );
}

function formatOptionalTime(value: number) {
  return value ? formatDateTime(value) : "";
}

function BoundaryButton({
  icon,
  label,
}: {
  icon: ReactElement;
  label: string;
}) {
  return (
    <Button type="button" size="sm" variant="outline" disabled aria-label={label}>
      {icon}
      {label}
    </Button>
  );
}
