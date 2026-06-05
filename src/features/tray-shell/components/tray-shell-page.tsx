/**
 * 中文职责说明：tray-shell 页面只展示托盘运行状态和窗口聚焦入口。
 */
import { Bell, MonitorUp } from "lucide-react";
import {
  envelopeData,
  readBoolean,
  readString,
} from "@/features/_shared/evidence-data";
import {
  BoolBadge,
  EvidencePageHeader,
  MetricCard,
  QueryPanel,
  RecordSummary,
} from "@/features/_shared/evidence-panels";
import { useTrayShellModule } from "../hooks";

export function TrayShellPage() {
  const module = useTrayShellModule();
  const notification = envelopeData(module.notificationQuery.data);
  const connected = readBoolean(notification, ["connected", "enabled", "ready"]);
  const client = readString(notification, ["client", "name", "id"], "-");

  return (
    <div className="space-y-5">
      <EvidencePageHeader
        titleKey="nav.trayShell"
        descriptionKey="trayShell.description"
        actions={[module.focusAction]}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <MetricCard
          labelKey="trayShell.client"
          value={
            <span className="inline-flex min-w-0 items-center gap-2">
              <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{client}</span>
            </span>
          }
        />
        <MetricCard
          labelKey="trayShell.ready"
          value={
            <BoolBadge
              value={connected}
              trueKey="common.success"
              falseKey="common.error"
            />
          }
        />
      </div>

      <QueryPanel titleKey="trayShell.notificationClient" state={module.notificationQuery}>
        <div className="flex items-start gap-3 rounded-[8px] border border-border p-3">
          <MonitorUp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <RecordSummary value={notification} />
        </div>
      </QueryPanel>
    </div>
  );
}
