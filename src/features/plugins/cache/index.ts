import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";
import type { PluginsCacheEnvelope } from "../types";

export const PluginsCache = createModuleCacheOwner("plugins");
export const PluginsQueryKeys = PluginsCache.queryKeys;
export const PLUGINS_LIST_QUERY_KEY = ["plugins-list"] as const;
export const writePluginsAuthoritativePayload = (
  queryClient: QueryClient,
  envelope: Omit<PluginsCacheEnvelope, "moduleId">,
) => PluginsCache.writeAuthoritativePayload(queryClient, envelope);

export async function invalidatePluginsContractQueries(queryClient: QueryClient) {
  await Promise.all([
    PluginsCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: PLUGINS_LIST_QUERY_KEY }),
  ]);
}
