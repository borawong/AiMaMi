import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";
import type {
  OverviewCacheEnvelope,
  OverviewCachePayload,
  OverviewMysteryGrantsEnvelope,
} from "../types";

export const OverviewCache =
  createModuleCacheOwner<OverviewCachePayload>("overview");
export const OverviewQueryKeys = OverviewCache.queryKeys;
export const OVERVIEW_MYSTERY_GRANTS_QUERY_KEY = [
  ...OverviewCache.queryKeys.root,
  "mystery-unlock-grants",
] as const;
export const writeOverviewAuthoritativePayload = <
  TPayload extends OverviewCachePayload,
>(
  queryClient: QueryClient,
  envelope: Omit<OverviewCacheEnvelope<TPayload>, "moduleId">,
) => OverviewCache.writeAuthoritativePayload(queryClient, envelope);
export function writeOverviewMysteryGrantsPayload(
  queryClient: QueryClient,
  payload: OverviewMysteryGrantsEnvelope,
) {
  queryClient.setQueryData(OVERVIEW_MYSTERY_GRANTS_QUERY_KEY, payload);
  writeOverviewAuthoritativePayload(queryClient, {
    payload,
    source: "mutation-payload",
    sequence: Date.now(),
    receivedAt: Date.now(),
  });
}
export const invalidateOverviewContractQueries = OverviewCache.invalidateContractQueries;
