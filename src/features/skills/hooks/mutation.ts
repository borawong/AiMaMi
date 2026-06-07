import { useMutation, useQueryClient } from "@tanstack/react-query";
import { skillsService } from "@/services/skills";
import {
  SKILLS_BACKUPS_QUERY_KEY,
  SKILLS_INSTALLED_QUERY_KEY,
  writeSkillsMutationPayload,
} from "../cache";

export interface UseSkillsPageMutationsOptions {
  onRemoved?: () => void;
  onBackupDeleted?: () => void;
}

export function useSkillsPageMutations(
  options?: UseSkillsPageMutationsOptions,
) {
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async () => {
      const path = await skillsService.pickSkillDirectory();
      if (path) return skillsService.importSkill(path);
      return null;
    },
    onMutate: () =>
      Promise.all([
        queryClient.cancelQueries({ queryKey: SKILLS_INSTALLED_QUERY_KEY }),
        queryClient.cancelQueries({ queryKey: SKILLS_BACKUPS_QUERY_KEY }),
      ]),
    onSuccess: (payload) => {
      if (payload) return writeSkillsMutationPayload(queryClient, payload);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => skillsService.removeSkill(id),
    onMutate: () =>
      Promise.all([
        queryClient.cancelQueries({ queryKey: SKILLS_INSTALLED_QUERY_KEY }),
        queryClient.cancelQueries({ queryKey: SKILLS_BACKUPS_QUERY_KEY }),
      ]),
    onSuccess: async (payload) => {
      await writeSkillsMutationPayload(queryClient, payload);
      options?.onRemoved?.();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => skillsService.restoreBackup(id),
    onMutate: () =>
      Promise.all([
        queryClient.cancelQueries({ queryKey: SKILLS_INSTALLED_QUERY_KEY }),
        queryClient.cancelQueries({ queryKey: SKILLS_BACKUPS_QUERY_KEY }),
      ]),
    onSuccess: (payload) => writeSkillsMutationPayload(queryClient, payload),
  });

  const deleteBackupMutation = useMutation({
    mutationFn: (id: string) => skillsService.deleteBackup(id),
    onMutate: () =>
      queryClient.cancelQueries({ queryKey: SKILLS_BACKUPS_QUERY_KEY }),
    onSuccess: async (payload) => {
      await writeSkillsMutationPayload(queryClient, payload);
      options?.onBackupDeleted?.();
    },
  });

  return {
    importMutation,
    removeMutation,
    restoreMutation,
    deleteBackupMutation,
  };
}
