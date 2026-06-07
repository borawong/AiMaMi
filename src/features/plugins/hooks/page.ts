import { useCallback, useEffect, useMemo, useState } from "react";
import {
  countEnabledPlugins,
  formatJsonDraft,
  selectPluginEnvelopeData,
  selectPluginRecords,
} from "../utils";
import type { PluginSettingsDraft, PluginsPageController } from "../types";
import {
  usePluginsConfigMutation,
  usePluginsToggleMutation,
} from "./mutation";
import { usePluginConfigQuery, usePluginsListQuery } from "./query";
import { usePluginsRefreshMutation } from "./refresh";

export function usePluginsPageController(): PluginsPageController {
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null);
  const [configDraft, setConfigDraftState] = useState("");
  const [configDraftPluginId, setConfigDraftPluginId] = useState<string | null>(null);
  const [configDraftDirty, setConfigDraftDirty] = useState(false);
  const [configErrorKey, setConfigErrorKey] = useState<string | null>(null);
  const pluginsQuery = usePluginsListQuery();
  const refreshMutation = usePluginsRefreshMutation();
  const togglePluginMutation = usePluginsToggleMutation();
  const configMutation = usePluginsConfigMutation();
  const payload = selectPluginEnvelopeData(pluginsQuery.data);
  const plugins = selectPluginRecords(payload);
  const enabledCount = countEnabledPlugins(plugins);
  const selectedPlugin = useMemo(
    () =>
      plugins.find((plugin) => plugin.id && plugin.id === selectedPluginId) ??
      plugins.find((plugin) => Boolean(plugin.id)) ??
      null,
    [plugins, selectedPluginId],
  );
  const effectiveSelectedPluginId = selectedPlugin?.id ?? null;
  const configQuery = usePluginConfigQuery(effectiveSelectedPluginId);

  useEffect(() => {
    if (selectedPluginId !== effectiveSelectedPluginId) {
      setSelectedPluginId(effectiveSelectedPluginId);
    }
  }, [effectiveSelectedPluginId, selectedPluginId]);

  useEffect(() => {
    if (!effectiveSelectedPluginId) {
      setConfigDraftState("");
      setConfigDraftPluginId(null);
      setConfigDraftDirty(false);
      setConfigErrorKey(null);
      return;
    }

    if (configDraftPluginId !== effectiveSelectedPluginId) {
      setConfigDraftState("");
      setConfigDraftPluginId(effectiveSelectedPluginId);
      setConfigDraftDirty(false);
      setConfigErrorKey(null);
    }
  }, [configDraftPluginId, effectiveSelectedPluginId]);

  useEffect(() => {
    if (!configQuery.data || !effectiveSelectedPluginId) return;
    if (configQuery.data.data.id !== effectiveSelectedPluginId) return;
    if (
      configDraftDirty &&
      configDraftPluginId === effectiveSelectedPluginId
    ) {
      return;
    }

    setConfigDraftState(formatJsonDraft(configQuery.data.data.settings));
    setConfigDraftPluginId(effectiveSelectedPluginId);
    setConfigDraftDirty(false);
    setConfigErrorKey(null);
  }, [
    configDraftDirty,
    configDraftPluginId,
    configQuery.data,
    effectiveSelectedPluginId,
  ]);

  const selectPlugin = useCallback((id: string) => {
    if (!id) return;
    setSelectedPluginId(id);
    setConfigErrorKey(null);
  }, []);

  const setConfigDraft = useCallback((value: string) => {
    setConfigDraftState(value);
    setConfigDraftDirty(true);
    setConfigErrorKey(null);
  }, []);

  const saveConfig = useCallback(async () => {
    if (!effectiveSelectedPluginId) return;

    let settings: PluginSettingsDraft;
    try {
      settings = JSON.parse(configDraft) as PluginSettingsDraft;
    } catch {
      setConfigErrorKey("plugins.configJsonInvalid");
      return;
    }

    setConfigErrorKey(null);
    try {
      const result = await configMutation.mutateAsync({
        id: effectiveSelectedPluginId,
        settings,
      });
      setConfigDraftState(formatJsonDraft(result.data.settings));
      setConfigDraftPluginId(effectiveSelectedPluginId);
      setConfigDraftDirty(false);
    } catch {
      setConfigErrorKey("plugins.configSaveFailed");
    }
  }, [configDraft, configMutation, effectiveSelectedPluginId]);

  return {
    plugins,
    enabledCount,
    pluginsQuery,
    refreshAction: {
      id: "refresh-contract",
      labelKey: "plugins.refreshContract",
      run: () => refreshMutation.mutateAsync(),
      isPending: refreshMutation.isPending,
    },
    togglePlugin: {
      isPending: togglePluginMutation.isPending,
      run: (id: string, enabled: boolean) =>
        togglePluginMutation.mutate({ id, enabled }),
    },
    config: {
      selectedPluginId: effectiveSelectedPluginId,
      selectedPlugin,
      configQuery: {
        isLoading: configQuery.isLoading,
        isFetching: configQuery.isFetching,
        isError: configQuery.isError,
      },
      configDraft,
      configErrorKey,
      canSaveConfig:
        Boolean(effectiveSelectedPluginId) &&
        !configMutation.isPending &&
        !configQuery.isLoading &&
        !configQuery.isError,
      selectPlugin,
      setConfigDraft,
      saveConfig: {
        isPending: configMutation.isPending,
        run: saveConfig,
      },
    },
  };
}
