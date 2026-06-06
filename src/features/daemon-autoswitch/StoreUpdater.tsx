import { ModuleStoreUpdaterBoundary } from "@/features/_shared/updater";
import { DaemonAutoswitchCache } from "./cache";

export function DaemonAutoswitchStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={DaemonAutoswitchCache} />;
}
