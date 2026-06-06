import { invokeIpc } from "@/contracts/ipc";
import type {
  CoreEnvelope,
  RuntimeExtensionConfigPayload,
  RuntimeExtensionListPayload,
  RuntimeExtensionSettingsValue,
  RuntimeExtensionTogglePayload,
} from "@/types";

export type PluginSettingsPayload = RuntimeExtensionSettingsValue;
export type PluginsListEnvelope = CoreEnvelope<RuntimeExtensionListPayload>;
export type PluginsToggleEnvelope = CoreEnvelope<RuntimeExtensionTogglePayload>;
export type PluginsConfigEnvelope = CoreEnvelope<RuntimeExtensionConfigPayload>;
export type PluginsMutationEnvelope =
  | PluginsToggleEnvelope
  | PluginsConfigEnvelope;

export const pluginsService = {
  list: () => invokeIpc<PluginsListEnvelope>("list_plugins"),

  toggle: (id: string, enabled: boolean) =>
    invokeIpc<PluginsToggleEnvelope>("toggle_plugin", { id, enabled }),

  getConfig: (id: string) =>
    invokeIpc<PluginsConfigEnvelope>("get_plugin_config", { id }),

  updateConfig: (id: string, settings: PluginSettingsPayload) =>
    invokeIpc<PluginsConfigEnvelope>("update_plugin_config", { id, settings }),
};
