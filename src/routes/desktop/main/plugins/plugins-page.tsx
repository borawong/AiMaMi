/**
 * 中文职责说明：plugins route shell 只负责路由装配和模块 Provider 接入。
 */
import { PluginsFeature } from "@/features/plugins";

export function PluginsRoute() {
  return <PluginsFeature />;
}
