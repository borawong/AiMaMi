/**
 * 中文职责说明：skills 模块 hook 拥有 full refresh、active-only refresh、abort 和 replay 防护入口。
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { skillsService } from "@/services/skills";
import { SkillsCache } from "../cache";

export function useSkillsCacheController() {
  return useModuleCacheController(SkillsCache);
}

export type SkillsPageTab = "installed" | "backups";

export function useSkillsPageQueries(tab: SkillsPageTab) {
  const skillsQuery = useQuery({
    queryKey: ["installed-skills"],
    queryFn: () => skillsService.loadInstalled(),
    staleTime: Infinity,
  });

  const backupsQuery = useQuery({
    queryKey: ["skill-backups"],
    queryFn: () => skillsService.loadBackups(),
    enabled: tab === "backups",
  });

  return {
    skillsQuery,
    backupsQuery,
  };
}

export function useSkillsPageMutations(options?: {
  onRemoved?: () => void;
  onBackupDeleted?: () => void;
}) {
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async () => {
      const path = await skillsService.pickSkillDirectory();
      if (path) return skillsService.importSkill(path);
      throw new Error("cancelled");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["installed-skills"] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => skillsService.removeSkill(id),
    onSuccess: () => {
      options?.onRemoved?.();
      queryClient.invalidateQueries({ queryKey: ["installed-skills"] });
      queryClient.invalidateQueries({ queryKey: ["skill-backups"] });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => skillsService.restoreBackup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installed-skills"] });
      queryClient.invalidateQueries({ queryKey: ["skill-backups"] });
    },
  });

  const deleteBackupMutation = useMutation({
    mutationFn: (id: string) => skillsService.deleteBackup(id),
    onSuccess: () => {
      options?.onBackupDeleted?.();
      queryClient.invalidateQueries({ queryKey: ["skill-backups"] });
    },
  });

  return {
    importMutation,
    removeMutation,
    restoreMutation,
    deleteBackupMutation,
  };
}
