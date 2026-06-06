/**
 * 中文职责说明：daemon-autoswitch 模块唯一公共入口，外部只能通过这里接入模块。
 */
import { createElement } from "react";
import { DaemonAutoswitchProvider } from "./Provider";
import { DaemonAutoswitchContent } from "./Content";

export function DaemonAutoswitchFeature() {
  return createElement(
    DaemonAutoswitchProvider,
    null,
    createElement(DaemonAutoswitchContent),
  );
}

export { DaemonAutoswitchProvider } from "./Provider";
export { DaemonAutoswitchContent } from "./Content";
