import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/controller";
import {
  pluginsService,
  type PluginsListEnvelope,
  type PluginsToggleEnvelope,
} from "@/services/plugins";
import {
  invalidatePluginsContractQueries,
  PluginsCache,
  PLUGINS_LIST_QUERY_KEY,
  writePluginsAuthoritativePayload,
} from "../cache";
import {
  countEnabledPlugins,
  selectPluginEnvelopeData,
  selectPluginRecords,
} from "../utils";
import type { PluginsCachePayload } from "../types";

let pluginsCacheSequence = 0;
let pluginsLatestAcceptedSequence = 0;

function nextPluginsCacheSequence() {
  pluginsCacheSequence += 1;
  return pluginsCacheSequence;
}

function writePluginsCachePayload<TPayload extends PluginsCachePayload>(
  queryClient: QueryClient,
  payload: TPayload,
  source: "full-refresh" | "active-only-refresh" | "mutation-payload",
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

async function writePluginsMutationPayload<TPayload extends PluginsCachePayload>(
  queryClient: QueryClient,
  payload: TPayload,
) {
  const accepted = writePluginsCachePayload(
    queryClient,
    payload,
    "mutation-payload",
    nextPluginsCacheSequence(),
  );
  if (!accepted) return;

  if (isPluginsToggleEnvelope(payload)) {
    queryClient.setQueryData(PLUGINS_LIST_QUERY_KEY, toPluginsListEnvelope(payload));
  }
  await invalidatePluginsContractQueries(queryClient);
}

export function usePluginsCacheController() {
  return useModuleCacheController(PluginsCache);
}

export function usePluginsPageController() {
  const module = usePluginsModule();
  const payload = selectPluginEnvelopeData(module.pluginsQuery.data);
  const plugins = selectPluginRecords(payload);
  const enabledCount = countEnabledPlugins(plugins);

  return {
    plugins,
    enabledCount,
    pluginsQuery: module.pluginsQuery,
    refreshAction: module.refreshAction,
    togglePlugin: {
      isPending: module.togglePluginMutation.isPending,
      run: (id: string, enabled: boolean) =>
        module.togglePluginMutation.mutate({ id, enabled }),
    },
  };
}

export type PluginsPageController = ReturnType<typeof usePluginsPageController>;

export function usePluginsModule() {
  const queryClient = useQueryClient();

  const pluginsQuery = useQuery({
    queryKey: PLUGINS_LIST_QUERY_KEY,
    queryFn: async () => {
      const sequence = nextPluginsCacheSequence();
      const payload = await pluginsService.list();
      const accepted = writePluginsCachePayload(queryClient, payload, "full-refresh", sequence);
      if (!accepted) {
        return queryClient.getQueryData<PluginsListEnvelope>(PLUGINS_LIST_QUERY_KEY) ?? payload;
      }
      return payload;
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const refreshMutation = useMutation({
    mutationFn: () => pluginsService.list(),
    onSuccess: async (payload) => {
      writePluginsCachePayload(
        queryClient,
        payload,
        "full-refresh",
        nextPluginsCacheSequence(),
      );
      queryClient.setQueryData(PLUGINS_LIST_QUERY_KEY, payload);
      await invalidatePluginsContractQueries(queryClient);
    },
  });

  const togglePluginMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      pluginsService.toggle(id, enabled),
    onMutate: async ({ id, enabled }) => {
      await queryClient.cancelQueries({ queryKey: PLUGINS_LIST_QUERY_KEY });
      const previousList = queryClient.getQueryData<PluginsListEnvelope>(PLUGINS_LIST_QUERY_KEY);
      queryClient.setQueryData<PluginsListEnvelope>(
        PLUGINS_LIST_QUERY_KEY,
        (current) => updatePluginEnabled(current, id, enabled),
      );
      return { previousList };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(PLUGINS_LIST_QUERY_KEY, context.previousList);
      }
    },
    onSuccess: (payload) => writePluginsMutationPayload(queryClient, payload),
  });

  return {
    pluginsQuery,
    refreshAction: {
      id: "refresh-contract",
      labelKey: "plugins.refreshContract",
      run: () => refreshMutation.mutateAsync(),
      isPending: refreshMutation.isPending,
    },
    togglePluginMutation,
  };
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
