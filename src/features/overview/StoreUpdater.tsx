import { ModuleStoreUpdaterBoundary } from "@/features/_shared/updater";
import { OverviewCache } from "./cache";

export function OverviewStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={OverviewCache} />;
}
