import { ModuleStoreUpdaterBoundary } from "@/features/_shared/updater";
import { AnalyticsCache } from "./cache";

export function AnalyticsStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={AnalyticsCache} />;
}
