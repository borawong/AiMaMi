import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RefreshInterval } from "@/hooks/refresh";
import { settingsService } from "@/services/settings";
import type { ApiProxyDetectPayload, ApiProxyMode, ApiProxyTestPayload } from "@/types";
import {
  beginSettingsMutation,
  beginSettingsRuntimeSnapshotMutation,
  restoreSettingsRuntimeSnapshot,
  SETTINGS_HOTSPOT_ENABLED_QUERY_KEY,
  SETTINGS_IMAGE_COMPAT_QUERY_KEY,
  SETTINGS_USAGE_REFRESH_INTERVAL_QUERY_KEY,
  writeSettingsApiProxyMutationPayload,
  writeSettingsAutoSwitchMutationPayload,
  writeSettingsAutoSwitchOptimisticPayload,
  writeSettingsMutationPayload,
} from "../cache";
import {
  normalizeSettingsProxyUrl,
  normalizeSettingsRefreshInterval,
} from "../utils";

export function useSettingsAutoSwitchMutations(options?: {
  onDisabled?: () => void;
  onThresholdsSaved?: (params: { enable: boolean; t5h: number; tWeekly: number }) => void;
}) {
  const queryClient = useQueryClient();

  const disableAutoSwitchMutation = useMutation({
    mutationFn: () => settingsService.setAutoSwitch(false),
    onMutate: async () => {
      const previous = await beginSettingsRuntimeSnapshotMutation(queryClient);
      writeSettingsAutoSwitchOptimisticPayload(queryClient, false);
      return { previous };
    },
    onError: (_err, _v, context) => {
      restoreSettingsRuntimeSnapshot(queryClient, context?.previous);
    },
    onSuccess: (result) => {
      writeSettingsAutoSwitchMutationPayload(queryClient, result.data);
      options?.onDisabled?.();
    },
  });

  const saveThresholdsMutation = useMutation({
    mutationFn: async (params: { enable: boolean; t5h: number; tWeekly: number }) => {
      if (params.enable) await settingsService.setAutoSwitch(true);
      return settingsService.configureAutoSwitch(params.t5h, params.tWeekly);
    },
    onSuccess: (result, params) => {
      writeSettingsAutoSwitchMutationPayload(queryClient, result.data);
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

export function useSettingsImageCompatMutation() {
  const queryClient = useQueryClient();

  return useMutation({
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
}

export function useSettingsUpdateInstallabilityMutation() {
  return useMutation({
    mutationFn: () => settingsService.checkUpdateInstallability(),
  });
}

export function useSettingsRefreshIntervalMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (interval: RefreshInterval) =>
      settingsService
        .setUsageRefreshInterval(interval)
        .then(normalizeSettingsRefreshInterval),
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
}

export function useApiProxyMutations(options?: {
  onSaved?: (result: Awaited<ReturnType<typeof settingsService.setApiProxyConfig>>) => Promise<void> | void;
  onSaveError?: (error: unknown) => void;
  onTested?: (result: ApiProxyTestPayload) => void;
  onTestError?: (error: unknown) => void;
  onDetected?: (result: ApiProxyDetectPayload) => void;
  onDetectError?: () => void;
}) {
  const queryClient = useQueryClient();

  const saveProxyMutation = useMutation({
    mutationFn: ({ mode, url }: { mode: ApiProxyMode; url: string }) =>
      settingsService.setApiProxyConfig(mode, normalizeSettingsProxyUrl(mode, url)),
    onSuccess: async (result) => {
      writeSettingsApiProxyMutationPayload(queryClient, result.data);
      await options?.onSaved?.(result);
    },
    onError: options?.onSaveError,
  });

  const testProxyMutation = useMutation({
    mutationFn: ({ mode, url }: { mode: ApiProxyMode; url: string }) =>
      settingsService.testApiProxyConfig(mode, normalizeSettingsProxyUrl(mode, url)),
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
