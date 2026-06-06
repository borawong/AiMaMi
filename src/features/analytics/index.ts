/**
 * 中文职责说明：analytics 模块唯一公共入口，外部只能通过这里接入模块。
 */
import { createElement } from "react";
import { AnalyticsProvider } from "./Provider";
import { AnalyticsContent } from "./Content";

export function AnalyticsFeature() {
  return createElement(
    AnalyticsProvider,
    null,
    createElement(AnalyticsContent),
  );
}

export { AnalyticsProvider } from "./Provider";
export { AnalyticsContent } from "./Content";
