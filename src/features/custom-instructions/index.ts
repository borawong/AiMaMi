import { createElement } from "react";
import { CustomInstructionsProvider } from "./Provider";
import { CustomInstructionsContent } from "./Content";

export function CustomInstructionsFeature() {
  return createElement(
    CustomInstructionsProvider,
    null,
    createElement(CustomInstructionsContent),
  );
}

export { CustomInstructionsProvider } from "./Provider";
export { CustomInstructionsContent } from "./Content";
