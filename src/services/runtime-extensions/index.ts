import {
  invokeIpc,
  type IpcEvidencePayload,
  type IpcJsonValue,
} from "@/contracts/ipc";
import type { CoreEnvelope } from "@/types";

export const runtimeExtensionsService = {
  listPlugins: () => invokeIpc<CoreEnvelope<IpcEvidencePayload>>("list_plugins"),

  togglePlugin: (id: string, enabled: boolean) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("toggle_plugin", { id, enabled }),

  getPluginConfig: (id: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("get_plugin_config", { id }),

  updatePluginConfig: (id: string, settings: IpcJsonValue) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("update_plugin_config", {
      id,
      settings,
    }),
};
