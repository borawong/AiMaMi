/**
 * 中文职责说明：settings 模块 hook 拥有 full refresh、active-only refresh、abort 和 replay 防护入口。
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { settingsService } from "@/services/settings";
import type { ApiProxyDetectPayload, ApiProxyMode, ApiProxyTestPayload } from "@/types";
import { SettingsCache } from "../cache";

export const RUNTIME_STATE_DISPLAY_QUERY_KEY = ["runtime-state", "display"] as const;

type SnapshotEnvelope = Awaited<ReturnType<typeof settingsService.loadSnapshot>>;

export function useSettingsCacheController() {
  return useModuleCacheController(SettingsCache);
}

export function useSettingsRuntimeState(supportsHotspot: boolean) {
  const statusQuery = useQuery({
    queryKey: RUNTIME_STATE_DISPLAY_QUERY_KEY,
    queryFn: () => settingsService.loadSnapshot(false),
    staleTime: Infinity,
    refetchOnMount: false,
  });

  const status = statusQuery.data?.data.status;
  const currentProxy = status?.api.proxy ?? { mode: "direct" as ApiProxyMode, url: null };

  const notchQuery = useQuery({
    queryKey: ["has-notch"],
    queryFn: () => settingsService.hasNotch(),
    staleTime: Infinity,
    enabled: supportsHotspot,
  });

  const hasNotch = notchQuery.data ?? false;

  const hotspotQuery = useQuery({
    queryKey: ["hotspot-enabled"],
    queryFn: () => settingsService.getHotspotEnabled(),
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
        return {
          ...old,
          data: {
            ...old.data,
            status: {
              ...old.data.status,
              autoSwitch: { ...old.data.status.autoSwitch, enabled: false },
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
        return {
          ...old,
          data: {
            ...old.data,
            status: {
              ...old.data.status,
              autoSwitch: {
                ...old.data.status.autoSwitch,
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
    onSuccess: (_data, enabled) => {
      queryClient.invalidateQueries({ queryKey: ["hotspot-enabled"] });
      options?.onChanged?.(enabled);
    },
  });
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
