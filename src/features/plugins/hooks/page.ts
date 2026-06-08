import {
  countEnabledPlugins,
  selectPluginEnvelopeData,
  selectPluginRecords,
} from "../utils";
import type { PluginsPageController } from "../types";
import { usePluginsToggleMutation } from "./mutation";
import { usePluginsListQuery } from "./query";
import { usePluginsRefreshMutation } from "./refresh";

export function usePluginsPageController(): PluginsPageController {
  const pluginsQuery = usePluginsListQuery();
  const refreshMutation = usePluginsRefreshMutation();
  const togglePluginMutation = usePluginsToggleMutation();
  const payload = selectPluginEnvelopeData(pluginsQuery.data);
  const plugins = selectPluginRecords(payload);
  const enabledCount = countEnabledPlugins(plugins);

  return {
    plugins,
    enabledCount,
    pluginsQuery,
    refreshAction: {
      id: "refresh-contract",
      labelKey: "common.refresh",
      run: () => refreshMutation.mutateAsync(),
      isPending: refreshMutation.isPending,
    },
    togglePlugin: {
      isPending: togglePluginMutation.isPending,
      run: (id: string, enabled: boolean) =>
        togglePluginMutation.mutate({ id, enabled }),
    },
  };
}
