/**
 * 中文职责说明：skills 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";

export const SkillsCache = createModuleCacheOwner("skills");
export const SkillsQueryKeys = SkillsCache.queryKeys;
export const SKILLS_INSTALLED_QUERY_KEY = ["installed-skills"] as const;
export const SKILLS_BACKUPS_QUERY_KEY = ["skill-backups"] as const;
export const writeSkillsAuthoritativePayload = SkillsCache.writeAuthoritativePayload;

export async function invalidateSkillsContractQueries(queryClient: QueryClient) {
  await Promise.all([
    SkillsCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: SKILLS_INSTALLED_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: SKILLS_BACKUPS_QUERY_KEY }),
  ]);
}
