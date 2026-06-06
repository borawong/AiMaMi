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
