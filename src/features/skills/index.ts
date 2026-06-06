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
