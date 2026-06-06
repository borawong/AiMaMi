import { useState } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/controller";
import { skillsService } from "@/services/skills";
import type {
  CoreEnvelope,
  InstalledSkillSummary,
  SkillBackupListPayload,
  SkillBackupSummary,
  SkillListPayload,
} from "@/types";
import {
  invalidateSkillsContractQueries,
  SkillsCache,
  SKILLS_BACKUPS_QUERY_KEY,
  SKILLS_INSTALLED_QUERY_KEY,
} from "../cache";

let skillsCacheSequence = 0;
let skillsLatestAcceptedSequence = 0;

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
  if (sequence < skillsLatestAcceptedSequence) {
    return false;
  }

  skillsLatestAcceptedSequence = sequence;
  SkillsCache.writeAuthoritativePayload(queryClient, {
    payload,
    source,
    sequence,
    receivedAt: Date.now(),
  });
  return true;
}

async function writeSkillsMutationPayload<TPayload>(
  queryClient: QueryClient,
  payload: TPayload,
) {
  const accepted = writeSkillsCachePayload(
    queryClient,
    payload,
    "mutation-payload",
    nextSkillsCacheSequence(),
  );
  if (!accepted) return;

  writeSkillsQueryMutationPayload(queryClient, payload);
  await invalidateSkillsContractQueries(queryClient);
}

export function useSkillsCacheController() {
  return useModuleCacheController(SkillsCache);
}

export type SkillsPageTab = "installed" | "backups";

export function useSkillsPageQueries(tab: SkillsPageTab) {
  const queryClient = useQueryClient();

  const skillsQuery = useQuery({
    queryKey: SKILLS_INSTALLED_QUERY_KEY,
    queryFn: async () => {
      const sequence = nextSkillsCacheSequence();
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
      const sequence = nextSkillsCacheSequence();
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

export function useSkillsPageMutations(options?: {
  onRemoved?: () => void;
  onBackupDeleted?: () => void;
}) {
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

export function useSkillsPageController() {
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
    tabs: [
      { value: "installed", labelKey: "skills.installed" },
      { value: "backups", labelKey: "skills.backups" },
    ] as const,
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
          titleKey: "skills.loadFailed",
          descriptionKey: "skills.loadFailedDesc",
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

export type SkillsPageController = ReturnType<typeof useSkillsPageController>;

function writeSkillsQueryMutationPayload(queryClient: QueryClient, payload: unknown) {
  const data = readEnvelopeData(payload);
  if (!isRecord(data)) return;

  const importedSkill = data.skill;
  const restoredSkill = data.restoredSkill;
  const removedSkillID = readString(data.removedSkillID);
  const backup = data.backup;
  const rollbackBackup = data.rollbackBackup;
  const deletedBackupID = readString(data.deletedBackupID);

  if (isInstalledSkillSummary(importedSkill)) {
    upsertInstalledSkill(queryClient, importedSkill);
  }
  if (isInstalledSkillSummary(restoredSkill)) {
    upsertInstalledSkill(queryClient, restoredSkill);
  }
  if (removedSkillID) {
    removeInstalledSkill(queryClient, removedSkillID, readNumber(data.remainingInstalledCount));
  }

  if (isSkillBackupSummary(backup)) {
    if (isInstalledSkillSummary(restoredSkill)) {
      removeSkillBackup(queryClient, backup.id, null);
    } else {
      upsertSkillBackup(queryClient, backup);
    }
  }
  if (isSkillBackupSummary(rollbackBackup)) {
    upsertSkillBackup(queryClient, rollbackBackup);
  }
  if (deletedBackupID) {
    removeSkillBackup(queryClient, deletedBackupID, readNumber(data.remainingBackupCount));
  }
}

function upsertInstalledSkill(
  queryClient: QueryClient,
  skill: InstalledSkillSummary,
) {
  queryClient.setQueryData<CoreEnvelope<SkillListPayload>>(
    SKILLS_INSTALLED_QUERY_KEY,
    (current) => {
      if (!isSkillListEnvelope(current)) return current;
      const items = upsertById(current.data.items, skill);
      return {
        ...current,
        data: {
          ...current.data,
          items,
          total: items.length,
        },
      };
    },
  );
}

function removeInstalledSkill(
  queryClient: QueryClient,
  id: string,
  total: number | null,
) {
  queryClient.setQueryData<CoreEnvelope<SkillListPayload>>(
    SKILLS_INSTALLED_QUERY_KEY,
    (current) => {
      if (!isSkillListEnvelope(current)) return current;
      const items = current.data.items.filter((item) => item.id !== id);
      return {
        ...current,
        data: {
          ...current.data,
          items,
          total: total ?? items.length,
        },
      };
    },
  );
}

function upsertSkillBackup(queryClient: QueryClient, backup: SkillBackupSummary) {
  queryClient.setQueryData<CoreEnvelope<SkillBackupListPayload>>(
    SKILLS_BACKUPS_QUERY_KEY,
    (current) => {
      if (!isSkillBackupListEnvelope(current)) return current;
      const items = upsertById(current.data.items, backup);
      return {
        ...current,
        data: {
          ...current.data,
          items,
          total: items.length,
        },
      };
    },
  );
}

function removeSkillBackup(
  queryClient: QueryClient,
  id: string,
  total: number | null,
) {
  queryClient.setQueryData<CoreEnvelope<SkillBackupListPayload>>(
    SKILLS_BACKUPS_QUERY_KEY,
    (current) => {
      if (!isSkillBackupListEnvelope(current)) return current;
      const items = current.data.items.filter((item) => item.id !== id);
      return {
        ...current,
        data: {
          ...current.data,
          items,
          total: total ?? items.length,
        },
      };
    },
  );
}

function upsertById<TItem extends { id: string }>(items: TItem[], item: TItem) {
  const index = items.findIndex((current) => current.id === item.id);
  if (index === -1) return [...items, item];
  return items.map((current, currentIndex) =>
    currentIndex === index ? item : current,
  );
}

function readEnvelopeData(value: unknown) {
  if (isRecord(value) && "data" in value) {
    return value.data ?? null;
  }
  return null;
}

function isSkillListEnvelope(value: unknown): value is CoreEnvelope<SkillListPayload> {
  return isRecord(value) && isRecord(value.data) && Array.isArray(value.data.items);
}

function isSkillBackupListEnvelope(
  value: unknown,
): value is CoreEnvelope<SkillBackupListPayload> {
  return isRecord(value) && isRecord(value.data) && Array.isArray(value.data.items);
}

function isInstalledSkillSummary(value: unknown): value is InstalledSkillSummary {
  return isRecord(value) && typeof value.id === "string";
}

function isSkillBackupSummary(value: unknown): value is SkillBackupSummary {
  return isRecord(value) && typeof value.id === "string";
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
