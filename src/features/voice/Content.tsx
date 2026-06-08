import { DumpedContractBoundary } from "@/features/_shared/boundary";
import { MicOff } from "lucide-react";
import { DUMPED_VOICE_COMMANDS } from "./contract";

export function VoiceContent() {
  return (
    <section className="space-y-5">
      <DumpedContractBoundary moduleId="voice" commands={DUMPED_VOICE_COMMANDS} />
      <div
        className="rounded-[8px] border border-dashed border-border bg-muted/20 p-6"
        data-skeleton-title="skeletonTitle"
      >
        <div className="flex items-start gap-3">
          <MicOff className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0" />
        </div>
      </div>
    </section>
  );
}
