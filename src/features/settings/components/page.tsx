import { SettingsApiProxyDialog, SettingsThresholdDialog } from "../dialogs";
import { useSettingsPageController } from "../hooks";
import {
  SettingsAboutPanel,
  SettingsAppearancePanel,
  SettingsModeSwitchPanel,
  SettingsStatusPanel,
} from "../panels";
import type { SettingsPageProps } from "../types";

export type { SettingsPageProps } from "../types";

export function SettingsPage(props: SettingsPageProps) {
  const controller = useSettingsPageController(props);

  return (
    <div className="space-y-8">
      <SettingsStatusPanel controller={controller} />
      <SettingsAppearancePanel controller={controller} />
      <SettingsModeSwitchPanel controller={controller} />
      <SettingsAboutPanel controller={controller} />
      <SettingsThresholdDialog controller={controller} />
      <SettingsApiProxyDialog controller={controller} />
    </div>
  );
}
