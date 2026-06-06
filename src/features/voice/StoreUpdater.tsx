import { ModuleStoreUpdaterBoundary } from "@/features/_shared/updater";
import { VoiceCache } from "./cache";

export function VoiceStoreUpdater() {
  return <ModuleStoreUpdaterBoundary cacheOwner={VoiceCache} />;
}
