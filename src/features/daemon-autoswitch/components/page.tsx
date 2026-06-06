/**
 * 中文职责说明：daemon-autoswitch 页面只装配模块 controller 和 panels，不持有 payload 派生或子组件实现。
 */
import { useDaemonAutoswitchPageController } from "../hooks";
import { DaemonAutoswitchShell } from "../panels";

export function DaemonAutoswitchPage() {
  const controller = useDaemonAutoswitchPageController();

  return <DaemonAutoswitchShell controller={controller} />;
}
