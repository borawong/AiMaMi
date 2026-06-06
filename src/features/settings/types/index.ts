/**
 * 中文职责说明：settings 模块只声明边界类型，未证实业务字段不在这里编造。
 */
import type { ModuleCacheEnvelope } from "@/features/_shared/module-cache";
import type { AccentPreset, HeatmapPreset } from "@/hooks/use-accent-color";
import type { RefreshInterval } from "@/hooks/use-auto-refresh";
import type { Theme } from "@/hooks/use-theme";

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
