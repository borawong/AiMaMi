/**
 * 中文职责说明：plugins 模块 hook 拥有 runtime-extensions dumped 命令的查询、配置读取、
 * mutation payload 写入和旧响应覆盖防护入口。
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { IpcJsonValue } from "@/contracts/ipc";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { api } from "@/lib/api";
import { PluginsCache } from "../cache";

let pluginsCacheSequence = 0;

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
  PluginsCache.writeAuthoritativePayload(queryClient, {
    payload,
    source,
    sequence,
    receivedAt: Date.now(),
  });
}

async function writePluginsMutationPayload<TPayload>(
  queryClient: QueryClient,
  payload: TPayload,
) {
  writePluginsCachePayload(
    queryClient,
    payload,
    "mutation-payload",
    nextPluginsCacheSequence(),
  );
  await PluginsCache.invalidateContractQueries(queryClient);
}

export function usePluginsCacheController() {
  return useModuleCacheController(PluginsCache);
}

export function usePluginsModule() {
  const queryClient = useQueryClient();

  const pluginsQuery = useQuery({
    queryKey: [...PluginsCache.queryKeys.root, "list"],
    queryFn: async () => {
      const sequence = nextPluginsCacheSequence();
      const payload = await api.listPlugins();
      writePluginsCachePayload(queryClient, payload, "full-refresh", sequence);
      return payload;
    },
    staleTime: 30_000,
  });

  const refreshMutation = useMutation({
    mutationFn: () => api.listPlugins(),
    onSuccess: async (payload) => {
      writePluginsCachePayload(
        queryClient,
        payload,
        "full-refresh",
        nextPluginsCacheSequence(),
      );
      await PluginsCache.invalidateContractQueries(queryClient);
    },
  });

  const togglePluginMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.togglePlugin(id, enabled),
    onSuccess: (payload) => writePluginsMutationPayload(queryClient, payload),
  });

  const loadConfigMutation = useMutation({
    mutationFn: (id: string) => api.getPluginConfig(id),
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
    mutationFn: ({ id, settings }: { id: string; settings: IpcJsonValue }) =>
      api.updatePluginConfig(id, settings),
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
