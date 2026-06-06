/**
 * 中文职责说明：overview 页面聚合各模块只读事实，不 owning 模块私有业务状态。
 */
import { Activity, FolderCheck, Server, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
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
        actions={[module.refreshUsageAction]}
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
