import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/controller";
import type { RefreshInterval } from "@/hooks/refresh";
import { settingsService } from "@/services/settings";
import type { ApiProxyMode } from "@/types";
import {
  runSettingsQuery,
  SettingsCache,
  SETTINGS_HAS_NOTCH_QUERY_KEY,
  SETTINGS_HOTSPOT_ENABLED_QUERY_KEY,
  SETTINGS_IMAGE_COMPAT_QUERY_KEY,
  SETTINGS_RUNTIME_STATE_DISPLAY_QUERY_KEY,
  SETTINGS_USAGE_REFRESH_INTERVAL_QUERY_KEY,
} from "../cache";
import { normalizeSettingsRefreshInterval } from "../utils";

export const RUNTIME_STATE_DISPLAY_QUERY_KEY = SETTINGS_RUNTIME_STATE_DISPLAY_QUERY_KEY;

export function useSettingsCacheController() {
  return useModuleCacheController(SettingsCache);
}

export function useSettingsRuntimeState(supportsHotspot: boolean) {
  const queryClient = useQueryClient();
  const statusQuery = useQuery({
    queryKey: RUNTIME_STATE_DISPLAY_QUERY_KEY,
    queryFn: () => settingsService.loadSnapshot(false),
    staleTime: Infinity,
    refetchOnMount: false,
  });

  const status = statusQuery.data?.data.status;
  const currentProxy = status?.api?.proxy ?? { mode: "direct" as ApiProxyMode, url: null };

  const notchQuery = useQuery({
    queryKey: SETTINGS_HAS_NOTCH_QUERY_KEY,
    queryFn: () =>
      runSettingsQuery(queryClient, SETTINGS_HAS_NOTCH_QUERY_KEY, () =>
        settingsService.hasNotch(),
      ),
    staleTime: Infinity,
    enabled: supportsHotspot,
  });

  const hasNotch = notchQuery.data ?? false;

  const hotspotQuery = useQuery({
    queryKey: SETTINGS_HOTSPOT_ENABLED_QUERY_KEY,
    queryFn: () =>
      runSettingsQuery(queryClient, SETTINGS_HOTSPOT_ENABLED_QUERY_KEY, () =>
        settingsService.getHotspotEnabled(),
      ),
    enabled: supportsHotspot && hasNotch,
  });

  return {
    statusQuery,
    status,
    currentProxy,
    notchQuery,
    hasNotch,
    hotspotQuery,
  };
}

export function useSettingsImageCompatQuery() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: SETTINGS_IMAGE_COMPAT_QUERY_KEY,
    queryFn: () =>
      runSettingsQuery(queryClient, SETTINGS_IMAGE_COMPAT_QUERY_KEY, () =>
        settingsService.getImageCompat(),
      ),
    staleTime: Infinity,
  });
}

export function useSettingsRefreshIntervalQuery() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: SETTINGS_USAGE_REFRESH_INTERVAL_QUERY_KEY,
    queryFn: () =>
      runSettingsQuery(queryClient, SETTINGS_USAGE_REFRESH_INTERVAL_QUERY_KEY, () =>
        loadSettingsRefreshInterval(),
      ),
    staleTime: Infinity,
  });
}

async function loadSettingsRefreshInterval(): Promise<RefreshInterval> {
  return normalizeSettingsRefreshInterval(
    await settingsService.getUsageRefreshInterval(),
  );
}

export function useSettingsAppVersion() {
  const [appVersion, setAppVersion] = useState("...");

  useEffect(() => {
    settingsService.getAppVersion()
      .then(setAppVersion)
      .catch(() => setAppVersion("unknown"));
  }, []);

  return appVersion;
}
