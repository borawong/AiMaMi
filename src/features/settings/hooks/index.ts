/**
 * 中文职责说明：settings 模块 hook 拥有 full refresh、active-only refresh、abort 和 replay 防护入口。
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { useBusyAction } from "@/hooks/use-busy-action";
import { toast } from "@/hooks/use-toast";
import { isMacPlatform } from "@/lib/platform";
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
import type { SettingsPageProps } from "../types";
import { formatSettingsProxySaveError, isSettingsRefreshInterval } from "../utils";

export const RUNTIME_STATE_DISPLAY_QUERY_KEY = SETTINGS_RUNTIME_STATE_DISPLAY_QUERY_KEY;

type SnapshotEnvelope = Awaited<ReturnType<typeof settingsService.loadSnapshot>>;
const DEFAULT_THRESHOLD_5H_PERCENT = 15;
const DEFAULT_THRESHOLD_WEEKLY_PERCENT = 10;

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

// 页面 controller owning settings 页面的 hydration、短生命周期弹窗状态和保存动作。
export function useSettingsPageController({
  theme,
  onThemeChange,
  accent,
  setAccent,
  heatmap,
  setHeatmap,
  language,
  setLanguage,
  refreshInterval,
  setRefreshInterval,
  onCheckUpdate,
  onRefreshUsageStatus,
}: SettingsPageProps) {
  const { t } = useTranslation();
  const supportsHotspot = isMacPlatform();
  const runtimeState = useSettingsRuntimeState(supportsHotspot);
  const autoSwitch = runtimeState.status?.autoSwitch;
  const { refreshIntervalQuery, saveRefreshIntervalMutation } = useSettingsRefreshInterval();
  const { imageCompatQuery, setImageCompatMutation } = useSettingsImageCompat();
  const hotspotReadyMutation = useSettingsHotspotReadyMutation();
  const updateInstallabilityMutation = useSettingsUpdateInstallabilityMutation();
  const updateCheckAction = useBusyAction({ minVisibleMs: 600 });
  const detectProxyAction = useBusyAction({ minVisibleMs: 600 });
  const testProxyAction = useBusyAction({ minVisibleMs: 600 });
  const saveProxyAction = useBusyAction({ minVisibleMs: 600 });
  const appVersion = useSettingsAppVersion();

  const [thresholdDialogOpen, setThresholdDialogOpen] = useState(false);
  const [draft5h, setDraft5h] = useState(DEFAULT_THRESHOLD_5H_PERCENT);
  const [draftWeekly, setDraftWeekly] = useState(DEFAULT_THRESHOLD_WEEKLY_PERCENT);
  const [pendingEnable, setPendingEnable] = useState(false);
  const [proxyDialogOpen, setProxyDialogOpen] = useState(false);
  const [draftProxyMode, setDraftProxyMode] = useState<ApiProxyMode>("direct");
  const [draftProxyUrl, setDraftProxyUrl] = useState("");
  const [proxyTestResult, setProxyTestResult] = useState<ApiProxyTestPayload | null>(null);

  const { disableAutoSwitchMutation, saveThresholdsMutation } = useSettingsAutoSwitchMutations({
    onDisabled: () => {
      toast({
        title: t("settings.autoSwitchDisabled"),
        description: t("settings.autoSwitchDisabledDesc"),
        variant: "success",
      });
    },
    onThresholdsSaved: (params) => {
      setThresholdDialogOpen(false);
      toast({
        title: params.enable ? t("settings.autoSwitchEnabled") : t("settings.thresholdSavedTitle"),
        description: params.enable
          ? t("settings.autoSwitchEnabledDesc")
          : t("settings.thresholdSavedDesc"),
        variant: "success",
      });
    },
  });

  const hotspotMutation = useSettingsHotspotMutation({
    onChanged: (enabled) => {
      toast({
        title: enabled ? t("settings.hotspotEnabled") : t("settings.hotspotDisabled"),
        description: enabled ? t("settings.hotspotEnabledDesc") : t("settings.hotspotDisabledDesc"),
        variant: "success",
      });
    },
  });

  const { saveProxyMutation, testProxyMutation, detectProxyMutation } = useApiProxyMutations({
    onSaved: async () => {
      setProxyDialogOpen(false);
      setProxyTestResult(null);
      await onRefreshUsageStatus?.();
      toast({
        title: t("settings.apiProxySaved"),
        description: t("settings.apiProxySavedDesc"),
        variant: "success",
      });
    },
    onSaveError: (error) => {
      toast({
        title: t("common.error"),
        description: formatSettingsProxySaveError(t, error),
        variant: "destructive",
      });
    },
    onTested: (result) => {
      setProxyTestResult(result);
    },
    onTestError: (error) => {
      setProxyTestResult({
        code: "network_error",
        reachable: false,
        statusCode: null,
        message: error instanceof Error ? error.message : String(error),
      });
    },
    onDetected: (payload: ApiProxyDetectPayload) => {
      if (payload.found && payload.mode === "manual" && payload.url) {
        setDraftProxyMode("manual");
        setDraftProxyUrl(payload.url);
      }
      setProxyTestResult(payload.probe);
    },
    onDetectError: () => {
      setProxyTestResult({
        code: "not_found",
        reachable: false,
        statusCode: null,
        message: "",
      });
    },
  });

  useEffect(() => {
    const nextRefreshInterval = refreshIntervalQuery.data;
    if (
      isSettingsRefreshInterval(nextRefreshInterval) &&
      nextRefreshInterval !== refreshInterval
    ) {
      setRefreshInterval(nextRefreshInterval);
    }
  }, [refreshIntervalQuery.data, refreshInterval, setRefreshInterval]);

  useEffect(() => {
    if (!proxyDialogOpen) return;
    setDraftProxyMode(runtimeState.currentProxy.mode);
    setDraftProxyUrl(runtimeState.currentProxy.url ?? "");
    setProxyTestResult(null);
  }, [proxyDialogOpen, runtimeState.currentProxy.mode, runtimeState.currentProxy.url]);

  const openThresholdDialog = (enabling: boolean) => {
    setPendingEnable(enabling);
    setDraft5h(autoSwitch?.threshold5hPercent ?? DEFAULT_THRESHOLD_5H_PERCENT);
    setDraftWeekly(autoSwitch?.thresholdWeeklyPercent ?? DEFAULT_THRESHOLD_WEEKLY_PERCENT);
    setThresholdDialogOpen(true);
  };

  const handleAutoSwitchChange = (enabled: boolean) => {
    if (enabled) {
      openThresholdDialog(true);
      return;
    }

    disableAutoSwitchMutation.mutate();
  };

  const saveThresholds = () => {
    saveThresholdsMutation.mutate({
      enable: pendingEnable,
      t5h: draft5h,
      tWeekly: draftWeekly,
    });
  };

  const handleRefreshIntervalChange = (value: string) => {
    if (!isSettingsRefreshInterval(value) || value === refreshInterval) return;

    const previousRefreshInterval = refreshInterval;
    setRefreshInterval(value);
    saveRefreshIntervalMutation.mutate(value, {
      onError: () => {
        setRefreshInterval(previousRefreshInterval);
        toast({
          title: t("settings.refreshIntervalSaveFailedTitle"),
          description: t("settings.refreshIntervalSaveFailedDesc"),
          variant: "destructive",
        });
      },
    });
  };

  const handleCheckUpdate = async () => {
    await updateCheckAction.run(async () => {
      try {
        await updateInstallabilityMutation.mutateAsync();
        const result = await onCheckUpdate();
        if (result === "up-to-date") {
          toast({
            title: t("settings.upToDate"),
            description: t("settings.upToDateDesc"),
            variant: "default",
          });
        } else if (result === "error") {
          toast({
            title: t("settings.updateCheckFailed"),
            description: t("settings.updateCheckFailedDesc"),
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: t("settings.updateCheckFailed"),
          description: t("settings.updateCheckFailedDesc"),
          variant: "destructive",
        });
      }
    });
  };

  const manualProxyMissing = draftProxyMode === "manual" && draftProxyUrl.trim().length === 0;

  const handleProxyModeChange = (mode: ApiProxyMode) => {
    setDraftProxyMode(mode);
    setProxyTestResult(null);
  };

  const handleProxyUrlChange = (url: string) => {
    setDraftProxyUrl(url);
    setProxyTestResult(null);
  };

  const handleTestProxy = async () => {
    await testProxyAction.run(async () => {
      if (manualProxyMissing) return;
      await testProxyMutation.mutateAsync({ mode: draftProxyMode, url: draftProxyUrl });
    });
  };

  const handleDetectProxy = async () => {
    await detectProxyAction.run(async () => {
      await detectProxyMutation.mutateAsync();
    });
  };

  const handleSaveProxy = async () => {
    await saveProxyAction.run(async () => {
      if (manualProxyMissing) return;
      await saveProxyMutation.mutateAsync({ mode: draftProxyMode, url: draftProxyUrl });
    });
  };

  return {
    appearance: {
      theme,
      onThemeChange,
      accent,
      setAccent,
      heatmap,
      setHeatmap,
      language,
      setLanguage,
      supportsHotspot,
      hasNotch: runtimeState.hasNotch,
      hotspotEnabled: runtimeState.hotspotQuery.data ?? false,
      hotspotLoading: runtimeState.hotspotQuery.isLoading,
      hotspotPending: hotspotMutation.isPending,
      hotspotReadyPending: hotspotReadyMutation.isPending,
      imageCompatEnabled: imageCompatQuery.data ?? false,
      imageCompatLoading: imageCompatQuery.isLoading,
      imageCompatPending: setImageCompatMutation.isPending,
    },
    status: {
      statusQuery: runtimeState.statusQuery,
    },
    modeSwitch: {
      autoSwitch,
      currentProxy: runtimeState.currentProxy,
      refreshInterval,
      autoSwitchPending:
        disableAutoSwitchMutation.isPending || saveThresholdsMutation.isPending,
    },
    about: {
      appVersion,
      checkingUpdate: updateCheckAction.busy,
      updateInstallabilityPending: updateInstallabilityMutation.isPending,
    },
    thresholdDialog: {
      open: thresholdDialogOpen,
      setOpen: setThresholdDialogOpen,
      draft5h,
      setDraft5h,
      draftWeekly,
      setDraftWeekly,
      pendingEnable,
      saving: saveThresholdsMutation.isPending,
    },
    proxyDialog: {
      open: proxyDialogOpen,
      setOpen: setProxyDialogOpen,
      currentProxy: runtimeState.currentProxy,
      draftProxyMode,
      draftProxyUrl,
      proxyTestResult,
      manualProxyMissing,
      detecting: detectProxyAction.busy,
      testing: testProxyAction.busy,
      saving: saveProxyAction.busy,
    },
    actions: {
      setHotspotEnabled: (enabled: boolean) => hotspotMutation.mutate(enabled),
      markHotspotReady: () => hotspotReadyMutation.mutate(),
      setImageCompatEnabled: (enabled: boolean) => setImageCompatMutation.mutate(enabled),
      setAutoSwitchEnabled: handleAutoSwitchChange,
      openThresholdDialog,
      saveThresholds,
      openProxyDialog: () => setProxyDialogOpen(true),
      setProxyMode: handleProxyModeChange,
      setProxyUrl: handleProxyUrlChange,
      detectProxy: handleDetectProxy,
      testProxy: handleTestProxy,
      saveProxy: handleSaveProxy,
      setRefreshInterval: handleRefreshIntervalChange,
      checkUpdate: handleCheckUpdate,
    },
  };
}

export type SettingsPageController = ReturnType<typeof useSettingsPageController>;

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
