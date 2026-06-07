import { useMutation, useQueryClient } from "@tanstack/react-query";
import { pluginsService } from "@/services/plugins";
import {
  beginPluginsConfigMutation,
  optimisticallyUpdatePluginsToggle,
  rollbackPluginsConfig,
  rollbackPluginsToggle,
  writePluginsMutationPayload,
  type PluginsConfigCacheContext,
  type PluginsToggleCacheContext,
} from "../cache";
import type {
  PluginSettingsDraft,
  PluginsConfigEnvelope,
  PluginsToggleEnvelope,
} from "../types";

interface PluginsToggleInput {
  id: string;
  enabled: boolean;
}

interface PluginsConfigInput {
  id: string;
  settings: PluginSettingsDraft;
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

export function usePluginsConfigMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    PluginsConfigEnvelope,
    Error,
    PluginsConfigInput,
    PluginsConfigCacheContext
  >({
    mutationFn: ({ id, settings }) =>
      pluginsService.updateConfig(id, settings),
    onMutate: ({ id }) => beginPluginsConfigMutation(queryClient, id),
    onError: (_error, _variables, context) => {
      rollbackPluginsConfig(queryClient, context);
    },
    onSuccess: (payload, _variables, context) =>
      writePluginsMutationPayload(queryClient, payload, context),
  });
}
