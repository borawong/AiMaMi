import { PluginsPage } from "./components/plugins-page";
import { DumpedContractBoundary } from "@/features/_shared/dumped-contract-boundary";
import { DUMPED_PLUGINS_COMMANDS } from "./dumped-contract";

export function PluginsContent() {
  return (
    <>
      <DumpedContractBoundary moduleId="plugins" commands={DUMPED_PLUGINS_COMMANDS} />
      <PluginsPage />
    </>
  );
}
