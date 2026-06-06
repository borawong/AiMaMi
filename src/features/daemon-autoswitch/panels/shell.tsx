/**
 * 中文职责说明：daemon-autoswitch shell owning 模块页面布局，消费 hook 产出的只读 view model。
 */
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
