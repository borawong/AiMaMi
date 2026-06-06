/**
 * 中文职责说明：plugins 模块 hook 拥有 runtime-extensions dumped 命令的查询、配置读取、
 * mutation payload 写入和旧响应覆盖防护入口。
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/controller";
import {
  pluginsService,
  type PluginJsonValue,
  type PluginSettingsPayload,
  type PluginsEnvelope,
} from "@/services/plugins";
import type { PluginSettingsDraft } from "../types";
import {
  invalidatePluginsContractQueries,
  pluginConfigQueryKey,
  PluginsCache,
  PLUGINS_LIST_QUERY_KEY,
} from "../cache";
import {
  countEnabledPlugins,
  formatJsonDraft,
  selectPluginEnvelopeData,
  selectPluginRecords,
} from "../utils";

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

export function usePluginsPageController() {
  const module = usePluginsModule();
  const [configPluginId, setConfigPluginId] = useState<string | null>(null);
  const [configDraft, setConfigDraft] = useState("");
  const [configParseErrorKey, setConfigParseErrorKey] = useState<string | null>(
    null,
  );

  const payload = selectPluginEnvelopeData(module.pluginsQuery.data);
  const plugins = selectPluginRecords(payload);
  const enabledCount = countEnabledPlugins(plugins);

  const openConfig = async (id: string) => {
    setConfigPluginId(id);
    setConfigDraft("");
    setConfigParseErrorKey(null);
    module.updatePluginConfigMutation.reset();

    try {
      const response = await module.loadConfigMutation.mutateAsync(id);
      setConfigDraft(formatJsonDraft(selectPluginEnvelopeData(response)));
    } catch {
      setConfigDraft("null");
    }
  };

  const closeConfig = () => {
    setConfigPluginId(null);
    setConfigDraft("");
    setConfigParseErrorKey(null);
    module.loadConfigMutation.reset();
    module.updatePluginConfigMutation.reset();
  };

  const updateConfigDraft = (nextDraft: string) => {
    setConfigDraft(nextDraft);
    if (configParseErrorKey) setConfigParseErrorKey(null);
  };

  const resetConfigDraft = () => {
    setConfigDraft(
      formatJsonDraft(selectPluginEnvelopeData(module.loadConfigMutation.data)),
    );
    setConfigParseErrorKey(null);
    module.updatePluginConfigMutation.reset();
  };

  const saveConfig = async () => {
    if (!configPluginId) return;

    let settings: PluginSettingsDraft;
    try {
      settings = JSON.parse(configDraft) as PluginSettingsDraft;
    } catch {
      setConfigParseErrorKey("plugins.configJsonInvalid");
      return;
    }

    setConfigParseErrorKey(null);
    try {
      await module.updatePluginConfigMutation.mutateAsync({
        id: configPluginId,
        settings,
      });
    } catch {}
  };

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
    configDialog: {
      open: configPluginId !== null,
      pluginId: configPluginId,
      draft: configDraft,
      parseErrorKey: configParseErrorKey,
      summaryValue: selectPluginEnvelopeData(module.loadConfigMutation.data),
      isLoading: module.loadConfigMutation.isPending,
      isLoadError: module.loadConfigMutation.isError,
      isSaving: module.updatePluginConfigMutation.isPending,
      isSaveError: module.updatePluginConfigMutation.isError,
      canSave:
        Boolean(configPluginId) &&
        !module.loadConfigMutation.isPending &&
        !module.loadConfigMutation.isError &&
        !module.updatePluginConfigMutation.isPending,
      openForPlugin: openConfig,
      close: closeConfig,
      updateDraft: updateConfigDraft,
      resetDraft: resetConfigDraft,
      save: saveConfig,
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

function updatePluginRecord(plugin: PluginJsonValue, id: string, enabled: boolean): PluginJsonValue {
  if (!isRecord(plugin)) return plugin;
  const pluginId = readPluginId(plugin);
  if (pluginId !== id) return plugin;
  return {
    ...plugin,
    enabled,
  };
}

function readPluginId(plugin: Record<string, PluginJsonValue>) {
  for (const key of ["id", "name", "key"]) {
    const value = plugin[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return "";
}

function isRecord(value: PluginJsonValue): value is Record<string, PluginJsonValue> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
