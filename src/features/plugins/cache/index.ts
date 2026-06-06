/**
 * 中文职责说明：plugins 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/module-cache";

export const PluginsCache = createModuleCacheOwner("plugins");
export const PluginsQueryKeys = PluginsCache.queryKeys;
export const PLUGINS_LIST_QUERY_KEY = ["plugins-list"] as const;
export const PLUGINS_CONFIG_QUERY_ROOT = ["plugin-config"] as const;
export const pluginConfigQueryKey = (id: string) =>
  [...PLUGINS_CONFIG_QUERY_ROOT, id] as const;
export const writePluginsAuthoritativePayload = PluginsCache.writeAuthoritativePayload;

export async function invalidatePluginsContractQueries(queryClient: QueryClient) {
  await Promise.all([
    PluginsCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: PLUGINS_LIST_QUERY_KEY }),
    queryClient.invalidateQueries({ queryKey: PLUGINS_CONFIG_QUERY_ROOT }),
  ]);
}
