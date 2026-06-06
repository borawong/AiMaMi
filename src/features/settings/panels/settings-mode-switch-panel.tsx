/**
 * 中文职责说明：settings mode-switch 面板只渲染切换、刷新频率和代理入口，不直接保存事实状态。
 */
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { REFRESH_OPTIONS } from "@/hooks/use-auto-refresh";
import type { SettingsPageController } from "../hooks";
import { settingsProxyModeBadgeLabel } from "../utils";
import { SettingsRow, SettingsSection, SettingsSegmentedControl } from "./settings-panel-primitives";

export function SettingsModeSwitchPanel({
  controller,
}: {
  controller: SettingsPageController;
}) {
  const { t } = useTranslation();
  const modeSwitch = controller.modeSwitch;
  const autoSwitch = modeSwitch.autoSwitch;

  return (
    <SettingsSection title={t("settings.modeSwitch")}>
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium">{t("settings.autoSwitch")}</span>
            {autoSwitch?.enabled ? (
              <Badge
                variant="secondary"
                className="cursor-pointer text-[11px] font-normal hover:bg-secondary/60"
                onClick={() => controller.actions.openThresholdDialog(false)}
              >
                {t("settings.threshold5h")} {autoSwitch.threshold5hPercent ?? 15}% /{" "}
                {t("settings.thresholdWeekly")} {autoSwitch.thresholdWeeklyPercent ?? 10}%
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("settings.autoSwitchDesc")}
          </p>
        </div>
        <Switch
          checked={autoSwitch?.enabled ?? false}
          onCheckedChange={controller.actions.setAutoSwitchEnabled}
          disabled={modeSwitch.autoSwitchPending}
        />
      </div>

      <SettingsRow
        label={t("settings.refreshInterval")}
        description={t("settings.refreshIntervalDesc")}
      >
        <SettingsSegmentedControl
          items={REFRESH_OPTIONS.map(({ value, labelKey }) => ({
            value,
            label: t(labelKey),
          }))}
          value={modeSwitch.refreshInterval}
          onChange={controller.actions.setRefreshInterval}
          compact
        />
      </SettingsRow>

      <SettingsRow
        label={
          <div className="flex items-center gap-2">
            <span>{t("settings.apiProxy")}</span>
            <Badge variant="secondary" className="text-[11px] font-normal">
              {settingsProxyModeBadgeLabel(t, modeSwitch.currentProxy.mode)}
            </Badge>
          </div>
        }
        description={t("settings.apiProxyDesc")}
      >
        <Button variant="outline" size="sm" onClick={controller.actions.openProxyDialog}>
          {t("common.edit")}
        </Button>
      </SettingsRow>
    </SettingsSection>
  );
}
