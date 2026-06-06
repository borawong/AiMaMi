import { PluginsPage } from "./components/page";
import { DumpedContractBoundary } from "@/features/_shared/boundary";
import { DUMPED_PLUGINS_COMMANDS } from "./contract";

export function PluginsContent() {
  return (
    <>
      <DumpedContractBoundary moduleId="plugins" commands={DUMPED_PLUGINS_COMMANDS} />
      <PluginsPage />
    </>
  );
}
