/**
 * 中文职责说明：skills 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import { createModuleCacheOwner } from "@/features/_shared/module-cache";

export const SkillsCache = createModuleCacheOwner("skills");
export const SkillsQueryKeys = SkillsCache.queryKeys;
export const writeSkillsAuthoritativePayload = SkillsCache.writeAuthoritativePayload;
export const invalidateSkillsContractQueries = SkillsCache.invalidateContractQueries;
