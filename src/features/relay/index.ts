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
