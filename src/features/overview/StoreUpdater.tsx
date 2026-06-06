/**
 * 中文职责说明：overview 模块 StoreUpdater 只同步 runtime/cache envelope 到 active cache，不写业务状态。
 */
import { ModuleStoreUpdaterBoundary } from "@/features/_shared/updater";
import { OverviewCache } from "./cache";

export function OverviewStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={OverviewCache} />;
}
