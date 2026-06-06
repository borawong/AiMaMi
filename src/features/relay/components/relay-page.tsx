/**
 * 中文职责说明：转发页面只消费钩子暴露的查询和动作边界，不直接拼进程通信、事件或服务端传输结构。
 */
import { useState } from "react";
import {
  Ban,
  Download,
  FileInput,
  FlaskConical,
  Network,
  Power,
  PowerOff,
  RadioTower,
  Save,
  ShieldAlert,
  ShieldCheck,
  ToggleRight,
  Trash2,
  Upload,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  envelopeData,
  isRecord,
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
import { cn } from "@/lib/utils";
import { useRelayModule } from "../hooks";

export function RelayPage() {
  const { t } = useTranslation();
  const module = useRelayModule();
  const [selectedProviderRowId, setSelectedProviderRowId] = useState("");
  const state = envelopeData(module.stateQuery.data);
  const active = envelopeData(module.activeQuery.data);
  const proxy = envelopeData(module.proxyQuery.data);
  const audit = envelopeData(module.auditLogQuery.data);
  const providers = readArray(state, ["providers", "items", "relayProviders"]);
  const auditItems = Array.isArray(audit)
    ? audit
    : readArray(audit, ["items", "logs", "entries", "auditLog"]);
  const providerRows = providers.map((provider, index) => {
    const commandId = readString(provider, ["id", "providerId", "key"], "");
    const displayName = readString(
      provider,
      ["name", "id", "providerId", "key"],
      t("relay.unknownProvider"),
    );
    return {
      provider,
      index,
      commandId,
      displayName,
      rowId: commandId || `${displayName}-${index}`,
    };
  });
  const activeProvider = readString(active, [
    "providerId",
    "activeProviderId",
    "id",
  ], t("relay.none"));
  const currentIde = readString(
    active,
    ["ide", "activeIde", "targetIde", "currentIde"],
    readString(state, ["ide", "activeIde", "targetIde", "currentIde"]),
  );
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
            renderItem={(_provider, index) => {
              const row = providerRows[index];
              const commandId = row?.commandId ?? "";
              const selected = row?.rowId === selectedProviderRowId;
              const endpoint = readString(row?.provider, [
                "baseUrl",
                "url",
                "endpoint",
              ]);

              return (
                <div className="flex min-w-0 items-center justify-between gap-3">
                  <button
                    type="button"
                    className={cn(
                      "min-w-0 flex-1 rounded-[8px] px-2 py-1 text-left transition-colors",
                      selected ? "bg-accent" : "hover:bg-muted",
                    )}
                    aria-pressed={selected}
                    onClick={() => setSelectedProviderRowId(row?.rowId ?? "")}
                  >
                    <p className="truncate text-sm font-medium text-foreground">
                      {row?.displayName ?? t("relay.unknownProvider")}
                    </p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {endpoint}
                    </p>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="activate_relay_provider"
                      disabled={!commandId || !currentIde || module.isAnyMutationPending}
                      onClick={() =>
                        void module.providerActions.activateProvider.run({
                          providerId: commandId,
                          ide: currentIde,
                        })
                      }
                    >
                      <Power className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="deactivate_relay_provider"
                      disabled={!commandId || !currentIde || module.isAnyMutationPending}
                      onClick={() =>
                        void module.providerActions.deactivateProvider.run({
                          providerId: commandId,
                          ide: currentIde,
                        })
                      }
                    >
                      <PowerOff className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      aria-label="test_relay_provider"
                      disabled={!commandId || module.isAnyMutationPending}
                      onClick={() =>
                        void module.providerActions.testProvider.run(commandId)
                      }
                    >
                      <FlaskConical className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      aria-label="delete_relay_provider"
                      disabled={!commandId || module.isAnyMutationPending}
                      onClick={() =>
                        void module.providerActions.deleteProvider.run(commandId)
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            }}
          />
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            {/* 新增或更新与网络测试的真实表单字段未由本轮证据补齐，先只暴露禁用边界。 */}
            <Button type="button" size="icon-sm" variant="outline" disabled aria-label="upsert_relay_provider">
              <Save className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="icon-sm" variant="outline" disabled aria-label="set_relay_provider_network">
              <Network className="h-3.5 w-3.5" />
            </Button>
            {/* 草稿测试和模型拉取只有输入结构边界，未还原草稿传输结构前不直发。 */}
            <Button type="button" size="icon-sm" variant="outline" disabled aria-label="test_relay_draft">
              <FileInput className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="icon-sm" variant="outline" disabled aria-label="fetch_relay_models_draft">
              <Download className="h-3.5 w-3.5" />
            </Button>
            {/* 导入导出证据指向文件对话，当前写入范围内不新增系统文件选择器。 */}
            <Button type="button" size="icon-sm" variant="outline" disabled aria-label="export_relay_config">
              <Upload className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="icon-sm" variant="outline" disabled aria-label="import_relay_config">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
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

        <QueryPanel titleKey="relay.router" state={module.stateQuery}>
          <div className="grid gap-3 sm:grid-cols-2">
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
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              aria-label="set_codex_router_enabled"
              disabled={module.isAnyMutationPending}
              onClick={() =>
                void module.routerActions.setCodexRouterEnabled.run({
                  enabled: !routerEnabled,
                  relaunch: true,
                })
              }
            >
              <ToggleRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              aria-label="set_block_official_passthrough"
              disabled={module.isAnyMutationPending}
              onClick={() =>
                void module.routerActions.setBlockOfficialPassthrough.run(!blocked)
              }
            >
              <Ban className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              aria-label="diagnose_codex_router"
              disabled={module.isAnyMutationPending}
              onClick={() => void module.routerActions.diagnoseCodexRouter.run()}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
            </Button>
            {/* 路由修复动作需要诊断项标识，未还原诊断列表前只保留钩子边界。 */}
          </div>
        </QueryPanel>

        <QueryPanel titleKey="relay.passthrough" state={module.auditLogQuery}>
          <RecordList
            items={auditItems}
            emptyKey="relay.none"
            renderItem={(item) => (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {readString(item, ["event", "type", "action"], t("relay.none"))}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {isRecord(item)
                    ? readString(item, ["message", "summary", "timestamp"])
                    : ""}
                </p>
              </div>
            )}
          />
        </QueryPanel>
      </div>
    </div>
  );
}
