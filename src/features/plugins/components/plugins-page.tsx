/**
 * 中文职责说明：plugins 页面渲染插件列表、启停和配置查看，不直接拼 IPC。
 */
import { useState } from "react";
import { Puzzle, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  envelopeData,
  readArray,
  readBoolean,
  readString,
} from "@/features/_shared/evidence-data";
import {
  EvidencePageHeader,
  MetricCard,
  QueryPanel,
  RecordList,
  RecordSummary,
} from "@/features/_shared/evidence-panels";
import { usePluginsModule } from "../hooks";

export function PluginsPage() {
  const { t } = useTranslation();
  const [configPluginId, setConfigPluginId] = useState<string | null>(null);
  const module = usePluginsModule();
  const payload = envelopeData(module.pluginsQuery.data);
  const plugins = readArray(payload, ["items", "plugins", "data.items"]);
  const enabledCount = plugins.filter((plugin) =>
    readBoolean(plugin, ["enabled", "active"]),
  ).length;

  const openConfig = async (id: string) => {
    setConfigPluginId(id);
    await module.loadConfigMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-5">
      <EvidencePageHeader
        titleKey="nav.plugins"
        descriptionKey="plugins.description"
        actions={[module.refreshAction]}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          labelKey="plugins.total"
          value={
            <span className="inline-flex items-center gap-2">
              <Puzzle className="h-4 w-4 text-muted-foreground" />
              {plugins.length}
            </span>
          }
        />
        <MetricCard labelKey="plugins.enabledCount" value={enabledCount} />
        <MetricCard
          labelKey="plugins.disabledCount"
          value={Math.max(plugins.length - enabledCount, 0)}
        />
      </div>

      <QueryPanel titleKey="plugins.list" state={module.pluginsQuery}>
        <RecordList
          items={plugins}
          emptyKey="plugins.empty"
          renderItem={(plugin) => {
            const id = readString(plugin, ["id", "name", "key"], "");
            const enabled = readBoolean(plugin, ["enabled", "active"]);
            return (
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {readString(plugin, ["title", "name", "id"], t("plugins.unknown"))}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {readString(plugin, ["description", "summary", "path"], "")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Switch
                    checked={enabled}
                    disabled={!id || module.togglePluginMutation.isPending}
                    onCheckedChange={(checked) =>
                      module.togglePluginMutation.mutate({ id, enabled: checked })
                    }
                  />
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    disabled={!id || module.loadConfigMutation.isPending}
                    onClick={() => void openConfig(id)}
                    aria-label={t("plugins.config")}
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          }}
        />
      </QueryPanel>

      <Dialog open={configPluginId !== null} onOpenChange={(open) => !open && setConfigPluginId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("plugins.config")}</DialogTitle>
          </DialogHeader>
          <RecordSummary value={envelopeData(module.loadConfigMutation.data)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
