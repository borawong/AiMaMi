import { ModuleStoreUpdaterBoundary } from "@/features/_shared/updater";
import { RelayCache } from "./cache";

export function RelayStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={RelayCache} />;
}
