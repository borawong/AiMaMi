/**
 * 中文职责说明：settings 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/module-cache";

export const SettingsCache = createModuleCacheOwner("settings");
export const SettingsQueryKeys = SettingsCache.queryKeys;
export const SETTINGS_RUNTIME_STATE_DISPLAY_QUERY_KEY = [
  "runtime-state",
  "display",
] as const;
export const SETTINGS_HAS_NOTCH_QUERY_KEY = ["has-notch"] as const;
export const SETTINGS_HOTSPOT_ENABLED_QUERY_KEY = ["hotspot-enabled"] as const;
export const SETTINGS_IMAGE_COMPAT_QUERY_KEY = ["imageCompat"] as const;
export const SETTINGS_USAGE_REFRESH_INTERVAL_QUERY_KEY = [
  "usage-refresh-interval",
] as const;
export const writeSettingsAuthoritativePayload = SettingsCache.writeAuthoritativePayload;

export async function invalidateSettingsContractQueries(queryClient: QueryClient) {
  await Promise.all([
    SettingsCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({
      queryKey: SETTINGS_RUNTIME_STATE_DISPLAY_QUERY_KEY,
    }),
    queryClient.invalidateQueries({
      queryKey: SETTINGS_HOTSPOT_ENABLED_QUERY_KEY,
    }),
    queryClient.invalidateQueries({
      queryKey: SETTINGS_IMAGE_COMPAT_QUERY_KEY,
    }),
    queryClient.invalidateQueries({
      queryKey: SETTINGS_USAGE_REFRESH_INTERVAL_QUERY_KEY,
    }),
  ]);
}
