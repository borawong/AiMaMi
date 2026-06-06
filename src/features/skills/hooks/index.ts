/**
 * 中文职责说明：skills 模块 hook 拥有 full refresh、active-only refresh、abort 和 replay 防护入口。
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { api } from "@/lib/api";
import { SkillsCache } from "../cache";

const skillsInstalledQueryKey = ["skills", "installed"] as const;
const skillsBackupsQueryKey = ["skills", "backups"] as const;
let skillsCacheSequence = 0;

function nextSkillsCacheSequence() {
  skillsCacheSequence += 1;
  return skillsCacheSequence;
}

function writeSkillsCachePayload<TPayload>(
  queryClient: QueryClient,
  payload: TPayload,
  source: "full-refresh" | "mutation-payload",
  sequence: number,
) {
  SkillsCache.writeAuthoritativePayload(queryClient, {
    payload,
    source,
    sequence,
    receivedAt: Date.now(),
  });
}

async function writeSkillsMutationPayload<TPayload>(
  queryClient: QueryClient,
  payload: TPayload,
) {
  writeSkillsCachePayload(
    queryClient,
    payload,
    "mutation-payload",
    nextSkillsCacheSequence(),
  );
  await SkillsCache.invalidateContractQueries(queryClient);
}

export function useSkillsCacheController() {
  return useModuleCacheController(SkillsCache);
}

export type SkillsPageTab = "installed" | "backups";

export function useSkillsPageQueries(tab: SkillsPageTab) {
  const queryClient = useQueryClient();

  const skillsQuery = useQuery({
    queryKey: skillsInstalledQueryKey,
    queryFn: async () => {
      const sequence = nextSkillsCacheSequence();
      const payload = await api.loadInstalledSkills();
      writeSkillsCachePayload(queryClient, payload, "full-refresh", sequence);
      return payload;
    },
    staleTime: Infinity,
  });

  const backupsQuery = useQuery({
    queryKey: skillsBackupsQueryKey,
    queryFn: async () => {
      const sequence = nextSkillsCacheSequence();
      const payload = await api.loadSkillBackups();
      writeSkillsCachePayload(queryClient, payload, "full-refresh", sequence);
      return payload;
    },
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
      const path = await api.pickSkillDirectory();
      if (path) return api.importSkill(path);
      throw new Error("cancelled");
    },
    onSuccess: (payload) => writeSkillsMutationPayload(queryClient, payload),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => api.removeSkill(id),
    onSuccess: async (payload) => {
      await writeSkillsMutationPayload(queryClient, payload);
      options?.onRemoved?.();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => api.restoreSkillBackup(id),
    onSuccess: (payload) => writeSkillsMutationPayload(queryClient, payload),
  });

  const deleteBackupMutation = useMutation({
    mutationFn: (id: string) => api.deleteSkillBackup(id),
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
