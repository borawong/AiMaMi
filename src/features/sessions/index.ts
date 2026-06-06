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
