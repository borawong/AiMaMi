import type { ReactNode } from "react";
import { Puzzle, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  PluginsPageController,
  PluginsPagePanelProps,
  PluginsPluginRecord,
} from "../types";
import { readPluginDescription, readPluginTitle } from "../utils";

export function PluginsPagePanel({
  controller,
}: PluginsPagePanelProps) {
  return (
    <>
      <PluginsPageHeader
        titleKey="nav.plugins"
        descriptionKey="plugins.description"
        actions={[controller.refreshAction]}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <PluginMetricCard
          labelKey="plugins.total"
          value={
            <span className="inline-flex items-center gap-2">
              <Puzzle className="h-4 w-4 text-muted-foreground" />
              {controller.plugins.length}
            </span>
          }
        />
        <PluginMetricCard
          labelKey="plugins.enabledCount"
          value={controller.enabledCount}
        />
        <PluginMetricCard
          labelKey="plugins.disabledCount"
          value={Math.max(controller.plugins.length - controller.enabledCount, 0)}
        />
      </div>

      <PluginsListSection
        titleKey="plugins.list"
        state={controller.pluginsQuery}
      >
        <PluginRows
          items={controller.plugins}
          emptyKey="plugins.empty"
          loading={
            controller.pluginsQuery.isLoading && controller.plugins.length === 0
          }
          controller={controller}
        />
      </PluginsListSection>

      <PluginsConfigSection controller={controller} />
    </>
  );
}

interface PluginsHeaderAction {
  id: string;
  labelKey: string;
  run: () => Promise<unknown> | unknown;
  isPending?: boolean;
}

function PluginsPageHeader({
  titleKey,
  descriptionKey,
  actions,
}: {
  titleKey: string;
  descriptionKey: string;
  actions: PluginsHeaderAction[];
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold text-foreground">
          {t(titleKey)}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {t(descriptionKey)}
        </p>
      </div>
      {actions.length > 0 ? (
        <div className="flex shrink-0 items-center gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              type="button"
              size="sm"
              variant="outline"
              disabled={action.isPending}
              onClick={() => void action.run()}
            >
              {t(action.labelKey)}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PluginMetricCard({
  labelKey,
  value,
}: {
  labelKey: string;
  value: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="text-xs font-medium text-muted-foreground">
        {t(labelKey)}
      </div>
      <div className="mt-2 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}

function PluginsListSection({
  titleKey,
  state,
  children,
}: {
  titleKey: string;
  state: { isFetching?: boolean };
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <h2 className="truncate text-sm font-semibold text-foreground">
          {t(titleKey)}
        </h2>
        {state.isFetching ? (
          <span className="shrink-0 text-xs text-muted-foreground">
            {t("common.refreshing")}
          </span>
        ) : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function PluginRows({
  items,
  emptyKey,
  loading,
  controller,
}: {
  items: PluginsPluginRecord[];
  emptyKey: string;
  loading: boolean;
  controller: PluginsPageController;
}) {
  const { t } = useTranslation();
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border/60 bg-muted/30 py-12 text-sm text-muted-foreground">
        {t(loading ? "common.loading" : emptyKey)}
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-muted/30">
      {items.map((plugin, index) => {
        const id = plugin.id;
        const enabled = plugin.enabled;
        const selected = Boolean(id && controller.config.selectedPluginId === id);
        return (
          <div
            key={id || String(index)}
            className={cn(
              "px-4 py-3.5",
              selected && "bg-background",
            )}
          >
            <div className="flex min-w-0 items-center justify-between gap-3">
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                disabled={!id}
                aria-pressed={selected}
                onClick={() => {
                  if (id) controller.config.selectPlugin(id);
                }}
              >
                <p className="truncate text-sm font-medium text-foreground">
                  {readPluginTitle(plugin, t("plugins.unknown"))}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {readPluginDescription(plugin)}
                </p>
              </button>
              <Switch
                checked={enabled}
                disabled={!id || controller.togglePlugin.isPending}
                onCheckedChange={(checked) =>
                  id ? controller.togglePlugin.run(id, checked) : undefined
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PluginsConfigSection({
  controller,
}: {
  controller: PluginsPageController;
}) {
  const { t } = useTranslation();
  const selectedPlugin = controller.config.selectedPlugin;

  if (!selectedPlugin) {
    return null;
  }

  const state = controller.config.configQuery;
  const errorKey =
    controller.config.configErrorKey ??
    (state.isError ? "plugins.configLoadFailed" : null);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <h2 className="truncate text-sm font-semibold text-foreground">
          {t("plugins.config")}
        </h2>
        {state.isFetching ? (
          <span className="shrink-0 text-xs text-muted-foreground">
            {t("common.refreshing")}
          </span>
        ) : null}
      </div>
      <div className="space-y-3 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {readPluginTitle(selectedPlugin, t("plugins.unknown"))}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {readPluginDescription(selectedPlugin)}
          </p>
        </div>

        <label
          htmlFor="plugins-config-json"
          className="block text-xs font-medium text-muted-foreground"
        >
          {t("plugins.configJson")}
        </label>
        <Textarea
          id="plugins-config-json"
          value={controller.config.configDraft}
          placeholder={t(state.isLoading ? "common.loading" : "plugins.configJson")}
          disabled={state.isLoading || controller.config.saveConfig.isPending}
          spellCheck={false}
          className="min-h-[260px] resize-y font-mono text-xs leading-5"
          onChange={(event) =>
            controller.config.setConfigDraft(event.target.value)
          }
        />

        {errorKey ? (
          <p className="text-xs text-destructive" role="alert">
            {t(errorKey)}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            disabled={!controller.config.canSaveConfig}
            onClick={() => void controller.config.saveConfig.run()}
          >
            <Save className="h-3.5 w-3.5" />
            {t("plugins.saveConfig")}
          </Button>
        </div>
      </div>
    </section>
  );
}
