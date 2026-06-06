/**
 * 中文职责说明：daemon-autoswitch 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/module-cache";

export const DaemonAutoswitchCache = createModuleCacheOwner("daemon-autoswitch");
export const DaemonAutoswitchQueryKeys = DaemonAutoswitchCache.queryKeys;
export const DAEMON_AUTOSWITCH_BOOTSTRAP_QUERY_KEY = [
  ...DaemonAutoswitchCache.queryKeys.root,
  "bootstrap",
] as const;
export const DAEMON_AUTOSWITCH_PENDING_QUERY_KEY = [
  ...DaemonAutoswitchCache.queryKeys.root,
  "pending",
] as const;
export const writeDaemonAutoswitchAuthoritativePayload = DaemonAutoswitchCache.writeAuthoritativePayload;

export async function invalidateDaemonAutoswitchContractQueries(
  queryClient: QueryClient,
) {
  await Promise.all([
    DaemonAutoswitchCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({
      queryKey: DAEMON_AUTOSWITCH_BOOTSTRAP_QUERY_KEY,
    }),
    queryClient.invalidateQueries({
      queryKey: DAEMON_AUTOSWITCH_PENDING_QUERY_KEY,
    }),
  ]);
}
