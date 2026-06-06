import { createElement } from "react";
import { OverviewProvider } from "./Provider";
import { OverviewContent } from "./Content";

export function OverviewFeature() {
  return createElement(
    OverviewProvider,
    null,
    createElement(OverviewContent),
  );
}

export { OverviewProvider } from "./Provider";
export { OverviewContent } from "./Content";
