import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { api } from "@/lib/api";
import { PluginsCache } from "../cache";

export function usePluginsCacheController() {
  return useModuleCacheController(PluginsCache);
}

export function usePluginsModule() {
  const queryClient = useQueryClient();

  const pluginsQuery = useQuery({
    queryKey: [...PluginsCache.queryKeys.root, "list"],
    queryFn: () => api.listPlugins(),
    staleTime: 30_000,
  });

  const refreshMutation = useMutation({
    mutationFn: () => api.listPlugins(),
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
      api.togglePlugin(id, enabled),
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
    mutationFn: (id: string) => api.getPluginConfig(id),
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
  };
}
