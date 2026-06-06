import { ModuleStoreUpdaterBoundary } from "@/features/_shared/updater";
import { SkillsCache } from "./cache";

export function SkillsStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={SkillsCache} />;
}
