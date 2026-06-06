import { createElement } from "react";
import { VoiceProvider } from "./Provider";
import { VoiceContent } from "./Content";

export function VoiceFeature() {
  return createElement(
    VoiceProvider,
    null,
    createElement(VoiceContent),
  );
}

export { VoiceProvider } from "./Provider";
export { VoiceContent } from "./Content";
