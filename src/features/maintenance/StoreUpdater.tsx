/**
 * 中文职责说明：maintenance 模块 StoreUpdater 只同步 runtime/cache envelope 到 active cache，不写业务状态。
 */
import { ModuleStoreUpdaterBoundary } from "@/features/_shared/updater";
import { MaintenanceCache } from "./cache";

export function MaintenanceStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={MaintenanceCache} />;
}
