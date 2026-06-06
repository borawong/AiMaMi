/**
 * 中文职责说明：relay 模块唯一公共入口，外部只能通过这里接入模块。
 */
import { createElement } from "react";
import { RelayProvider } from "./Provider";
import { RelayContent } from "./Content";

export function RelayFeature() {
  return createElement(
    RelayProvider,
    null,
    createElement(RelayContent),
  );
}

export { RelayProvider } from "./Provider";
export { RelayContent } from "./Content";
