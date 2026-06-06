import { createElement } from "react";
import { PluginsProvider } from "./Provider";
import { PluginsContent } from "./Content";

export function PluginsFeature() {
  return createElement(
    PluginsProvider,
    null,
    createElement(PluginsContent),
  );
}

export { PluginsProvider } from "./Provider";
export { PluginsContent } from "./Content";
