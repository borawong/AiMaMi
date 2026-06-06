/**
 * 中文职责说明：daemon-autoswitch route shell 只负责路由装配和模块 Provider 接入。
 */
import { DaemonAutoswitchFeature } from "@/features/daemon-autoswitch";

export function DaemonAutoswitchRoute() {
  return <DaemonAutoswitchFeature />;
}
