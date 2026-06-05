/**
 * 中文职责说明：voice 模块唯一公共入口，外部只能通过这里接入模块。
 */
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
