/**
 * 中文职责说明：custom-instructions 模块唯一公共入口，外部只能通过这里接入模块。
 */
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
