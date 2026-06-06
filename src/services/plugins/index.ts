import {
  invokeIpc,
  type IpcEvidencePayload,
  type IpcJsonValue,
} from "@/contracts/ipc";
import type { CoreEnvelope } from "@/types";

export type PluginsPayload = IpcEvidencePayload;
export type PluginJsonValue = IpcJsonValue;
export type PluginSettingsPayload = IpcJsonValue;
export type PluginsEnvelope = CoreEnvelope<PluginsPayload>;

export const pluginsService = {
  list: () => invokeIpc<PluginsEnvelope>("list_plugins"),

  toggle: (id: string, enabled: boolean) =>
    invokeIpc<PluginsEnvelope>("toggle_plugin", { id, enabled }),

  getConfig: (id: string) =>
    invokeIpc<PluginsEnvelope>("get_plugin_config", { id }),

  updateConfig: (id: string, settings: PluginSettingsPayload) =>
    invokeIpc<PluginsEnvelope>("update_plugin_config", { id, settings }),
};
