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
