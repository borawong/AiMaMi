/**
 * 中文职责说明：settings appearance 面板只消费 controller 状态并发出用户意图。
 */
import { useTranslation } from "react-i18next";
import { Globe, Image, Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonBusyContent } from "@/components/ui/busy";
import { Switch } from "@/components/ui/switch";
import {
  ACCENT_PRESETS,
  HEATMAP_PRESETS,
  type AccentPreset,
  type HeatmapPreset,
} from "@/hooks/accent";
import { cn } from "@/lib/utils";
import type { SettingsPageController } from "../hooks";
import { SettingsRow, SettingsSection, SettingsSegmentedControl } from "./primitives";

export function SettingsAppearancePanel({
  controller,
}: {
  controller: SettingsPageController;
}) {
  const { t } = useTranslation();
  const appearance = controller.appearance;

  return (
    <SettingsSection title={t("settings.appearance")}>
      <SettingsRow label={t("settings.theme")}>
        <SettingsSegmentedControl
          items={[
            { value: "light", icon: Sun, label: t("settings.light") },
            { value: "dark", icon: Moon, label: t("settings.dark") },
            { value: "system", icon: Monitor, label: t("settings.system") },
          ]}
          value={appearance.theme}
          onChange={(nextTheme) =>
            appearance.onThemeChange(nextTheme as typeof appearance.theme)
          }
        />
      </SettingsRow>

      <SettingsRow label={t("settings.language")}>
        <SettingsSegmentedControl
          items={[
            { value: "zh", icon: Globe, label: t("settings.languageZh") },
            { value: "en", icon: Globe, label: t("settings.languageEn") },
          ]}
          value={appearance.language}
          onChange={appearance.setLanguage}
        />
      </SettingsRow>

      <SettingsRow
        label={t("settings.accentColor")}
        description={t("settings.accentColorDesc")}
      >
        <div className="flex gap-2">
          {(Object.keys(ACCENT_PRESETS) as AccentPreset[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => appearance.setAccent(key)}
              title={ACCENT_PRESETS[key].label}
              className={cn(
                "h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-card transition-transform hover:scale-110",
                appearance.accent === key ? "ring-foreground" : "ring-transparent",
              )}
              style={{ backgroundColor: ACCENT_PRESETS[key].hex }}
            />
          ))}
        </div>
      </SettingsRow>

      <SettingsRow
        label={t("settings.heatmapColor")}
        description={t("settings.heatmapColorDesc")}
      >
        <div className="flex gap-2">
          {(Object.keys(HEATMAP_PRESETS) as HeatmapPreset[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => appearance.setHeatmap(key)}
              title={HEATMAP_PRESETS[key].label}
              className={cn(
                "h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-card transition-transform hover:scale-110",
                appearance.heatmap === key ? "ring-foreground" : "ring-transparent",
              )}
              style={{ backgroundColor: HEATMAP_PRESETS[key].hex }}
            />
          ))}
        </div>
      </SettingsRow>

      {appearance.supportsHotspot ? (
        <SettingsRow
          label={t("settings.hotspot")}
          description={
            appearance.hasNotch
              ? t("settings.hotspotDesc")
              : t("settings.hotspotNotSupported")
          }
        >
          <div className="flex items-center gap-2">
            <Switch
              checked={appearance.hasNotch && appearance.hotspotEnabled}
              onCheckedChange={controller.actions.setHotspotEnabled}
              disabled={
                !appearance.hasNotch ||
                appearance.hotspotLoading ||
                appearance.hotspotPending
              }
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={controller.actions.markHotspotReady}
              disabled={!appearance.hasNotch || appearance.hotspotReadyPending}
              aria-busy={appearance.hotspotReadyPending}
            >
              <ButtonBusyContent
                busy={appearance.hotspotReadyPending}
                idleLabel={t("settings.hotspotReady")}
                busyLabel={t("settings.hotspotReadyBusy")}
              />
            </Button>
          </div>
        </SettingsRow>
      ) : null}

      <SettingsRow
        label={
          <span className="inline-flex items-center gap-2">
            <Image className="h-3.5 w-3.5 text-muted-foreground" />
            {t("settings.imageCompat")}
          </span>
        }
        description={t("settings.imageCompatDesc")}
      >
        <Switch
          checked={appearance.imageCompatEnabled}
          onCheckedChange={controller.actions.setImageCompatEnabled}
          disabled={appearance.imageCompatLoading || appearance.imageCompatPending}
        />
      </SettingsRow>
    </SettingsSection>
  );
}
