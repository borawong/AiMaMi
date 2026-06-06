import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";

export const PluginsCache = createModuleCacheOwner("plugins");
export const PluginsQueryKeys = PluginsCache.queryKeys;
export const PLUGINS_LIST_QUERY_KEY = ["plugins-list"] as const;
export const writePluginsAuthoritativePayload = PluginsCache.writeAuthoritativePayload;

export async function invalidatePluginsContractQueries(queryClient: QueryClient) {
  await Promise.all([
    PluginsCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: PLUGINS_LIST_QUERY_KEY }),
  ]);
}
