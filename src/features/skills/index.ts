/**
 * 中文职责说明：skills 模块唯一公共入口，外部只能通过这里接入模块。
 */
import { createElement } from "react";
import { SkillsProvider } from "./Provider";
import { SkillsContent } from "./Content";

export function SkillsFeature() {
  return createElement(
    SkillsProvider,
    null,
    createElement(SkillsContent),
  );
}

export { SkillsProvider } from "./Provider";
export { SkillsContent } from "./Content";
