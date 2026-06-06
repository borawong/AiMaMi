import { VoicePage } from "./components/voice-page";
import { DumpedContractBoundary } from "@/features/_shared/dumped-contract-boundary";
import { DUMPED_VOICE_COMMANDS } from "./dumped-contract";

export function VoiceContent() {
  return (
    <>
      <DumpedContractBoundary moduleId="voice" commands={DUMPED_VOICE_COMMANDS} />
      <VoicePage />
    </>
  );
}
