import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { IpcJsonValue } from "@/contracts/ipc";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { runtimeExtensionsService } from "@/services/runtime-extensions";
import { PluginsCache } from "../cache";

export function usePluginsCacheController() {
  return useModuleCacheController(PluginsCache);
}

export function usePluginsModule() {
  const queryClient = useQueryClient();

  const pluginsQuery = useQuery({
    queryKey: [...PluginsCache.queryKeys.root, "list"],
    queryFn: () => runtimeExtensionsService.listPlugins(),
    staleTime: 30_000,
  });

  const refreshMutation = useMutation({
    mutationFn: () => runtimeExtensionsService.listPlugins(),
    onSuccess: (payload) => {
      PluginsCache.writeAuthoritativePayload(queryClient, {
        payload,
        source: "mutation-payload",
        sequence: Date.now(),
        receivedAt: Date.now(),
      });
      void PluginsCache.invalidateContractQueries(queryClient);
    },
  });

  const togglePluginMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      runtimeExtensionsService.togglePlugin(id, enabled),
    onSuccess: (payload) => {
      PluginsCache.writeAuthoritativePayload(queryClient, {
        payload,
        source: "mutation-payload",
        sequence: Date.now(),
        receivedAt: Date.now(),
      });
      void PluginsCache.invalidateContractQueries(queryClient);
    },
  });

  const loadConfigMutation = useMutation({
    mutationFn: (id: string) => runtimeExtensionsService.getPluginConfig(id),
  });

  const updatePluginConfigMutation = useMutation({
    mutationFn: ({ id, settings }: { id: string; settings: IpcJsonValue }) =>
      runtimeExtensionsService.updatePluginConfig(id, settings),
    onSuccess: (payload) => {
      PluginsCache.writeAuthoritativePayload(queryClient, {
        payload,
        source: "mutation-payload",
        sequence: Date.now(),
        receivedAt: Date.now(),
      });
      void PluginsCache.invalidateContractQueries(queryClient);
    },
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
