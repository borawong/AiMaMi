import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";
import type { SkillsCacheEnvelope, SkillsCachePayload } from "../types";

export const SkillsCache = createModuleCacheOwner<SkillsCachePayload>("skills");
export const SkillsQueryKeys = SkillsCache.queryKeys;
export const SKILLS_INSTALLED_QUERY_KEY = ["installed-skills"] as const;
export const SKILLS_BACKUPS_QUERY_KEY = ["skill-backups"] as const;
export const writeSkillsAuthoritativePayload = (
  queryClient: QueryClient,
  envelope: Omit<SkillsCacheEnvelope, "moduleId">,
) => SkillsCache.writeAuthoritativePayload(queryClient, envelope);

export async function invalidateSkillsContractQueries(queryClient: QueryClient) {
  await Promise.all([
    SkillsCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: SKILLS_INSTALLED_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: SKILLS_BACKUPS_QUERY_KEY }),
  ]);
}
