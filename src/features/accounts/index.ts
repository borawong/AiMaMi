/**
 * 中文职责说明：accounts 模块唯一公共入口，外部只能通过这里接入模块。
 */
import { createElement } from "react";
import { AccountsProvider } from "./Provider";
import { AccountsContent } from "./Content";

export function AccountsFeature() {
  return createElement(
    AccountsProvider,
    null,
    createElement(AccountsContent),
  );
}

export { AccountsProvider } from "./Provider";
export { AccountsContent } from "./Content";
