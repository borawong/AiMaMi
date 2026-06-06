import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BentoCard } from "@/components/ui/bento-card";
import { Button } from "@/components/ui/button";
import { SegmentedOptions } from "@/components/ui/segmented-options";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/format-time";
import {
  Sparkles,
  Upload,
  Trash2,
  RotateCcw,
  Archive,
  Copy,
  AlertTriangle,
} from "lucide-react";
import {
  useSkillsPageMutations,
  useSkillsPageQueries,
  type SkillsPageTab,
} from "../hooks";

export function SkillsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<SkillsPageTab>("installed");
  const [removing, setRemoving] = useState<string | null>(null);
  const [deletingBackup, setDeletingBackup] = useState<string | null>(null);
  const { skillsQuery, backupsQuery } = useSkillsPageQueries(tab);
  const {
    importMutation,
    removeMutation,
    restoreMutation,
    deleteBackupMutation,
  } = useSkillsPageMutations({
    onRemoved: () => setRemoving(null),
    onBackupDeleted: () => setDeletingBackup(null),
  });

  const skills = skillsQuery.data?.data.items ?? [];
  const backups = backupsQuery.data?.data.items ?? [];
  const skillsRootPath = skillsQuery.data?.data.rootPath ?? "";
  const backupsRootPath = backupsQuery.data?.data.rootPath ?? "";
  const activeQuery = tab === "installed" ? skillsQuery : backupsQuery;
  const activeQueryErrorVisible = activeQuery.isError;

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    toast({
      title: t("skills.pathCopied"),
      description: t("skills.pathCopiedDesc"),
      variant: "default",
    });
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <p className="max-w-md text-sm text-muted-foreground">{t("skills.description")}</p>
        <div className="flex items-center gap-2">
          <SegmentedOptions
            items={[
              { value: "installed", label: t("skills.installed") },
              { value: "backups", label: t("skills.backups") },
            ]}
            value={tab}
            onChange={(value) => setTab(value as SkillsPageTab)}
          />
          <Button size="sm" onClick={() => importMutation.mutate()} disabled={importMutation.isPending}>
            <Upload className="h-3.5 w-3.5" />
            {t("skills.import")}
          </Button>
        </div>
      </div>

      {/* 统计行 */}
      <div className="grid grid-cols-4 gap-4">
        <BentoCard compact>
          <span className="text-xs text-muted-foreground">{t("skills.skillCount")}</span>
          <span className="mt-1 text-lg font-semibold">{skills.length}</span>
        </BentoCard>
        <BentoCard compact>
          <span className="text-xs text-muted-foreground">{t("skills.backupCount")}</span>
          <span className="mt-1 text-lg font-semibold">{backups.length}</span>
        </BentoCard>
        <BentoCard compact>
          <span className="text-xs text-muted-foreground">{t("skills.rootPath")}</span>
          <button
            className="mt-1 flex w-full items-center gap-1.5 text-left"
            title={skillsRootPath}
            onClick={() => copyPath(skillsRootPath)}
          >
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{skillsRootPath}</span>
            <Copy className="h-3 w-3 shrink-0 text-muted-foreground" />
          </button>
        </BentoCard>
        <BentoCard compact>
          <span className="text-xs text-muted-foreground">{t("skills.backupRootPath")}</span>
          <button
            className="mt-1 flex w-full items-center gap-1.5 text-left"
            title={backupsRootPath}
            onClick={() => copyPath(backupsRootPath)}
          >
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{backupsRootPath}</span>
            <Copy className="h-3 w-3 shrink-0 text-muted-foreground" />
          </button>
        </BentoCard>
      </div>

      {/* 列表内容 */}
      {activeQueryErrorVisible ? (
        <BentoCard
          role="alert"
          className="border-destructive/30 bg-destructive/5"
        >
          <div className="flex items-start gap-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="min-w-0">
              <div className="font-medium text-destructive">
                {t("skills.loadFailed")}
              </div>
              <p className="mt-1 text-muted-foreground">
                {t("skills.loadFailedDesc")}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => void activeQuery.refetch()}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("common.retry")}
              </Button>
            </div>
          </div>
        </BentoCard>
      ) : tab === "installed" ? (
        skills.length === 0 ? (
          <BentoCard>
            <div className="flex h-48 flex-col items-center justify-center">
              <Sparkles className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">{t("skills.empty")}</p>
            </div>
          </BentoCard>
        ) : (
          <BentoCard className="p-0">
            <div className="divide-y divide-border">
              {skills.map((skill) => (
                <div
                  key={skill.id}
                  className="group flex items-center justify-between px-5 py-4 transition-colors hover:bg-accent"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold">{skill.title || skill.name}</p>
                    {skill.summary && (
                      <p className="mt-1.5 truncate text-[13px] text-muted-foreground">{skill.summary}</p>
                    )}
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setRemoving(skill.id)}
                      className="text-muted-foreground hover:bg-destructive hover:text-white hover:border-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
        )
      ) : backups.length === 0 ? (
        <BentoCard>
          <div className="flex h-48 flex-col items-center justify-center">
            <Archive className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">{t("skills.noBackups")}</p>
          </div>
        </BentoCard>
      ) : (
        <BentoCard className="p-0">
          <div className="divide-y divide-border">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="group flex items-center justify-between px-5 py-4 transition-colors hover:bg-accent"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">{backup.title || backup.name}</p>
                  <p className="mt-1.5 text-[13px] text-muted-foreground">
                    {formatDateTime(backup.createdAt)} · {backup.relativePath}
                  </p>
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <Button variant="outline" size="sm" onClick={() => restoreMutation.mutate(backup.id)} disabled={restoreMutation.isPending}>
                    <RotateCcw className="h-3.5 w-3.5" />
                    {t("skills.restore")}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => setDeletingBackup(backup.id)}
                    className="text-muted-foreground hover:bg-destructive hover:text-white hover:border-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
      )}

      {/* 移除技能确认弹窗 */}
      <AlertDialog open={removing !== null} onOpenChange={(v) => !v && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("skills.remove")}</AlertDialogTitle>
            <AlertDialogDescription>{t("skills.confirmRemove")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removing && removeMutation.mutate(removing)}
            >
              {t("skills.remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除备份确认弹窗 */}
      <AlertDialog open={deletingBackup !== null} onOpenChange={(v) => !v && setDeletingBackup(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("skills.deleteBackup")}</AlertDialogTitle>
            <AlertDialogDescription>{t("skills.confirmDeleteBackup")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingBackup && deleteBackupMutation.mutate(deletingBackup)}
            >
              {t("skills.deleteBackup")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
