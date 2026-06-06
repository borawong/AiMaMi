/**
 * 中文职责说明：settings 模块 hook 拥有 full refresh、active-only refresh、abort 和 replay 防护入口。
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { settingsService } from "@/services/settings";
import type { ApiProxyDetectPayload, ApiProxyMode, ApiProxyTestPayload } from "@/types";
import {
  beginSettingsMutation,
  runSettingsQuery,
  SettingsCache,
  SETTINGS_HAS_NOTCH_QUERY_KEY,
  SETTINGS_HOTSPOT_ENABLED_QUERY_KEY,
  SETTINGS_IMAGE_COMPAT_QUERY_KEY,
  SETTINGS_RUNTIME_STATE_DISPLAY_QUERY_KEY,
  SETTINGS_USAGE_REFRESH_INTERVAL_QUERY_KEY,
  writeSettingsMutationPayload,
} from "../cache";

export const RUNTIME_STATE_DISPLAY_QUERY_KEY = SETTINGS_RUNTIME_STATE_DISPLAY_QUERY_KEY;

type SnapshotEnvelope = Awaited<ReturnType<typeof settingsService.loadSnapshot>>;

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

export function useSettingsAutoSwitchMutations(options?: {
  onDisabled?: () => void;
  onThresholdsSaved?: (params: { enable: boolean; t5h: number; tWeekly: number }) => void;
}) {
  const queryClient = useQueryClient();

  const disableAutoSwitchMutation = useMutation({
    mutationFn: () => settingsService.setAutoSwitch(false),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: RUNTIME_STATE_DISPLAY_QUERY_KEY });
      const previous = queryClient.getQueryData<SnapshotEnvelope>(RUNTIME_STATE_DISPLAY_QUERY_KEY);
      queryClient.setQueryData<SnapshotEnvelope>(RUNTIME_STATE_DISPLAY_QUERY_KEY, (old) => {
        if (!old) return old;
        const { autoSwitch } = old.data.status;
        return {
          ...old,
          data: {
            ...old.data,
            status: {
              ...old.data.status,
              autoSwitch: { ...(autoSwitch ?? {}), enabled: false },
            },
          },
        };
      });
      return { previous };
    },
    onError: (_err, _v, context) => {
      if (context?.previous) {
        queryClient.setQueryData(RUNTIME_STATE_DISPLAY_QUERY_KEY, context.previous);
      }
    },
    onSuccess: () => {
      options?.onDisabled?.();
    },
  });

  const saveThresholdsMutation = useMutation({
    mutationFn: async (params: { enable: boolean; t5h: number; tWeekly: number }) => {
      if (params.enable) await settingsService.setAutoSwitch(true);
      return settingsService.configureAutoSwitch(params.t5h, params.tWeekly);
    },
    onSuccess: (_data, params) => {
      queryClient.setQueryData<SnapshotEnvelope>(RUNTIME_STATE_DISPLAY_QUERY_KEY, (old) => {
        if (!old) return old;
        const { autoSwitch } = old.data.status;
        return {
          ...old,
          data: {
            ...old.data,
            status: {
              ...old.data.status,
              autoSwitch: {
                ...(autoSwitch ?? {}),
                enabled: true,
                threshold5hPercent: params.t5h,
                thresholdWeeklyPercent: params.tWeekly,
              },
            },
          },
        };
      });
      options?.onThresholdsSaved?.(params);
    },
  });

  return {
    disableAutoSwitchMutation,
    saveThresholdsMutation,
  };
}

export function useSettingsHotspotMutation(options?: { onChanged?: (enabled: boolean) => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enabled: boolean) => settingsService.setHotspotEnabled(enabled),
    onMutate: async () => {
      const sequence = beginSettingsMutation(SETTINGS_HOTSPOT_ENABLED_QUERY_KEY);
      await queryClient.cancelQueries({
        queryKey: SETTINGS_HOTSPOT_ENABLED_QUERY_KEY,
      });
      return { sequence };
    },
    onSuccess: async (result, enabled, context) => {
      await writeSettingsMutationPayload(
        queryClient,
        SETTINGS_HOTSPOT_ENABLED_QUERY_KEY,
        result,
        context?.sequence,
      );
      options?.onChanged?.(enabled);
    },
  });
}

export function useSettingsHotspotReadyMutation() {
  return useMutation({
    mutationFn: () => settingsService.hotspotReady(),
  });
}

export function useSettingsImageCompat() {
  const queryClient = useQueryClient();

  const imageCompatQuery = useQuery({
    queryKey: SETTINGS_IMAGE_COMPAT_QUERY_KEY,
    queryFn: () =>
      runSettingsQuery(queryClient, SETTINGS_IMAGE_COMPAT_QUERY_KEY, () =>
        settingsService.getImageCompat(),
      ),
    staleTime: Infinity,
  });

  const setImageCompatMutation = useMutation({
    mutationFn: (enabled: boolean) => settingsService.setImageCompat(enabled),
    onMutate: async () => {
      const sequence = beginSettingsMutation(SETTINGS_IMAGE_COMPAT_QUERY_KEY);
      await queryClient.cancelQueries({
        queryKey: SETTINGS_IMAGE_COMPAT_QUERY_KEY,
      });
      return { sequence };
    },
    onSuccess: async (enabled, _variables, context) => {
      await writeSettingsMutationPayload(
        queryClient,
        SETTINGS_IMAGE_COMPAT_QUERY_KEY,
        enabled,
        context?.sequence,
      );
    },
  });

  return {
    imageCompatQuery,
    setImageCompatMutation,
  };
}

export function useSettingsUpdateInstallabilityMutation() {
  return useMutation({
    mutationFn: () => settingsService.checkUpdateInstallability(),
  });
}

export function useSettingsRefreshInterval() {
  const queryClient = useQueryClient();

  const refreshIntervalQuery = useQuery({
    queryKey: SETTINGS_USAGE_REFRESH_INTERVAL_QUERY_KEY,
    queryFn: () =>
      runSettingsQuery(queryClient, SETTINGS_USAGE_REFRESH_INTERVAL_QUERY_KEY, () =>
        settingsService.getUsageRefreshInterval(),
      ),
    staleTime: Infinity,
  });

  const saveRefreshIntervalMutation = useMutation({
    mutationFn: (interval: string) => settingsService.setUsageRefreshInterval(interval),
    onMutate: async () => {
      const sequence = beginSettingsMutation(SETTINGS_USAGE_REFRESH_INTERVAL_QUERY_KEY);
      await queryClient.cancelQueries({
        queryKey: SETTINGS_USAGE_REFRESH_INTERVAL_QUERY_KEY,
      });
      return { sequence };
    },
    onSuccess: async (interval, _variables, context) => {
      await writeSettingsMutationPayload(
        queryClient,
        SETTINGS_USAGE_REFRESH_INTERVAL_QUERY_KEY,
        interval,
        context?.sequence,
      );
    },
  });

  return {
    refreshIntervalQuery,
    saveRefreshIntervalMutation,
  };
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

export function useApiProxyMutations(options?: {
  onSaved?: (result: Awaited<ReturnType<typeof settingsService.setApiProxyConfig>>) => Promise<unknown> | void;
  onSaveError?: (error: unknown) => void;
  onTested?: (result: ApiProxyTestPayload) => void;
  onTestError?: (error: unknown) => void;
  onDetected?: (result: ApiProxyDetectPayload) => void;
  onDetectError?: () => void;
}) {
  const queryClient = useQueryClient();

  const saveProxyMutation = useMutation({
    mutationFn: ({ mode, url }: { mode: ApiProxyMode; url: string }) =>
      settingsService.setApiProxyConfig(mode, normalizeProxyUrl(mode, url)),
    onSuccess: async (result) => {
      queryClient.setQueryData<SnapshotEnvelope>(RUNTIME_STATE_DISPLAY_QUERY_KEY, (old) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            status: {
              ...old.data.status,
              api: result.data.api,
            },
          },
        };
      });
      await options?.onSaved?.(result);
    },
    onError: options?.onSaveError,
  });

  const testProxyMutation = useMutation({
    mutationFn: ({ mode, url }: { mode: ApiProxyMode; url: string }) =>
      settingsService.testApiProxyConfig(mode, normalizeProxyUrl(mode, url)),
    onSuccess: (result) => options?.onTested?.(result.data),
    onError: options?.onTestError,
  });

  const detectProxyMutation = useMutation({
    mutationFn: () => settingsService.detectApiProxyConfig(),
    onSuccess: (result) => options?.onDetected?.(result.data),
    onError: () => options?.onDetectError?.(),
  });

  return {
    saveProxyMutation,
    testProxyMutation,
    detectProxyMutation,
  };
}

function normalizeProxyUrl(mode: ApiProxyMode, url: string) {
  return mode === "manual" ? url.trim() : undefined;
}
