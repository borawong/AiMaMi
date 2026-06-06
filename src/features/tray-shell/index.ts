/**
 * 中文职责说明：tray-shell 模块唯一公共入口，外部只能通过这里接入模块。
 */
import { createElement } from "react";
import { TrayShellProvider } from "./Provider";
import { TrayShellContent } from "./Content";

export function TrayShellFeature() {
  return createElement(
    TrayShellProvider,
    null,
    createElement(TrayShellContent),
  );
}

export { TrayShellProvider } from "./Provider";
export { TrayShellContent } from "./Content";
