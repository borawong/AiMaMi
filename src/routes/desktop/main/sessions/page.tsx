/**
 * 中文职责说明：sessions route shell 只负责路由装配和模块 Provider 接入。
 */
import { SessionsFeature } from "@/features/sessions";

export function SessionsRoute() {
  return <SessionsFeature />;
}
