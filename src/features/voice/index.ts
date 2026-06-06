import { createElement } from "react";
import { VoicePage } from "./components/page";

export function VoiceFeature() {
  return createElement(VoicePage);
}

export { VoiceProvider } from "./Provider";
export { VoiceContent } from "./Content";
export { VoicePage } from "./components/page";
