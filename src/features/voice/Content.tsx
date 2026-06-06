import { DumpedContractBoundary } from "@/features/_shared/boundary";
import { MicOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DUMPED_VOICE_COMMANDS } from "./contract";

export function VoiceContent() {
  const { t } = useTranslation();

  return (
    <section className="space-y-5">
      <DumpedContractBoundary moduleId="voice" commands={DUMPED_VOICE_COMMANDS} />
      <div className="rounded-[8px] border border-dashed border-border bg-muted/20 p-6">
        <div className="flex items-start gap-3">
          <MicOff className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">
              {t("voice.skeletonTitle")}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {t("voice.skeletonDescription")}
            </p>
            <p className="mt-3 max-w-3xl text-xs leading-6 text-muted-foreground">
              {t("voice.skeletonBoundary")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
