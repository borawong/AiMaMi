import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type {
  RuntimeExtensionConfigPayload,
  RuntimeExtensionListPayload,
  RuntimeExtensionPluginPayload,
  RuntimeExtensionSettingsValue,
  RuntimeExtensionTogglePayload,
} from "@/types";
import type {
  PluginsConfigEnvelope as ServicePluginsConfigEnvelope,
  PluginsListEnvelope as ServicePluginsListEnvelope,
  PluginsMutationEnvelope as ServicePluginsMutationEnvelope,
  PluginsToggleEnvelope as ServicePluginsToggleEnvelope,
} from "@/services/plugins";

export type PluginsModuleId = "plugins";
export type PluginsIpcPayload =
  | RuntimeExtensionListPayload
  | RuntimeExtensionTogglePayload
  | RuntimeExtensionConfigPayload;
export type PluginsCachePayload =
  | PluginsListEnvelope
  | PluginsToggleEnvelope
  | PluginsConfigEnvelope;
export type PluginsPluginRecord = RuntimeExtensionPluginPayload;
export type PluginsSettingsValue = RuntimeExtensionSettingsValue;
export type PluginsListEnvelope = ServicePluginsListEnvelope;
export type PluginsToggleEnvelope = ServicePluginsToggleEnvelope;
export type PluginsConfigEnvelope = ServicePluginsConfigEnvelope;
export type PluginsMutationEnvelope = ServicePluginsMutationEnvelope;
export type PluginsCacheEnvelope<TPayload = PluginsCachePayload> =
  ModuleCacheEnvelope<TPayload>;

export interface PluginsQueryViewState {
  isLoading: boolean;
  isFetching: boolean;
}

export interface PluginsPageAction {
  id: string;
  labelKey: string;
  run: () => Promise<unknown> | unknown;
  isPending?: boolean;
}

export interface PluginsTogglePluginAction {
  isPending: boolean;
  run: (id: string, enabled: boolean) => void;
}

export interface PluginsPageController {
  plugins: PluginsPluginRecord[];
  enabledCount: number;
  pluginsQuery: PluginsQueryViewState;
  refreshAction: PluginsPageAction;
  togglePlugin: PluginsTogglePluginAction;
}

export interface PluginsPagePanelProps {
  controller: PluginsPageController;
}
