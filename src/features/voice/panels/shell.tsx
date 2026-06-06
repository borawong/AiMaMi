import type { VoicePageController } from "../hooks";
import { VoiceHeader } from "./header";
import { VoiceMetrics } from "./metrics";
import {
  VoiceConfigPanel,
  VoiceOverlayPanel,
  VoiceRuntimePanel,
  VoiceWorkspacePanel,
} from "./panels";

export function VoiceView({
  controller,
}: {
  controller: VoicePageController;
}) {
  return (
    <div className="space-y-5">
      <VoiceHeader header={controller.header} />
      <VoiceMetrics metrics={controller.metrics} />
      <div className="grid gap-4 2xl:grid-cols-2">
        <VoiceWorkspacePanel module={controller.module} />
        <VoiceRuntimePanel module={controller.module} />
        <VoiceConfigPanel module={controller.module} />
        <VoiceOverlayPanel module={controller.module} />
      </div>
    </div>
  );
}
