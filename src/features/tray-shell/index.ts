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
