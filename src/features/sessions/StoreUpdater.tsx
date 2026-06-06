/**
 * 中文职责说明：sessions 模块 StoreUpdater 只同步 runtime/cache envelope 到 active cache，不写业务状态。
 */
import { ModuleStoreUpdaterBoundary } from "@/features/_shared/updater";
import { SessionsCache } from "./cache";

export function SessionsStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={SessionsCache} />;
}
