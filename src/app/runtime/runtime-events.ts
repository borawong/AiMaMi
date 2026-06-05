/**
 * 中文职责说明：定义 runtime 事件总线和事件到 TanStack query/cache 的集中映射，不持有 UI 状态。
 */
import type { QueryClient } from "@tanstack/react-query";
import type { IpcJsonValue } from "@/contracts/ipc";
import type { Route } from "@/types/navigation";

export type RuntimeQueryKeyPart = string | number | boolean | null;
export type RuntimeQueryKey = readonly [string, ...RuntimeQueryKeyPart[]];

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
  evidence: "raw-query-hits";
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

export const RUNTIME_QUERY_KEYS_BY_MODULE = {
  overview: [["usage-analytics"], ["mcp-servers"], ["installed-skills"]],
  accounts: [["quota-history"]],
  sessions: [["sessions"], ["usage-analytics"]],
  analytics: [
    ["usage-analytics"],
    ["session-analytics"],
    ["token-analytics"],
    ["tool-analytics"],
    ["change-analytics"],
    ["quota-history"],
  ],
  "custom-instructions": [],
  mcp: [["mcp-servers"]],
  skills: [["installed-skills"], ["skill-backups"]],
  plugins: [],
  relay: [["relay-state"]],
  settings: [["has-notch"], ["hotspot-enabled"]],
  maintenance: [["imageCompat"]],
  "daemon-autoswitch": [],
  "tray-shell": [["desktop-message"]],
  voice: [],
} as const satisfies Record<Route, readonly RuntimeQueryKey[]>;

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
    evidence: "raw-query-hits",
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
