import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";
import type {
  CoreEnvelope,
  InstalledSkillSummary,
  SkillBackupListPayload,
  SkillBackupSummary,
  SkillListPayload,
} from "@/types";
import type {
  SkillsCacheEnvelope,
  SkillsCachePayload,
  SkillsMutationEnvelope,
  SkillsMutationPayload,
} from "../types";

export const SkillsCache = createModuleCacheOwner<SkillsCachePayload>("skills");
export const SkillsQueryKeys = SkillsCache.queryKeys;
export const SKILLS_INSTALLED_QUERY_KEY = ["installed-skills"] as const;
export const SKILLS_BACKUPS_QUERY_KEY = ["skill-backups"] as const;

let skillsCacheSequence = 0;
let skillsLatestAcceptedSequence = 0;

function nextSkillsCacheSequence() {
  skillsCacheSequence += 1;
  return skillsCacheSequence;
}

export const writeSkillsAuthoritativePayload = (
  queryClient: QueryClient,
  envelope: Omit<SkillsCacheEnvelope, "moduleId">,
) => SkillsCache.writeAuthoritativePayload(queryClient, envelope);

export function writeSkillsCachePayload<TPayload extends SkillsCachePayload>(
  queryClient: QueryClient,
  payload: TPayload,
  source: "full-refresh" | "mutation-payload",
  sequence = nextSkillsCacheSequence(),
) {
  if (sequence < skillsLatestAcceptedSequence) {
    return false;
  }

  skillsLatestAcceptedSequence = sequence;
  writeSkillsAuthoritativePayload(queryClient, {
    payload,
    source,
    sequence,
    receivedAt: Date.now(),
  });
  return true;
}

export function nextSkillsQuerySequence() {
  return nextSkillsCacheSequence();
}

export async function writeSkillsMutationPayload(
  queryClient: QueryClient,
  payload: SkillsMutationEnvelope,
) {
  const accepted = writeSkillsCachePayload(
    queryClient,
    payload,
    "mutation-payload",
  );
  if (!accepted) return;

  writeSkillsQueryMutationPayload(queryClient, payload);
  await invalidateSkillsContractQueries(queryClient);
}

export async function invalidateSkillsContractQueries(queryClient: QueryClient) {
  await Promise.all([
    SkillsCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: SKILLS_INSTALLED_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: SKILLS_BACKUPS_QUERY_KEY }),
  ]);
}

function writeSkillsQueryMutationPayload(
  queryClient: QueryClient,
  payload: SkillsMutationEnvelope,
) {
  const data: SkillsMutationPayload = payload.data;
  const importedSkill = "skill" in data ? data.skill : null;
  const restoredSkill = "restoredSkill" in data ? data.restoredSkill : null;
  const removedSkillID = "removedSkillID" in data ? data.removedSkillID : null;
  const backup = "backup" in data ? data.backup : null;
  const rollbackBackup =
    "rollbackBackup" in data ? data.rollbackBackup : null;
  const deletedBackupID =
    "deletedBackupID" in data ? data.deletedBackupID : null;

  if (isInstalledSkillSummary(importedSkill)) {
    upsertInstalledSkill(queryClient, importedSkill);
  }
  if (isInstalledSkillSummary(restoredSkill)) {
    upsertInstalledSkill(queryClient, restoredSkill);
  }
  if (removedSkillID) {
    removeInstalledSkill(
      queryClient,
      removedSkillID,
      "remainingInstalledCount" in data ? data.remainingInstalledCount : null,
    );
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
    removeSkillBackup(
      queryClient,
      deletedBackupID,
      "remainingBackupCount" in data ? data.remainingBackupCount : null,
    );
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
