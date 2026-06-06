import { ModuleStoreUpdaterBoundary } from "@/features/_shared/updater";
import { CustomInstructionsCache } from "./cache";

export function CustomInstructionsStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={CustomInstructionsCache} />;
}
