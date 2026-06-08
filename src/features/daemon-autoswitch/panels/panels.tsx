import { RefreshCw, ToggleLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BentoCard } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  DaemonAutoswitchPanelModel,
  DaemonAutoswitchQueryState,
} from "../types";
import { DaemonPayloadSummary } from "./payload";
import { DaemonStatusLine } from "./status";

export function DaemonAutoswitchPanels({
  panels,
}: {
  panels: DaemonAutoswitchPanelModel[];
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {panels.map((panel) => (
        <DaemonQueryPanel key={panel.id} panel={panel} />
      ))}
    </div>
  );
}

function DaemonQueryPanel({ panel }: { panel: DaemonAutoswitchPanelModel }) {
  return (
    <BentoCard className="min-w-0 rounded-[8px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <DaemonStatusLine state={panel.state} />
        </div>
        <DaemonRefreshButton state={panel.state} />
      </div>
      <div className="mt-4">
        {panel.icon === "toggle" ? (
          <div className="flex min-w-0 items-start gap-2 rounded-[8px] border border-border p-3 text-sm text-muted-foreground">
            <ToggleLeft className="mt-0.5 h-4 w-4 shrink-0" />
            <DaemonPayloadSummary value={panel.payload} />
          </div>
        ) : (
          <DaemonPayloadSummary value={panel.payload} />
        )}
      </div>
    </BentoCard>
  );
}

function DaemonRefreshButton({ state }: { state: DaemonAutoswitchQueryState }) {
  const { t } = useTranslation();
  if (!state.refetch) return null;

  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      disabled={state.isFetching}
      aria-label={t("common.refresh")}
      onClick={() => void state.refetch?.()}
    >
      <RefreshCw
        className={cn("h-3.5 w-3.5", state.isFetching && "animate-spin")}
      />
    </Button>
  );
}
