import type { QueryClient } from "@tanstack/react-query";
import { createModuleCacheOwner } from "@/features/_shared/cache";
import type {
  PluginsCacheEnvelope,
  PluginsCachePayload,
  PluginsListEnvelope,
  PluginsToggleEnvelope,
} from "../types";

export const PluginsCache = createModuleCacheOwner<PluginsCachePayload>("plugins");
export const PluginsQueryKeys = PluginsCache.queryKeys;
export const PLUGINS_LIST_QUERY_KEY = ["plugins-list"] as const;
export const writePluginsAuthoritativePayload = (
  queryClient: QueryClient,
  envelope: Omit<PluginsCacheEnvelope, "moduleId">,
) => PluginsCache.writeAuthoritativePayload(queryClient, envelope);

export type PluginsCachePayloadSource =
  | "full-refresh"
  | "active-only-refresh"
  | "mutation-payload";

let pluginsCacheSequence = 0;
let pluginsLatestAcceptedSequence = 0;

export function nextPluginsCacheSequence() {
  pluginsCacheSequence += 1;
  return pluginsCacheSequence;
}

export function writePluginsCachePayload<TPayload extends PluginsCachePayload>(
  queryClient: QueryClient,
  payload: TPayload,
  source: PluginsCachePayloadSource,
  sequence: number,
) {
  if (sequence < pluginsLatestAcceptedSequence) {
    return false;
  }

  pluginsLatestAcceptedSequence = sequence;
  writePluginsAuthoritativePayload(queryClient, {
    payload,
    source,
    sequence,
    receivedAt: Date.now(),
  });
  return true;
}

export function writePluginsListQueryPayload(
  queryClient: QueryClient,
  payload: PluginsListEnvelope,
  sequence: number,
) {
  const accepted = writePluginsCachePayload(
    queryClient,
    payload,
    "full-refresh",
    sequence,
  );

  if (!accepted) {
    return queryClient.getQueryData<PluginsListEnvelope>(PLUGINS_LIST_QUERY_KEY) ?? payload;
  }

  return payload;
}

export async function writePluginsRefreshPayload(
  queryClient: QueryClient,
  payload: PluginsListEnvelope,
  sequence: number,
) {
  const accepted = writePluginsCachePayload(
    queryClient,
    payload,
    "full-refresh",
    sequence,
  );
  if (!accepted) return;

  queryClient.setQueryData(PLUGINS_LIST_QUERY_KEY, payload);
  await invalidatePluginsContractQueries(queryClient);
}

export interface PluginsToggleCacheContext {
  previousList?: PluginsListEnvelope;
  sequence: number;
}

export async function optimisticallyUpdatePluginsToggle(
  queryClient: QueryClient,
  id: string,
  enabled: boolean,
): Promise<PluginsToggleCacheContext> {
  await queryClient.cancelQueries({ queryKey: PLUGINS_LIST_QUERY_KEY });
  const previousList = queryClient.getQueryData<PluginsListEnvelope>(PLUGINS_LIST_QUERY_KEY);
  queryClient.setQueryData<PluginsListEnvelope>(
    PLUGINS_LIST_QUERY_KEY,
    (current) => updatePluginEnabled(current, id, enabled),
  );
  return {
    previousList,
    sequence: nextPluginsCacheSequence(),
  };
}

export function rollbackPluginsToggle(
  queryClient: QueryClient,
  context: PluginsToggleCacheContext | undefined,
) {
  if (context?.previousList) {
    queryClient.setQueryData(PLUGINS_LIST_QUERY_KEY, context.previousList);
  }
}

export async function writePluginsMutationPayload<TPayload extends PluginsCachePayload>(
  queryClient: QueryClient,
  payload: TPayload,
  context: PluginsToggleCacheContext | undefined,
) {
  const accepted = writePluginsCachePayload(
    queryClient,
    payload,
    "mutation-payload",
    context?.sequence ?? nextPluginsCacheSequence(),
  );
  if (!accepted) return;

  if (isPluginsToggleEnvelope(payload)) {
    queryClient.setQueryData(PLUGINS_LIST_QUERY_KEY, toPluginsListEnvelope(payload));
  }
  await invalidatePluginsContractQueries(queryClient);
}

export async function invalidatePluginsContractQueries(queryClient: QueryClient) {
  await Promise.all([
    PluginsCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: PLUGINS_LIST_QUERY_KEY }),
  ]);
}

function updatePluginEnabled(
  current: PluginsListEnvelope | undefined,
  id: string,
  enabled: boolean,
): PluginsListEnvelope | undefined {
  if (!current) return current;
  return {
    ...current,
    data: {
      ...current.data,
      items: current.data.items.map((plugin) =>
        plugin.id === id ? { ...plugin, enabled } : plugin,
      ),
    },
  };
}

function isPluginsToggleEnvelope(
  value: PluginsCachePayload,
): value is PluginsToggleEnvelope {
  return "plugin" in value.data && "items" in value.data;
}

function toPluginsListEnvelope(envelope: PluginsToggleEnvelope): PluginsListEnvelope {
  return {
    ...envelope,
    data: {
      backendStatus: envelope.data.backendStatus,
      items: envelope.data.items,
      total: envelope.data.total,
      sourcePath: envelope.data.sourcePath,
      lastScanAt: envelope.data.lastScanAt,
    },
  };
}
