/**
 * 中文职责说明：maintenance route shell 只负责路由装配和模块 Provider 接入。
 */
import { MaintenanceFeature } from "@/features/maintenance";

export function MaintenanceRoute() {
  return <MaintenanceFeature />;
}
