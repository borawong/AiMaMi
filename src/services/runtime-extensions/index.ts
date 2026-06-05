/*
Restoration tier: P1
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-command-set.json; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-contracts.jsonl
Frontend module: services/runtime-extensions
This file is a structured reconstruction scaffold, not recovered original source.
*/
import { invokeIpc } from "@/contracts/ipc";
import type { CoreEnvelope } from "@/types";

export const runtimeExtensionsService = {
  listPlugins: () => invokeIpc<CoreEnvelope<unknown>>("list_plugins"),

  togglePlugin: (id: string, enabled: boolean) =>
    invokeIpc<CoreEnvelope<unknown>>("toggle_plugin", { id, enabled }),

  getPluginConfig: (id: string) =>
    invokeIpc<CoreEnvelope<unknown>>("get_plugin_config", { id }),

  updatePluginConfig: (id: string, settings: unknown) =>
    invokeIpc<CoreEnvelope<unknown>>("update_plugin_config", {
      id,
      settings,
    }),
};
