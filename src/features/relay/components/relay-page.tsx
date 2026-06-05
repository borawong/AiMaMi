/**
 * 中文职责说明：relay 页面只渲染 provider、active、proxy 和诊断状态，不直接拼 IPC。
 */
import { Network, RadioTower, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  envelopeData,
  readArray,
  readBoolean,
  readNumber,
  readString,
} from "@/features/_shared/evidence-data";
import {
  BoolBadge,
  EvidencePageHeader,
  MetricCard,
  QueryPanel,
  RecordList,
} from "@/features/_shared/evidence-panels";
import { useRelayModule } from "../hooks";

export function RelayPage() {
  const { t } = useTranslation();
  const module = useRelayModule();
  const state = envelopeData(module.stateQuery.data);
  const active = envelopeData(module.activeQuery.data);
  const proxy = envelopeData(module.proxyQuery.data);
  const providers = readArray(state, ["providers", "items", "relayProviders"]);
  const activeProvider = readString(active, [
    "providerId",
    "activeProviderId",
    "id",
  ], t("relay.none"));
  const routerEnabled = readBoolean(state, [
    "routerEnabled",
    "codexRouterEnabled",
    "enabled",
  ]);
  const blocked = readBoolean(state, [
    "blockOfficialPassthrough",
    "passthroughBlocked",
  ]);

  return (
    <div className="space-y-5">
      <EvidencePageHeader
        titleKey="nav.relay"
        descriptionKey="relay.description"
        actions={[module.diagnosticsAction]}
      />

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard
          labelKey="relay.providerCount"
          value={
            <span className="inline-flex items-center gap-2">
              <RadioTower className="h-4 w-4 text-muted-foreground" />
              {providers.length || readNumber(state, ["total", "providerCount"])}
            </span>
          }
        />
        <MetricCard labelKey="relay.activeProvider" value={activeProvider} />
        <MetricCard
          labelKey="relay.router"
          value={
            <BoolBadge
              value={routerEnabled}
              trueKey="relay.enabled"
              falseKey="relay.disabled"
            />
          }
        />
        <MetricCard
          labelKey="relay.passthrough"
          value={
            <BoolBadge
              value={blocked}
              trueKey="relay.blocked"
              falseKey="relay.allowed"
            />
          }
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <QueryPanel titleKey="relay.state" state={module.stateQuery}>
          <RecordList
            items={providers}
            emptyKey="relay.emptyProviders"
            renderItem={(provider) => (
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {readString(provider, ["name", "id"], t("relay.unknownProvider"))}
                  </p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {readString(provider, ["baseUrl", "url", "endpoint"], "")}
                  </p>
                </div>
                <Network className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            )}
          />
        </QueryPanel>

        <QueryPanel titleKey="relay.proxyStatus" state={module.proxyQuery}>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard
              labelKey="relay.proxyReachable"
              value={
                <BoolBadge
                  value={readBoolean(proxy, ["reachable", "enabled", "ok"])}
                  trueKey="common.success"
                  falseKey="common.error"
                />
              }
            />
            <MetricCard
              labelKey="relay.proxyCode"
              value={readString(proxy, ["code", "status", "message"], t("relay.none"))}
            />
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-[8px] border border-border p-3 text-sm text-muted-foreground">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            {t("relay.proxyContract")}
          </div>
        </QueryPanel>
      </div>
    </div>
  );
}
