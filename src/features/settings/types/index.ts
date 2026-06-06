import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type { AccentPreset, HeatmapPreset } from "@/hooks/accent";
import type { RefreshInterval } from "@/hooks/refresh";
import type { Theme } from "@/hooks/theme";

export type SettingsModuleId = "settings";
export type SettingsCacheEnvelope<TPayload = unknown> = ModuleCacheEnvelope<TPayload>;

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
  onRefreshUsageStatus?: () => Promise<unknown>;
}
