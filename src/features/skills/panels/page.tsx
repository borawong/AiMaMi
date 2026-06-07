import {
  AlertTriangle,
  Archive,
  Copy,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { BentoCard } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { SegmentedOptions } from "@/components/ui/options";
import { toast } from "@/hooks/toast";
import { formatDateTime } from "@/lib/time";
import type {
  InstalledSkillsPanelProps,
  SkillBackupsPanelProps,
  SkillsMetricsPanelProps,
  SkillsPagePanelProps,
  SkillsPathMetricProps,
  SkillsQueryFailureAlertProps,
} from "../types";

export function SkillsPagePanel({ controller }: SkillsPagePanelProps) {
  const { t } = useTranslation();

  const copyPath = (path: string) => {
    void navigator.clipboard.writeText(path);
    toast({
      title: t("skills.pathCopied"),
      description: t("skills.pathCopiedDesc"),
      variant: "default",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="max-w-md text-sm text-muted-foreground">
          {t("skills.description")}
        </p>
        <div className="flex items-center gap-2">
          <SegmentedOptions
            items={controller.tabs.map((item) => ({
              value: item.value,
              label: t(item.labelKey),
            }))}
            value={controller.tab}
            onChange={controller.selectTab}
          />
          <Button
            size="sm"
            onClick={controller.importAction.run}
            disabled={controller.importAction.isPending}
          >
            <Upload className="h-3.5 w-3.5" />
            {t("skills.import")}
          </Button>
        </div>
      </div>

      <SkillsMetricsPanel controller={controller} onCopyPath={copyPath} />

      {controller.queryFailureAlert ? (
        <SkillsQueryFailureAlert alert={controller.queryFailureAlert} />
      ) : controller.tab === "installed" ? (
        <InstalledSkillsPanel panel={controller.installedPanel} />
      ) : (
        <SkillBackupsPanel panel={controller.backupsPanel} />
      )}
    </div>
  );
}

function SkillsMetricsPanel({
  controller,
  onCopyPath,
}: SkillsMetricsPanelProps) {
  const { t } = useTranslation();
  const { skillsSummary } = controller;

  return (
    <div className="grid grid-cols-4 gap-4">
      <BentoCard compact>
        <span className="text-xs text-muted-foreground">
          {t("skills.skillCount")}
        </span>
        <span className="mt-1 text-lg font-semibold">
          {skillsSummary.skillsCount}
        </span>
      </BentoCard>
      <BentoCard compact>
        <span className="text-xs text-muted-foreground">
          {t("skills.backupCount")}
        </span>
        <span className="mt-1 text-lg font-semibold">
          {skillsSummary.backupsCount}
        </span>
      </BentoCard>
      <SkillsPathMetric
        labelKey="skills.rootPath"
        path={skillsSummary.skillsRootPath}
        onCopyPath={onCopyPath}
      />
      <SkillsPathMetric
        labelKey="skills.backupRootPath"
        path={skillsSummary.backupsRootPath}
        onCopyPath={onCopyPath}
      />
    </div>
  );
}

function SkillsPathMetric({
  labelKey,
  path,
  onCopyPath,
}: SkillsPathMetricProps) {
  const { t } = useTranslation();

  return (
    <BentoCard compact>
      <span className="text-xs text-muted-foreground">{t(labelKey)}</span>
      <button
        className="mt-1 flex w-full items-center gap-1.5 text-left"
        title={path}
        onClick={() => onCopyPath(path)}
      >
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {path}
        </span>
        <Copy className="h-3 w-3 shrink-0 text-muted-foreground" />
      </button>
    </BentoCard>
  );
}

function SkillsQueryFailureAlert({ alert }: SkillsQueryFailureAlertProps) {
  const { t } = useTranslation();

  return (
    <BentoCard
      role="alert"
      className="border-destructive/30 bg-destructive/5"
    >
      <div className="flex items-start gap-3 text-sm">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div className="min-w-0">
          <div className="font-medium text-destructive">
            {t(alert.titleKey)}
          </div>
          <p className="mt-1 text-muted-foreground">
            {t(alert.descriptionKey)}
          </p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3"
            disabled={alert.isRetrying}
            onClick={() => void alert.retry()}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("common.retry")}
          </Button>
        </div>
      </div>
    </BentoCard>
  );
}

function InstalledSkillsPanel({ panel }: InstalledSkillsPanelProps) {
  const { t } = useTranslation();

  if (panel.skills.length === 0) {
    return (
      <BentoCard>
        <div className="flex h-48 flex-col items-center justify-center">
          <Sparkles className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            {t("skills.empty")}
          </p>
        </div>
      </BentoCard>
    );
  }

  return (
    <BentoCard className="p-0">
      <div className="divide-y divide-border">
        {panel.skills.map((skill) => (
          <div
            key={skill.id}
            className="group flex items-center justify-between px-5 py-4 transition-colors hover:bg-accent"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold">
                {skill.title || skill.name}
              </p>
              {skill.summary ? (
                <p className="mt-1.5 truncate text-[13px] text-muted-foreground">
                  {skill.summary}
                </p>
              ) : null}
            </div>
            <div className="ml-4 flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => panel.requestRemove(skill.id)}
                disabled={panel.isRemovePending}
                className="text-muted-foreground hover:border-destructive hover:bg-destructive hover:text-white"
                aria-label={t("skills.remove")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}

function SkillBackupsPanel({ panel }: SkillBackupsPanelProps) {
  const { t } = useTranslation();

  if (panel.backups.length === 0) {
    return (
      <BentoCard>
        <div className="flex h-48 flex-col items-center justify-center">
          <Archive className="h-10 w-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            {t("skills.noBackups")}
          </p>
        </div>
      </BentoCard>
    );
  }

  return (
    <BentoCard className="p-0">
      <div className="divide-y divide-border">
        {panel.backups.map((backup) => (
          <div
            key={backup.id}
            className="group flex items-center justify-between px-5 py-4 transition-colors hover:bg-accent"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold">
                {backup.title || backup.name}
              </p>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                {formatDateTime(backup.createdAt)} · {backup.relativePath}
              </p>
            </div>
            <div className="ml-4 flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => panel.restoreBackup(backup.id)}
                disabled={panel.isRestorePending}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("skills.restore")}
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => panel.requestDeleteBackup(backup.id)}
                disabled={panel.isDeletePending}
                className="text-muted-foreground hover:border-destructive hover:bg-destructive hover:text-white"
                aria-label={t("skills.deleteBackup")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </BentoCard>
  );
}
