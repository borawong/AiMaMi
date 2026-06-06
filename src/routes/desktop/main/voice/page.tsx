/**
 * 中文职责说明：voice route shell 只负责路由装配和模块 Provider 接入。
 */
import { VoiceFeature } from "@/features/voice";

export function VoiceRoute() {
  return <VoiceFeature />;
}
