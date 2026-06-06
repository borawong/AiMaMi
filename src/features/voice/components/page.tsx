import { useVoicePageController } from "../hooks";
import { VoiceView } from "../panels";

export function VoicePage() {
  const controller = useVoicePageController();

  return <VoiceView controller={controller} />;
}
