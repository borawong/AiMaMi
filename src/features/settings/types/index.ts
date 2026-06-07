import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type { AccentPreset, HeatmapPreset } from "@/hooks/accent";
import type { RefreshInterval } from "@/hooks/refresh";
import type { Theme } from "@/hooks/theme";

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
