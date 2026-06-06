import { VoiceContent } from "../Content";
import { VoiceProvider } from "../Provider";

export function VoicePage() {
  return (
    <VoiceProvider>
      <VoiceContent />
    </VoiceProvider>
  );
}
