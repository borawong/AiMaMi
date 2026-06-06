/**
 * 中文职责说明：插件页面渲染插件列表、启停和结构化配置编辑，不直接拼进程通信。
 */
import { useState } from "react";
import { Puzzle, Save, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import type { PluginSettingsDraft } from "../types";

export function PluginsPage() {
  const { t } = useTranslation();
  const [configPluginId, setConfigPluginId] = useState<string | null>(null);
  const [configDraft, setConfigDraft] = useState("");
  const [configParseErrorKey, setConfigParseErrorKey] = useState<string | null>(
    null,
  );
  const module = usePluginsModule();
  const payload = envelopeData(module.pluginsQuery.data);
  const plugins = readArray(payload, ["items", "plugins", "data.items"]);
  const enabledCount = plugins.filter((plugin) =>
    readBoolean(plugin, ["enabled", "active"]),
  ).length;

  const openConfig = async (id: string) => {
    setConfigPluginId(id);
    setConfigDraft("");
    setConfigParseErrorKey(null);
    module.updatePluginConfigMutation.reset();

    try {
      const response = await module.loadConfigMutation.mutateAsync(id);
      setConfigDraft(formatJsonDraft(envelopeData(response)));
    } catch {
      setConfigDraft("null");
    }
  };

  const closeConfig = () => {
    setConfigPluginId(null);
    setConfigDraft("");
    setConfigParseErrorKey(null);
    module.loadConfigMutation.reset();
    module.updatePluginConfigMutation.reset();
  };

  const saveConfig = async () => {
    if (!configPluginId) return;

    let settings: PluginSettingsDraft;
    try {
      settings = JSON.parse(configDraft) as PluginSettingsDraft;
    } catch {
      setConfigParseErrorKey("plugins.configJsonInvalid");
      return;
    }

    setConfigParseErrorKey(null);
    try {
      await module.updatePluginConfigMutation.mutateAsync({
        id: configPluginId,
        settings,
      });
    } catch {
      // 变更状态负责用户可见失败文案。
    }
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
                    {readString(
                      plugin,
                      ["title", "name", "id"],
                      t("plugins.unknown"),
                    )}
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

      <Dialog
        open={configPluginId !== null}
        onOpenChange={(open) => !open && closeConfig()}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("plugins.config")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <RecordSummary value={envelopeData(module.loadConfigMutation.data)} />
            <div className="space-y-2">
              <label
                htmlFor="plugin-config-json"
                className="text-xs font-medium text-muted-foreground"
              >
                {t("plugins.configJson")}
              </label>
              <Textarea
                id="plugin-config-json"
                value={configDraft}
                onChange={(event) => {
                  setConfigDraft(event.target.value);
                  if (configParseErrorKey) setConfigParseErrorKey(null);
                }}
                className="min-h-[240px] font-mono text-xs leading-5"
                disabled={
                  module.loadConfigMutation.isPending ||
                  module.updatePluginConfigMutation.isPending
                }
                spellCheck={false}
              />
              {configParseErrorKey ? (
                <p className="text-xs text-destructive" role="alert">
                  {t(configParseErrorKey)}
                </p>
              ) : null}
              {module.loadConfigMutation.isError ? (
                <p className="text-xs text-destructive" role="alert">
                  {t("plugins.configLoadFailed")}
                </p>
              ) : null}
              {module.updatePluginConfigMutation.isError ? (
                <p className="text-xs text-destructive" role="alert">
                  {t("plugins.configSaveFailed")}
                </p>
              ) : null}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeConfig}>
              {t("plugins.closeConfig")}
            </Button>
            <Button
              type="button"
              disabled={
                !configPluginId ||
                module.loadConfigMutation.isPending ||
                module.loadConfigMutation.isError ||
                module.updatePluginConfigMutation.isPending
              }
              onClick={() => void saveConfig()}
            >
              <Save className="h-3.5 w-3.5" />
              {t("plugins.saveConfig")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatJsonDraft(value: unknown) {
  try {
    return JSON.stringify(value ?? null, null, 2);
  } catch {
    return "null";
  }
}
