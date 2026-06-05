/**
 * 中文职责说明：maintenance 模块唯一公共入口，外部只能通过这里接入模块。
 */
import { createElement } from "react";
import { MaintenanceProvider } from "./Provider";
import { MaintenanceContent } from "./Content";

export function MaintenanceFeature() {
  return createElement(
    MaintenanceProvider,
    null,
    createElement(MaintenanceContent),
  );
}

export { MaintenanceProvider } from "./Provider";
export { MaintenanceContent } from "./Content";
