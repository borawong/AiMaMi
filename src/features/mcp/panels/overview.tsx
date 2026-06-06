import { useTranslation } from "react-i18next";
import { Copy, Plus, RotateCw } from "lucide-react";
import { BentoCard } from "@/components/ui/bento";
import { Button } from "@/components/ui/button";
import { ButtonBusyContent } from "@/components/ui/busy";
import type { useMcpPageController } from "../hooks";

type McpPageController = ReturnType<typeof useMcpPageController>;

interface McpOverviewPanelProps {
  overview: McpPageController["overview"];
  requestState: McpPageController["requestState"];
}

export function McpOverviewPanel({
  overview,
  requestState,
}: McpOverviewPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="max-w-md text-sm text-muted-foreground">{t("mcp.description")}</p>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={overview.onAddServer}>
            <Plus className="h-3.5 w-3.5" />
            {t("mcp.addServer")}
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={overview.onRefresh}
            disabled={requestState.refresh}
            aria-busy={requestState.refresh}
            title={requestState.refresh ? t("common.refreshing") : t("common.refresh")}
          >
            <ButtonBusyContent
              busy={requestState.refresh}
              idleIcon={<RotateCw className="h-3.5 w-3.5" />}
            />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <BentoCard compact>
          <span className="text-xs text-muted-foreground">{t("mcp.serverCount")}</span>
          <span className="mt-1 text-lg font-semibold">{overview.serverCount}</span>
        </BentoCard>
        <BentoCard compact>
          <span className="text-xs text-muted-foreground">{t("mcp.enabledCount")}</span>
          <span className="mt-1 text-lg font-semibold">{overview.enabledCount}</span>
        </BentoCard>
        <BentoCard compact>
          <span className="text-xs text-muted-foreground">{t("mcp.configFile")}</span>
          <button
            className="mt-1 flex w-full items-center gap-1.5 text-left"
            title={overview.sourcePath}
            onClick={overview.onCopySourcePath}
          >
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{overview.sourcePath}</span>
            <Copy className="h-3 w-3 shrink-0 text-muted-foreground" />
          </button>
        </BentoCard>
      </div>
    </div>
  );
}
