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
