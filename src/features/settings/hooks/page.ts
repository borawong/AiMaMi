import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/toast";
import { isMacPlatform } from "@/lib/platform";
import type {
  ApiProxyDetectPayload,
  ApiProxyMode,
  ApiProxyTestPayload,
} from "@/types";
import type { SettingsPageController, SettingsPageProps } from "../types";
import {
  formatSettingsProxySaveError,
  isSettingsRefreshInterval,
} from "../utils";
import { useSettingsBusyActions } from "./action";
import {
  useApiProxyMutations,
  useSettingsAutoSwitchMutations,
  useSettingsHotspotMutation,
  useSettingsHotspotReadyMutation,
  useSettingsImageCompatMutation,
  useSettingsRefreshIntervalMutation,
  useSettingsUpdateInstallabilityMutation,
} from "./mutation";
import {
  useSettingsAppVersion,
  useSettingsImageCompatQuery,
  useSettingsRefreshIntervalQuery,
  useSettingsRuntimeState,
} from "./query";

const DEFAULT_THRESHOLD_5H_PERCENT = 15;
const DEFAULT_THRESHOLD_WEEKLY_PERCENT = 10;

// Page controller 只组合 query/mutation/action 和短生命周期 UI 状态。
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
}: SettingsPageProps): SettingsPageController {
  const { t } = useTranslation();
  const supportsHotspot = isMacPlatform();
  const runtimeState = useSettingsRuntimeState(supportsHotspot);
  const autoSwitch = runtimeState.status?.autoSwitch;
  const refreshIntervalQuery = useSettingsRefreshIntervalQuery();
  const saveRefreshIntervalMutation = useSettingsRefreshIntervalMutation();
  const imageCompatQuery = useSettingsImageCompatQuery();
  const setImageCompatMutation = useSettingsImageCompatMutation();
  const hotspotReadyMutation = useSettingsHotspotReadyMutation();
  const updateInstallabilityMutation = useSettingsUpdateInstallabilityMutation();
  const {
    updateCheckAction,
    detectProxyAction,
    testProxyAction,
    saveProxyAction,
  } = useSettingsBusyActions();
  const appVersion = useSettingsAppVersion();

  const [thresholdDialogOpen, setThresholdDialogOpen] = useState(false);
  const [draft5h, setDraft5h] = useState(DEFAULT_THRESHOLD_5H_PERCENT);
  const [draftWeekly, setDraftWeekly] = useState(DEFAULT_THRESHOLD_WEEKLY_PERCENT);
  const [pendingEnable, setPendingEnable] = useState(false);
  const [proxyDialogOpen, setProxyDialogOpen] = useState(false);
  const [draftProxyMode, setDraftProxyMode] = useState<ApiProxyMode>("direct");
  const [draftProxyUrl, setDraftProxyUrl] = useState("");
  const [proxyTestResult, setProxyTestResult] = useState<ApiProxyTestPayload | null>(null);

  const { disableAutoSwitchMutation, saveThresholdsMutation } =
    useSettingsAutoSwitchMutations({
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
          title: params.enable
            ? t("settings.autoSwitchEnabled")
            : t("settings.thresholdSavedTitle"),
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
