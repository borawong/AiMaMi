import { ModuleStoreUpdaterBoundary } from "@/features/_shared/updater";
import { TrayShellCache } from "./cache";

export function TrayShellStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={TrayShellCache} />;
}
