import {
  invokeIpc,
  type IpcEvidencePayload,
  type IpcJsonValue,
} from "@/contracts/ipc";
import type { CoreEnvelope } from "@/types";

export type RuntimeExtensionPayload = IpcEvidencePayload;
export type RuntimeExtensionSettings = IpcJsonValue;
export type RuntimeExtensionEnvelope = CoreEnvelope<RuntimeExtensionPayload>;

export const runtimeExtensionsService = {
  listPlugins: () => invokeIpc<RuntimeExtensionEnvelope>("list_plugins"),

  togglePlugin: (id: string, enabled: boolean) =>
    invokeIpc<RuntimeExtensionEnvelope>("toggle_plugin", { id, enabled }),

  getPluginConfig: (id: string) =>
    invokeIpc<RuntimeExtensionEnvelope>("get_plugin_config", { id }),

  updatePluginConfig: (id: string, settings: RuntimeExtensionSettings) =>
    invokeIpc<RuntimeExtensionEnvelope>("update_plugin_config", {
      id,
      settings,
    }),
};
