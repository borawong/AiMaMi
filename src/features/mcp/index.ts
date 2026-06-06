/**
 * 中文职责说明：mcp 模块唯一公共入口，外部只能通过这里接入模块。
 */
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
