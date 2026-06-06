import { ModuleStoreUpdaterBoundary } from "@/features/_shared/updater";
import { McpCache } from "./cache";

export function McpStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={McpCache} />;
}
