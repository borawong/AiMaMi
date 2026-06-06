import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { IpcJsonValue } from "@/contracts/ipc";
import { AccountsCache } from "@/features/accounts/cache";
import { AnalyticsCache } from "@/features/analytics/cache";
import { CustomInstructionsCache } from "@/features/custom-instructions/cache";
import { DaemonAutoswitchCache } from "@/features/daemon-autoswitch/cache";
import { MaintenanceCache } from "@/features/maintenance/cache";
import { McpCache } from "@/features/mcp/cache";
import { OverviewCache } from "@/features/overview/cache";
import { PluginsCache } from "@/features/plugins/cache";
import { RelayCache } from "@/features/relay/cache";
import { SessionsCache } from "@/features/sessions/cache";
import { SettingsCache } from "@/features/settings/cache";
import { SkillsCache } from "@/features/skills/cache";
import { TrayShellCache } from "@/features/tray-shell/cache";
import { VoiceCache } from "@/features/voice/cache";
import type { Route } from "@/types/navigation";

export type RuntimeQueryKey = QueryKey;

export type RuntimeEvent =
  | {
      type: "bootstrap:seed";
      payload: IpcJsonValue;
      sequence: number;
      receivedAt: number;
    }
  | {
      type: "module:reload";
      moduleId: Route;
      mode: "full" | "active-only";
      sequence: number;
      receivedAt: number;
    }
  | {
      type: "module:mutation-payload";
      moduleId: Route;
      payload: IpcJsonValue;
      sequence: number;
      receivedAt: number;
    };

type RuntimeEventListener = (event: RuntimeEvent) => void;

export interface RuntimeCacheEntry {
  eventType: RuntimeEvent["type"];
  payload: IpcJsonValue;
  receivedAt: number;
  sequence: number;
}

export interface RuntimeEventCursor {
  receivedAt: number;
  sequence: number;
}

export interface RuntimeEventQueryTarget {
  evidence: "module-cache-owner";
  mode: "active-only" | "full";
  queryKey: RuntimeQueryKey;
}

export const RUNTIME_EVENT_CACHE_KEYS = {
  bootstrap: ["runtime", "bootstrap"] as const,
  mutationPayload: (moduleId: Route) =>
    [moduleId, "mutation-payload"] as const,
  eventCursor: (event: RuntimeEvent) =>
    [
      "runtime",
      "event-cursor",
      event.type,
      "moduleId" in event ? event.moduleId : "global",
    ] as const,
};

// 运行时只消费模块缓存持有者提供的查询键，避免复刻模块私有裸键。
const runtimeModuleQueryKeys = (
  ...queryKeys: RuntimeQueryKey[]
): readonly RuntimeQueryKey[] => queryKeys;

export const RUNTIME_QUERY_KEYS_BY_MODULE = {
  overview: runtimeModuleQueryKeys(OverviewCache.queryKeys.root),
  accounts: runtimeModuleQueryKeys(AccountsCache.queryKeys.root),
  sessions: runtimeModuleQueryKeys(SessionsCache.queryKeys.root),
  analytics: runtimeModuleQueryKeys(AnalyticsCache.queryKeys.root),
  "custom-instructions": runtimeModuleQueryKeys(CustomInstructionsCache.queryKeys.root),
  mcp: runtimeModuleQueryKeys(McpCache.queryKeys.root),
  skills: runtimeModuleQueryKeys(SkillsCache.queryKeys.root),
  plugins: runtimeModuleQueryKeys(PluginsCache.queryKeys.root),
  relay: runtimeModuleQueryKeys(RelayCache.queryKeys.root),
  settings: runtimeModuleQueryKeys(SettingsCache.queryKeys.root),
  maintenance: runtimeModuleQueryKeys(MaintenanceCache.queryKeys.root),
  "daemon-autoswitch": runtimeModuleQueryKeys(DaemonAutoswitchCache.queryKeys.root),
  "tray-shell": runtimeModuleQueryKeys(TrayShellCache.queryKeys.root),
  voice: runtimeModuleQueryKeys(VoiceCache.queryKeys.root),
} satisfies Record<Route, readonly RuntimeQueryKey[]>;

const listeners = new Set<RuntimeEventListener>();

export function emitRuntimeEvent(event: RuntimeEvent) {
  listeners.forEach((listener) => listener(event));
}

export function subscribeRuntimeEvent(listener: RuntimeEventListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRuntimeEventQueryTargets(
  event: RuntimeEvent,
): RuntimeEventQueryTarget[] {
  if (event.type === "bootstrap:seed") {
    return [];
  }

  const mode = event.type === "module:reload" ? event.mode : "full";
  return RUNTIME_QUERY_KEYS_BY_MODULE[event.moduleId].map((queryKey) => ({
    evidence: "module-cache-owner",
    mode,
    queryKey,
  }));
}

export function applyRuntimeEventToQueryCache(
  queryClient: QueryClient,
  event: RuntimeEvent,
) {
  if (!acceptRuntimeEventSequence(queryClient, event)) {
    return;
  }

  if (event.type === "bootstrap:seed") {
    setSequencedRuntimeCache(queryClient, RUNTIME_EVENT_CACHE_KEYS.bootstrap, event);
    return;
  }

  if (event.type === "module:mutation-payload") {
    setSequencedRuntimeCache(
      queryClient,
      RUNTIME_EVENT_CACHE_KEYS.mutationPayload(event.moduleId),
      event,
    );
  }

  invalidateRuntimeTargets(queryClient, getRuntimeEventQueryTargets(event));
}

function acceptRuntimeEventSequence(
  queryClient: QueryClient,
  event: RuntimeEvent,
) {
  const cursorKey = RUNTIME_EVENT_CACHE_KEYS.eventCursor(event);
  const current = queryClient.getQueryData<RuntimeEventCursor>(cursorKey);
  if (current && event.sequence <= current.sequence) {
    return false;
  }

  queryClient.setQueryData<RuntimeEventCursor>(cursorKey, {
    receivedAt: event.receivedAt,
    sequence: event.sequence,
  });
  return true;
}

function setSequencedRuntimeCache(
  queryClient: QueryClient,
  queryKey: RuntimeQueryKey,
  event: Extract<RuntimeEvent, { payload: IpcJsonValue }>,
) {
  queryClient.setQueryData<RuntimeCacheEntry>(queryKey, (current) => {
    if (current && event.sequence <= current.sequence) {
      return current;
    }

    return {
      eventType: event.type,
      payload: event.payload,
      receivedAt: event.receivedAt,
      sequence: event.sequence,
    };
  });
}

function invalidateRuntimeTargets(
  queryClient: QueryClient,
  targets: RuntimeEventQueryTarget[],
) {
  targets.forEach((target) => {
    void queryClient.invalidateQueries({
      queryKey: target.queryKey,
      type: target.mode === "active-only" ? "active" : "all",
    });
  });
}
