import { ModuleStoreUpdaterBoundary } from "@/features/_shared/updater";
import { MaintenanceCache } from "./cache";

export function MaintenanceStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={MaintenanceCache} />;
}
