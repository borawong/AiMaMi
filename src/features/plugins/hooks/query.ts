import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/controller";
import { pluginsService } from "@/services/plugins";
import {
  nextPluginsCacheSequence,
  PluginsCache,
  PLUGINS_LIST_QUERY_KEY,
  writePluginsListQueryPayload,
} from "../cache";
import type { PluginsListEnvelope } from "../types";

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
