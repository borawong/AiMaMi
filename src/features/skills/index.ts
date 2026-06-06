import { createElement } from "react";
import { SkillsPage } from "./components/page";

export function SkillsFeature() {
  return createElement(SkillsPage);
}

export { SkillsProvider } from "./Provider";
export { SkillsContent } from "./Content";
export { SkillsPage } from "./components/page";
