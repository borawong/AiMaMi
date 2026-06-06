import { ModuleStoreUpdaterBoundary } from "@/features/_shared/updater";
import { SessionsCache } from "./cache";

export function SessionsStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={SessionsCache} />;
}
