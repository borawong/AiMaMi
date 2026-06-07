import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pluginsService } from "@/services/plugins";
import {
  optimisticallyUpdatePluginsToggle,
  rollbackPluginsToggle,
  writePluginsMutationPayload,
  type PluginsToggleCacheContext,
} from "../cache";
import type { PluginsToggleEnvelope } from "../types";

interface PluginsToggleInput {
  id: string;
  enabled: boolean;
}

export function usePluginsToggleMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    PluginsToggleEnvelope,
    Error,
    PluginsToggleInput,
    PluginsToggleCacheContext
  >({
    mutationFn: ({ id, enabled }) => pluginsService.toggle(id, enabled),
    onMutate: ({ id, enabled }) =>
      optimisticallyUpdatePluginsToggle(queryClient, id, enabled),
    onError: (_error, _variables, context) => {
      rollbackPluginsToggle(queryClient, context);
    },
    onSuccess: (payload, _variables, context) =>
      writePluginsMutationPayload(queryClient, payload, context),
  });
}
