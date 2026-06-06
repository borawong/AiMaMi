/**
 * 中文职责说明：plugins 模块唯一公共入口，外部只允许通过这里接入模块。
 */
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
