import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";
import type { TrayShellCacheEnvelope, TrayShellCachePayload } from "../types";

export const TrayShellCache =
  createModuleCacheOwner<TrayShellCachePayload>("tray-shell");
export const TrayShellQueryKeys = TrayShellCache.queryKeys;
export const writeTrayShellAuthoritativePayload = <
  TPayload extends TrayShellCachePayload,
>(
  queryClient: QueryClient,
  envelope: Omit<TrayShellCacheEnvelope<TPayload>, "moduleId">,
) => TrayShellCache.writeAuthoritativePayload(queryClient, envelope);
export const invalidateTrayShellContractQueries = TrayShellCache.invalidateContractQueries;
