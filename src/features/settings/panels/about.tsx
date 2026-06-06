import { useTranslation } from "react-i18next";
import { Download, Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonBusyContent } from "@/components/ui/busy";
import type { SettingsPageController } from "../hooks";
import { SettingsRow, SettingsSection } from "./primitives";

export function SettingsAboutPanel({
  controller,
}: {
  controller: SettingsPageController;
}) {
  const { t } = useTranslation();
  const about = controller.about;
  const checkingUpdate = about.checkingUpdate || about.updateInstallabilityPending;

  return (
    <SettingsSection title={t("settings.about")}>
      <SettingsRow label={t("settings.version")}>
        <span className="text-sm text-muted-foreground">{about.appVersion}</span>
      </SettingsRow>

      <SettingsRow label={t("settings.checkUpdate")}>
        <Button
          variant="outline"
          size="sm"
          onClick={controller.actions.checkUpdate}
          disabled={checkingUpdate}
          aria-busy={checkingUpdate}
        >
          <ButtonBusyContent
            busy={checkingUpdate}
            idleIcon={<Download className="h-3.5 w-3.5 shrink-0" />}
            idleLabel={t("settings.checkUpdate")}
            busyLabel={t("settings.checkUpdateBusy")}
          />
        </Button>
      </SettingsRow>

      <SettingsRow
        label={t("settings.updateRestart")}
        description={t("settings.updateRestartDesc")}
      >
        {/* 更新重启需要已安装更新的运行时证据，当前切片只暴露禁用边界。 */}
        <Button variant="outline" size="sm" disabled>
          <Power className="h-3.5 w-3.5 shrink-0" />
          {t("settings.updateRestartBoundary")}
        </Button>
      </SettingsRow>
    </SettingsSection>
  );
}
