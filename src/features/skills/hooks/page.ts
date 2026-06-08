import { useState } from "react";
import type { SkillsPageController, SkillsPageTab } from "../types";
import { useSkillsPageMutations } from "./mutation";
import { useSkillsPageQueries } from "./query";

const SKILLS_PAGE_TABS = [
  { value: "installed", labelKey: "skills.installed" },
  { value: "backups", labelKey: "skills.backups" },
] as const satisfies SkillsPageController["tabs"];

export function useSkillsPageController(): SkillsPageController {
  const [tab, setTab] = useState<SkillsPageTab>("installed");
  const [removingSkillId, setRemovingSkillId] = useState<string | null>(null);
  const [deletingBackupId, setDeletingBackupId] = useState<string | null>(null);
  const { skillsQuery, backupsQuery } = useSkillsPageQueries(tab);
  const {
    importMutation,
    removeMutation,
    restoreMutation,
    deleteBackupMutation,
  } = useSkillsPageMutations({
    onRemoved: () => setRemovingSkillId(null),
    onBackupDeleted: () => setDeletingBackupId(null),
  });

  const skills = skillsQuery.data?.data.items ?? [];
  const backups = backupsQuery.data?.data.items ?? [];
  const activeQuery = tab === "installed" ? skillsQuery : backupsQuery;

  const selectTab = (value: string) => {
    if (value === "installed" || value === "backups") {
      setTab(value);
    }
  };

  return {
    tab,
    tabs: SKILLS_PAGE_TABS,
    selectTab,
    skillsSummary: {
      skillsCount: skills.length,
      backupsCount: backups.length,
      skillsRootPath: skillsQuery.data?.data.rootPath ?? "",
      backupsRootPath: backupsQuery.data?.data.rootPath ?? "",
    },
    importAction: {
      isPending: importMutation.isPending,
      run: () => importMutation.mutate(),
    },
    installedPanel: {
      skills,
      requestRemove: (id: string) => setRemovingSkillId(id),
      isRemovePending: removeMutation.isPending,
    },
    backupsPanel: {
      backups,
      requestDeleteBackup: (id: string) => setDeletingBackupId(id),
      restoreBackup: (id: string) => restoreMutation.mutate(id),
      isRestorePending: restoreMutation.isPending,
      isDeletePending: deleteBackupMutation.isPending,
    },
    queryFailureAlert: activeQuery.isError
      ? {
          titleKey: "common.error",
          descriptionKey: "messageBoard.loadError",
          sourceTitleKey: "skills.loadFailed",
          sourceDescriptionKey: "skills.loadFailedDesc",
          isRetrying: activeQuery.isFetching,
          retry: () => activeQuery.refetch(),
        }
      : null,
    removeDialog: {
      open: removingSkillId !== null,
      isPending: removeMutation.isPending,
      close: () => setRemovingSkillId(null),
      confirm: () => {
        if (removingSkillId) removeMutation.mutate(removingSkillId);
      },
    },
    deleteBackupDialog: {
      open: deletingBackupId !== null,
      isPending: deleteBackupMutation.isPending,
      close: () => setDeletingBackupId(null),
      confirm: () => {
        if (deletingBackupId) deleteBackupMutation.mutate(deletingBackupId);
      },
    },
  };
}
