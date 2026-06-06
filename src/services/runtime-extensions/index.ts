import { invokeIpc } from "@/contracts/ipc";
import type {
  CoreEnvelope,
  RuntimeExtensionConfigPayload,
  RuntimeExtensionListPayload,
  RuntimeExtensionSettingsValue,
  RuntimeExtensionTogglePayload,
} from "@/types";

export type RuntimeExtensionSettings = RuntimeExtensionSettingsValue;
export type RuntimeExtensionListEnvelope =
  CoreEnvelope<RuntimeExtensionListPayload>;
export type RuntimeExtensionToggleEnvelope =
  CoreEnvelope<RuntimeExtensionTogglePayload>;
export type RuntimeExtensionConfigEnvelope =
  CoreEnvelope<RuntimeExtensionConfigPayload>;

export const runtimeExtensionsService = {
  listPlugins: () => invokeIpc<RuntimeExtensionListEnvelope>("list_plugins"),

  togglePlugin: (id: string, enabled: boolean) =>
    invokeIpc<RuntimeExtensionToggleEnvelope>("toggle_plugin", { id, enabled }),

  getPluginConfig: (id: string) =>
    invokeIpc<RuntimeExtensionConfigEnvelope>("get_plugin_config", { id }),

  updatePluginConfig: (id: string, settings: RuntimeExtensionSettings) =>
    invokeIpc<RuntimeExtensionConfigEnvelope>("update_plugin_config", {
      id,
      settings,
    }),
};
