import { ModuleStoreUpdaterBoundary } from "@/features/_shared/updater";
import { PluginsCache } from "./cache";

export function PluginsStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={PluginsCache} />;
}
