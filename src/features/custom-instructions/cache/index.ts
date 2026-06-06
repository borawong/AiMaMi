import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";

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
