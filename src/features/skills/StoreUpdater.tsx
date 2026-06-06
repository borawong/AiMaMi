/**
 * 中文职责说明：skills 模块 StoreUpdater 只同步 runtime/cache envelope 到 active cache，不写业务状态。
 */
import { ModuleStoreUpdaterBoundary } from "@/features/_shared/module-store-updater";
import { SkillsCache } from "./cache";

export function SkillsStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={SkillsCache} />;
}
