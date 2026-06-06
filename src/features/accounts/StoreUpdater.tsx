import { ModuleStoreUpdaterBoundary } from "@/features/_shared/updater";
import { AccountsCache } from "./cache";

export function AccountsStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={AccountsCache} />;
}
