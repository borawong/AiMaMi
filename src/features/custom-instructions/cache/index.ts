/**
 * 中文职责说明：custom-instructions 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import { createModuleCacheOwner } from "@/features/_shared/module-cache";

export const CustomInstructionsCache = createModuleCacheOwner("custom-instructions");
export const CustomInstructionsQueryKeys = CustomInstructionsCache.queryKeys;
export const writeCustomInstructionsAuthoritativePayload = CustomInstructionsCache.writeAuthoritativePayload;
export const invalidateCustomInstructionsContractQueries = CustomInstructionsCache.invalidateContractQueries;
