import type { Dispatch, SetStateAction } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type { AccentPreset, HeatmapPreset } from "@/hooks/accent";
import type { RefreshInterval } from "@/hooks/refresh";
import type { Theme } from "@/hooks/theme";
import type {
  ApiProxyConfigPayload,
  ApiProxyMode,
  ApiProxyTestPayload,
  AutoSwitchStatusPayload,
  CoreEnvelope,
  CoreSnapshotPayload,
} from "@/types";

export type SettingsModuleId = "settings";
export type SettingsQueryPayload = boolean | RefreshInterval;
export type SettingsRuntimeStateDisplayQueryKey = readonly [
  "runtime-state",
  "display",
];
export type SettingsHasNotchQueryKey = readonly ["has-notch"];
export type SettingsHotspotEnabledQueryKey = readonly ["hotspot-enabled"];
export type SettingsImageCompatQueryKey = readonly ["imageCompat"];
export type SettingsUsageRefreshIntervalQueryKey = readonly [
  "usage-refresh-interval",
];
export type SettingsWritableQueryKey =
  | SettingsHasNotchQueryKey
  | SettingsHotspotEnabledQueryKey
  | SettingsImageCompatQueryKey
  | SettingsUsageRefreshIntervalQueryKey;
export type SettingsQueryPayloadForKey<TKey extends SettingsWritableQueryKey> =
  TKey extends SettingsUsageRefreshIntervalQueryKey ? RefreshInterval : boolean;
export type SettingsCachePayload =
  | {
      queryKey: SettingsHasNotchQueryKey;
      value: boolean;
    }
  | {
      queryKey: SettingsHotspotEnabledQueryKey;
      value: boolean;
    }
  | {
      queryKey: SettingsImageCompatQueryKey;
      value: boolean;
    }
  | {
      queryKey: SettingsUsageRefreshIntervalQueryKey;
      value: RefreshInterval;
    };
export type SettingsCacheEnvelope<
  TPayload extends SettingsCachePayload = SettingsCachePayload,
> = ModuleCacheEnvelope<TPayload>;

export interface SettingsPageProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  accent: AccentPreset;
  setAccent: (accent: AccentPreset) => void;
  heatmap: HeatmapPreset;
  setHeatmap: (heatmap: HeatmapPreset) => void;
  language: string;
  setLanguage: (lang: string) => void;
  refreshInterval: RefreshInterval;
  setRefreshInterval: (v: RefreshInterval) => void;
  onCheckUpdate: () => Promise<"available" | "up-to-date" | "error">;
  onRefreshUsageStatus?: () => Promise<void> | void;
}

type SettingsStateSetter<T> = Dispatch<SetStateAction<T>>;

export type SettingsStatusQuery = UseQueryResult<
  CoreEnvelope<CoreSnapshotPayload>,
  Error
>;

export interface SettingsAppearanceController {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  accent: AccentPreset;
  setAccent: (accent: AccentPreset) => void;
  heatmap: HeatmapPreset;
  setHeatmap: (heatmap: HeatmapPreset) => void;
  language: string;
  setLanguage: (lang: string) => void;
  supportsHotspot: boolean;
  hasNotch: boolean;
  hotspotEnabled: boolean;
  hotspotLoading: boolean;
  hotspotPending: boolean;
  hotspotReadyPending: boolean;
  imageCompatEnabled: boolean;
  imageCompatLoading: boolean;
  imageCompatPending: boolean;
}

export interface SettingsStatusController {
  statusQuery: SettingsStatusQuery;
}

export interface SettingsModeSwitchController {
  autoSwitch: AutoSwitchStatusPayload | undefined;
  currentProxy: ApiProxyConfigPayload;
  refreshInterval: RefreshInterval;
  autoSwitchPending: boolean;
}

export interface SettingsAboutController {
  appVersion: string;
  checkingUpdate: boolean;
  updateInstallabilityPending: boolean;
}

export interface SettingsThresholdDialogController {
  open: boolean;
  setOpen: SettingsStateSetter<boolean>;
  draft5h: number;
  setDraft5h: SettingsStateSetter<number>;
  draftWeekly: number;
  setDraftWeekly: SettingsStateSetter<number>;
  pendingEnable: boolean;
  saving: boolean;
}

export interface SettingsProxyDialogController {
  open: boolean;
  setOpen: SettingsStateSetter<boolean>;
  currentProxy: ApiProxyConfigPayload;
  draftProxyMode: ApiProxyMode;
  draftProxyUrl: string;
  proxyTestResult: ApiProxyTestPayload | null;
  manualProxyMissing: boolean;
  detecting: boolean;
  testing: boolean;
  saving: boolean;
}

export interface SettingsPageActions {
  setHotspotEnabled: (enabled: boolean) => void;
  markHotspotReady: () => void;
  setImageCompatEnabled: (enabled: boolean) => void;
  setAutoSwitchEnabled: (enabled: boolean) => void;
  openThresholdDialog: (enabling: boolean) => void;
  saveThresholds: () => void;
  openProxyDialog: () => void;
  setProxyMode: (mode: ApiProxyMode) => void;
  setProxyUrl: (url: string) => void;
  detectProxy: () => Promise<void>;
  testProxy: () => Promise<void>;
  saveProxy: () => Promise<void>;
  setRefreshInterval: (value: string) => void;
  checkUpdate: () => Promise<void>;
}

// UI 层只消费显式 controller 契约，不再从 hook ReturnType 推导 props。
export interface SettingsPageController {
  appearance: SettingsAppearanceController;
  status: SettingsStatusController;
  modeSwitch: SettingsModeSwitchController;
  about: SettingsAboutController;
  thresholdDialog: SettingsThresholdDialogController;
  proxyDialog: SettingsProxyDialogController;
  actions: SettingsPageActions;
}

export interface SettingsControllerProps {
  controller: SettingsPageController;
}
