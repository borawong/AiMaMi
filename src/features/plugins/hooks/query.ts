import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/controller";
import { pluginsService } from "@/services/plugins";
import {
  nextPluginsCacheSequence,
  getPluginsConfigQueryKey,
  PluginsCache,
  PLUGINS_LIST_QUERY_KEY,
  writePluginsConfigQueryPayload,
  writePluginsListQueryPayload,
} from "../cache";
import type { PluginsConfigEnvelope, PluginsListEnvelope } from "../types";

export function usePluginsCacheController() {
  return useModuleCacheController(PluginsCache);
}

export function usePluginsListQuery() {
  const queryClient = useQueryClient();

  return useQuery<PluginsListEnvelope>({
    queryKey: PLUGINS_LIST_QUERY_KEY,
    queryFn: async () => {
      const sequence = nextPluginsCacheSequence();
      const payload = await pluginsService.list();
      return writePluginsListQueryPayload(
        queryClient,
        payload,
        sequence,
      );
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function usePluginConfigQuery(id: string | null | undefined) {
  const queryClient = useQueryClient();
  const pluginId = id ?? "";

  return useQuery<PluginsConfigEnvelope>({
    queryKey: getPluginsConfigQueryKey(pluginId),
    enabled: Boolean(id),
    queryFn: async () => {
      if (!id) {
        throw new Error("Missing plugin id");
      }

      const sequence = nextPluginsCacheSequence();
      const payload = await pluginsService.getConfig(id);
      return writePluginsConfigQueryPayload(
        queryClient,
        id,
        payload,
        sequence,
      );
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
