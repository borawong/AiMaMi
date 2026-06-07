import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/controller";
import { skillsService } from "@/services/skills";
import {
  nextSkillsQuerySequence,
  SkillsCache,
  SKILLS_BACKUPS_QUERY_KEY,
  SKILLS_INSTALLED_QUERY_KEY,
  writeSkillsCachePayload,
} from "../cache";
import type { SkillsPageTab } from "../types";

export function useSkillsCacheController() {
  return useModuleCacheController(SkillsCache);
}

export function useSkillsPageQueries(tab: SkillsPageTab) {
  const queryClient = useQueryClient();

  const skillsQuery = useQuery({
    queryKey: SKILLS_INSTALLED_QUERY_KEY,
    queryFn: async () => {
      const sequence = nextSkillsQuerySequence();
      const payload = await skillsService.loadInstalled();
      const accepted = writeSkillsCachePayload(
        queryClient,
        payload,
        "full-refresh",
        sequence,
      );
      if (!accepted) {
        return (
          queryClient.getQueryData<typeof payload>(SKILLS_INSTALLED_QUERY_KEY) ??
          payload
        );
      }
      return payload;
    },
    staleTime: Infinity,
  });

  const backupsQuery = useQuery({
    queryKey: SKILLS_BACKUPS_QUERY_KEY,
    queryFn: async () => {
      const sequence = nextSkillsQuerySequence();
      const payload = await skillsService.loadBackups();
      const accepted = writeSkillsCachePayload(
        queryClient,
        payload,
        "full-refresh",
        sequence,
      );
      if (!accepted) {
        return (
          queryClient.getQueryData<typeof payload>(SKILLS_BACKUPS_QUERY_KEY) ??
          payload
        );
      }
      return payload;
    },
    enabled: tab === "backups",
  });

  return {
    skillsQuery,
    backupsQuery,
  };
}
