/**
 * 中文职责说明：tray-shell route shell 只负责路由装配和模块 Provider 接入。
 */
import { TrayShellFeature } from "@/features/tray-shell";

export function TrayShellRoute() {
  return <TrayShellFeature />;
}
