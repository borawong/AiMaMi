/**
 * 中文职责说明：overview 模块唯一公共入口，外部只能通过这里接入模块。
 */
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
