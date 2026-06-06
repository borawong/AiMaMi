import { DumpedContractBoundary } from "@/features/_shared/boundary";
import {
  SettingsPage,
  type SettingsPageProps as SettingsContentProps,
} from "./components/page";
import { DUMPED_SETTINGS_COMMANDS } from "./contract";

export type { SettingsContentProps };

export function SettingsContent(props: SettingsContentProps) {
  return (
    <>
      <DumpedContractBoundary moduleId="settings" commands={DUMPED_SETTINGS_COMMANDS} />
      <SettingsPage {...props} />
    </>
  );
}
