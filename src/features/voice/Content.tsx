import { DumpedContractBoundary } from "@/features/_shared/boundary";
import { DUMPED_VOICE_COMMANDS } from "./contract";
import { useVoicePageController } from "./hooks";
import { VoiceView } from "./panels";

export function VoiceContent() {
  const controller = useVoicePageController();

  return (
    <>
      <DumpedContractBoundary moduleId="voice" commands={DUMPED_VOICE_COMMANDS} />
      <VoiceView controller={controller} />
    </>
  );
}
