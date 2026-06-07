import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pluginsService } from "@/services/plugins";
import {
  nextPluginsCacheSequence,
  writePluginsRefreshPayload,
} from "../cache";
import type { PluginsListEnvelope } from "../types";

interface PluginsRefreshResult {
  payload: PluginsListEnvelope;
  sequence: number;
}

export function usePluginsRefreshMutation() {
  const queryClient = useQueryClient();

  return useMutation<PluginsRefreshResult>({
    mutationFn: async () => {
      const sequence = nextPluginsCacheSequence();
      const payload = await pluginsService.list();
      return { payload, sequence };
    },
    onSuccess: ({ payload, sequence }) =>
      writePluginsRefreshPayload(queryClient, payload, sequence),
  });
}
