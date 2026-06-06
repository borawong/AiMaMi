import type { DaemonAutoswitchPageController } from "../types";
import { DaemonAutoswitchHeader } from "./header";
import { DaemonAutoswitchMetrics } from "./metrics";
import { DaemonAutoswitchPanels } from "./panels";

export function DaemonAutoswitchShell({
  controller,
}: {
  controller: DaemonAutoswitchPageController;
}) {
  return (
    <div className="space-y-5">
      <DaemonAutoswitchHeader />
      <DaemonAutoswitchMetrics metrics={controller.metrics} />
      <DaemonAutoswitchPanels panels={controller.panels} />
    </div>
  );
}
