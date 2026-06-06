/**
 * 中文职责说明：sessions 模块唯一公共入口，外部只能通过这里接入模块。
 */
import { createElement } from "react";
import { SessionsProvider } from "./Provider";
import { SessionsContent } from "./Content";

export function SessionsFeature() {
  return createElement(
    SessionsProvider,
    null,
    createElement(SessionsContent),
  );
}

export { SessionsProvider } from "./Provider";
export { SessionsContent } from "./Content";
