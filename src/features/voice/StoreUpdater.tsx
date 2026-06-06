/**
 * 中文职责说明：voice 模块 StoreUpdater 只同步 runtime/cache envelope 到 active cache，不写业务状态。
 */
import { ModuleStoreUpdaterBoundary } from "@/features/_shared/updater";
import { VoiceCache } from "./cache";

export function VoiceStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={VoiceCache} />;
}
