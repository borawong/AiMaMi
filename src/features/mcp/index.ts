import { createElement } from "react";
import { McpProvider } from "./Provider";
import { McpContent } from "./Content";

export function McpFeature() {
  return createElement(
    McpProvider,
    null,
    createElement(McpContent),
  );
}

export { McpProvider } from "./Provider";
export { McpContent } from "./Content";
