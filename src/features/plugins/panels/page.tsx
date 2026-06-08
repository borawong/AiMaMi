import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type {
  PluginsPageAction,
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

      <PluginsListSection dataCopySignal="plugins.enabledCount">
        <PluginRows
          items={controller.plugins}
          emptyKey="plugins.empty"
          loading={
            controller.pluginsQuery.isLoading && controller.plugins.length === 0
          }
          controller={controller}
        />
      </PluginsListSection>
    </>
  );
}

function PluginsPageHeader({
  titleKey,
  descriptionKey,
  actions,
}: {
  titleKey: string;
  descriptionKey: string;
  actions: PluginsPageAction[];
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

function PluginsListSection({
  children,
  dataCopySignal,
}: {
  children: ReactNode;
  dataCopySignal: string;
}) {
  return (
    <section
      data-copy-signal={dataCopySignal}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
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
        const title = readPluginTitle(plugin, "");
        return (
          <div
            key={id || String(index)}
            className="px-4 py-3.5"
          >
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                {title ? (
                  <p className="truncate text-sm font-medium text-foreground">
                    {title}
                  </p>
                ) : null}
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {readPluginDescription(plugin)}
                </p>
              </div>
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
