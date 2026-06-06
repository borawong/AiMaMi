/**
 * 中文职责说明：custom-instructions 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/module-cache";

export const CustomInstructionsCache = createModuleCacheOwner("custom-instructions");
export const CustomInstructionsQueryKeys = CustomInstructionsCache.queryKeys;
export const CUSTOM_INSTRUCTION_STATE_QUERY_KEY = ["custom-instructions", "current"] as const;
export const CUSTOM_INSTRUCTION_TEMPLATES_QUERY_KEY = ["custom-instructions", "templates"] as const;
export const writeCustomInstructionsAuthoritativePayload = CustomInstructionsCache.writeAuthoritativePayload;

export async function invalidateCustomInstructionsContractQueries(
  queryClient: QueryClient,
) {
  await Promise.all([
    CustomInstructionsCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: CUSTOM_INSTRUCTION_STATE_QUERY_KEY }),
  ]);
}
