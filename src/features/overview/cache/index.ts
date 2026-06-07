import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";
import type { OverviewCacheEnvelope, OverviewCachePayload } from "../types";

export const OverviewCache =
  createModuleCacheOwner<OverviewCachePayload>("overview");
export const OverviewQueryKeys = OverviewCache.queryKeys;
export const writeOverviewAuthoritativePayload = <
  TPayload extends OverviewCachePayload,
>(
  queryClient: QueryClient,
  envelope: Omit<OverviewCacheEnvelope<TPayload>, "moduleId">,
) => OverviewCache.writeAuthoritativePayload(queryClient, envelope);
export const invalidateOverviewContractQueries = OverviewCache.invalidateContractQueries;
