/**
 * 中文职责说明：tray-shell 页面只展示托盘运行状态和窗口聚焦入口。
 */
import type { ReactNode } from "react";
import { Bell, MonitorUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTrayShellModule } from "../hooks";
import { envelopeData, readBoolean, readString } from "../utils";

export function TrayShellPage() {
  const { t } = useTranslation();
  const module = useTrayShellModule();
  const notification = envelopeData(module.notificationQuery.data);
  const connected = readBoolean(notification, ["connected", "enabled", "ready"]);
  const client = readString(notification, ["client", "name", "id"], "-");

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-foreground">
            {t("nav.trayShell")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("trayShell.description")}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={module.focusAction.isPending}
          onClick={() => void module.focusAction.run()}
        >
          <MonitorUp className="h-3.5 w-3.5" />
          {t("trayShell.focusMainWindow")}
        </Button>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <TrayShellMetric label={t("trayShell.client")}>
          {module.notificationQuery.isLoading ? (
            <span className="text-sm text-muted-foreground">
              {t("common.loading")}
            </span>
          ) : (
            <span className="inline-flex min-w-0 items-center gap-2">
              <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{client}</span>
            </span>
          )}
        </TrayShellMetric>
        <TrayShellMetric label={t("trayShell.ready")}>
          <Badge variant={connected ? "default" : "outline"}>
            {t(connected ? "common.success" : "common.error")}
          </Badge>
        </TrayShellMetric>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
          <h2 className="truncate text-sm font-semibold text-foreground">
            {t("trayShell.notificationClient")}
          </h2>
          {module.notificationQuery.isFetching ? (
            <span className="shrink-0 text-xs text-muted-foreground">
              {t("common.refreshing")}
            </span>
          ) : null}
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2">
          <TrayShellRuntimeRow label={t("trayShell.client")} value={client} />
          <TrayShellRuntimeRow
            label={t("trayShell.ready")}
            value={t(connected ? "common.success" : "common.error")}
          />
        </div>
      </section>
    </div>
  );
}

function TrayShellMetric({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 min-w-0 text-lg font-semibold text-foreground">
        {children}
      </div>
    </div>
  );
}

function TrayShellRuntimeRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-[8px] border border-border/60 bg-muted/30 px-3 py-2.5">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-sm font-medium text-foreground">
        {value || "-"}
      </span>
    </div>
  );
}
