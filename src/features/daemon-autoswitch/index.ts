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
