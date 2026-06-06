/**
 * 中文职责说明：daemon-autoswitch 模块 StoreUpdater 只同步 runtime/cache envelope 到 active cache，不写业务状态。
 */
import { ModuleStoreUpdaterBoundary } from "@/features/_shared/module-store-updater";
import { DaemonAutoswitchCache } from "./cache";

export function DaemonAutoswitchStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={DaemonAutoswitchCache} />;
}
