/**
 * 中文职责说明：集中提供路由渲染需要的全局设置上下文，不承载具体页面业务。
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import { usePromptHostActions } from "@/app/providers/prompt-host";
import { useAccentColor } from "@/hooks/use-accent-color";
import { useAutoRefresh } from "@/hooks/use-auto-refresh";
import { useTheme } from "@/hooks/use-theme";
import type { RouteRenderContext } from "@/routes/registry/route-registry";

type RouteSettings = RouteRenderContext["settings"];

const RouteSettingsContext = createContext<RouteSettings | null>(null);

export function RouteSettingsProvider({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { accent, setAccent, heatmap, setHeatmap } = useAccentColor();
  const { i18n } = useTranslation();
  const { refreshInterval, setRefreshInterval } = useAutoRefresh();
  const { checkForUpdate } = usePromptHostActions();

  const handleThemeChange = useCallback(
    (nextTheme: "light" | "dark" | "system") => {
      setTheme(nextTheme);
    },
    [setTheme],
  );

  const handleLanguageChange = useCallback(
    (lang: string) => {
      void i18n.changeLanguage(lang);
      localStorage.setItem("app_language", lang);
    },
    [i18n],
  );

  const settings = useMemo<RouteSettings>(
    () => ({
      theme,
      onThemeChange: handleThemeChange,
      accent,
      setAccent,
      heatmap,
      setHeatmap,
      language: i18n.language,
      setLanguage: handleLanguageChange,
      refreshInterval,
      setRefreshInterval,
      onCheckUpdate: checkForUpdate,
    }),
    [
      accent,
      checkForUpdate,
      handleLanguageChange,
      handleThemeChange,
      heatmap,
      i18n.language,
      refreshInterval,
      setAccent,
      setHeatmap,
      setRefreshInterval,
      theme,
    ],
  );

  return (
    <RouteSettingsContext.Provider value={settings}>
      {children}
    </RouteSettingsContext.Provider>
  );
}

export function useRouteRenderSettings() {
  const settings = useContext(RouteSettingsContext);
  if (!settings) {
    throw new Error("缺少 RouteSettingsProvider");
  }
  return settings;
}
