import { DaemonAutoswitchPage } from "./components/daemon-autoswitch-page";
import { DumpedContractBoundary } from "@/features/_shared/dumped-contract-boundary";
import { DUMPED_DAEMON_AUTOSWITCH_COMMANDS } from "./dumped-contract";

export function DaemonAutoswitchContent() {
  return (
    <>
      <DumpedContractBoundary
        moduleId="daemon-autoswitch"
        commands={DUMPED_DAEMON_AUTOSWITCH_COMMANDS}
      />
      <DaemonAutoswitchPage />
    </>
  );
}
