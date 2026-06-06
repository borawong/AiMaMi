import { ModuleStoreUpdaterBoundary } from "@/features/_shared/updater";
import { SettingsCache } from "./cache";

export function SettingsStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={SettingsCache} />;
}
