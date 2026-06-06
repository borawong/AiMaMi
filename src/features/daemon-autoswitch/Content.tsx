import { DaemonAutoswitchPage } from "./components/page";
import { DumpedContractBoundary } from "@/features/_shared/boundary";
import { DUMPED_DAEMON_AUTOSWITCH_COMMANDS } from "./contract";

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
