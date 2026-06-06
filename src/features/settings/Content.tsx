/**
 * 中文职责说明：settings 模块 Content 接入页面组件和 dumped 合同 owner，不在 route shell 中持有业务状态。
 */
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
