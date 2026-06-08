import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonBusyContent } from "@/components/ui/busy";
import type { SettingsControllerProps } from "../types";
import { SettingsRow, SettingsSection } from "./primitives";

export function SettingsAboutPanel({
  controller,
}: SettingsControllerProps) {
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
    </SettingsSection>
  );
}
