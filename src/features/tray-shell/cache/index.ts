import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";
import type { TrayShellCacheEnvelope, TrayShellCachePayload } from "../types";

export const TrayShellCache =
  createModuleCacheOwner<TrayShellCachePayload>("tray-shell");
export const TrayShellQueryKeys = TrayShellCache.queryKeys;
export const TRAY_SHELL_NOTIFICATION_CLIENT_QUERY_KEY = [
  ...TrayShellQueryKeys.root,
  "notification-client",
] as const;
export const writeTrayShellAuthoritativePayload = <
  TPayload extends TrayShellCachePayload,
>(
  queryClient: QueryClient,
  envelope: Omit<TrayShellCacheEnvelope<TPayload>, "moduleId">,
) => TrayShellCache.writeAuthoritativePayload(queryClient, envelope);
export const invalidateTrayShellContractQueries = TrayShellCache.invalidateContractQueries;
