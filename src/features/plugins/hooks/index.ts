/**
 * 中文职责说明：plugins 模块 hook 拥有 runtime-extensions dumped 命令的查询、配置读取、
 * mutation payload 写入和旧响应覆盖防护入口。
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import {
  pluginsService,
  type PluginSettingsPayload,
  type PluginsEnvelope,
} from "@/services/plugins";
import type { IpcJsonValue } from "@/contracts/ipc";
import {
  invalidatePluginsContractQueries,
  pluginConfigQueryKey,
  PluginsCache,
  PLUGINS_LIST_QUERY_KEY,
} from "../cache";

let pluginsCacheSequence = 0;
let pluginsLatestAcceptedSequence = 0;

function nextPluginsCacheSequence() {
  pluginsCacheSequence += 1;
  return pluginsCacheSequence;
}

function writePluginsCachePayload<TPayload>(
  queryClient: QueryClient,
  payload: TPayload,
  source: "full-refresh" | "active-only-refresh" | "mutation-payload",
  sequence: number,
) {
  if (sequence < pluginsLatestAcceptedSequence) {
    return false;
  }

  pluginsLatestAcceptedSequence = sequence;
  PluginsCache.writeAuthoritativePayload(queryClient, {
    payload,
    source,
    sequence,
    receivedAt: Date.now(),
  });
  return true;
}

async function writePluginsMutationPayload<TPayload>(
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

  queryClient.setQueryData(PLUGINS_LIST_QUERY_KEY, payload);
  await invalidatePluginsContractQueries(queryClient);
}

export function usePluginsCacheController() {
  return useModuleCacheController(PluginsCache);
}

export function usePluginsModule() {
  const queryClient = useQueryClient();

  const pluginsQuery = useQuery({
    queryKey: PLUGINS_LIST_QUERY_KEY,
    queryFn: async () => {
      const sequence = nextPluginsCacheSequence();
      const payload = await pluginsService.list();
      const accepted = writePluginsCachePayload(queryClient, payload, "full-refresh", sequence);
      if (!accepted) {
        return queryClient.getQueryData<typeof payload>(PLUGINS_LIST_QUERY_KEY) ?? payload;
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
      const previousList = queryClient.getQueryData<PluginsEnvelope>(PLUGINS_LIST_QUERY_KEY);
      queryClient.setQueryData<PluginsEnvelope>(
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

  const loadConfigMutation = useMutation({
    mutationFn: async (id: string) => {
      const payload = await pluginsService.getConfig(id);
      queryClient.setQueryData(pluginConfigQueryKey(id), payload);
      return payload;
    },
    onSuccess: (payload) => {
      writePluginsCachePayload(
        queryClient,
        payload,
        "active-only-refresh",
        nextPluginsCacheSequence(),
      );
    },
  });

  const updatePluginConfigMutation = useMutation({
    mutationFn: ({ id, settings }: { id: string; settings: PluginSettingsPayload }) =>
      pluginsService.updateConfig(id, settings),
    onMutate: ({ id }) =>
      queryClient.cancelQueries({ queryKey: pluginConfigQueryKey(id) }),
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
    loadConfigMutation,
    updatePluginConfigMutation,
  };
}

function updatePluginEnabled(
  current: PluginsEnvelope | undefined,
  id: string,
  enabled: boolean,
): PluginsEnvelope | undefined {
  if (!current) return current;
  if (Array.isArray(current.data)) {
    return {
      ...current,
      data: current.data.map((plugin) => updatePluginRecord(plugin, id, enabled)),
    };
  }
  if (!isRecord(current.data)) return current;

  const items = current.data.items;
  if (Array.isArray(items)) {
    return {
      ...current,
      data: {
        ...current.data,
        items: items.map((plugin) => updatePluginRecord(plugin, id, enabled)),
      },
    };
  }

  const plugins = current.data.plugins;
  if (Array.isArray(plugins)) {
    return {
      ...current,
      data: {
        ...current.data,
        plugins: plugins.map((plugin) => updatePluginRecord(plugin, id, enabled)),
      },
    };
  }

  return current;
}

function updatePluginRecord(plugin: IpcJsonValue, id: string, enabled: boolean): IpcJsonValue {
  if (!isRecord(plugin)) return plugin;
  const pluginId = readPluginId(plugin);
  if (pluginId !== id) return plugin;
  return {
    ...plugin,
    enabled,
  };
}

function readPluginId(plugin: Record<string, IpcJsonValue>) {
  for (const key of ["id", "name", "key"]) {
    const value = plugin[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return "";
}

function isRecord(value: IpcJsonValue): value is Record<string, IpcJsonValue> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
