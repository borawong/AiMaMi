/*
Restoration tier: P1
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-command-set.json; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-contracts.jsonl
Frontend module: services/mcp
This file is a structured reconstruction scaffold, not recovered original source.
*/
import { invokeIpc } from "@/contracts/ipc";
import type {
  CoreEnvelope,
  McpServerListPayload,
  McpServerMutationPayload,
  McpServerRemovePayload,
  McpTransport,
} from "@/types";

export interface UpsertMcpServerInput {
  name: string;
  transport: McpTransport;
  enabled?: boolean;
  command?: string | null;
  args?: string[];
  url?: string | null;
  headers?: Record<string, string>;
  environment?: Record<string, string>;
}

export const mcpService = {
  loadServers: () =>
    invokeIpc<CoreEnvelope<McpServerListPayload>>("load_mcp_servers"),

  upsertServer: (input: UpsertMcpServerInput) =>
    invokeIpc<CoreEnvelope<McpServerMutationPayload>>("upsert_mcp_server", {
      ...input,
      args: input.args ?? [],
      headers: input.headers ?? {},
      environment: input.environment ?? {},
    }),

  setServerEnabled: (name: string, enabled: boolean) =>
    invokeIpc<CoreEnvelope<McpServerMutationPayload>>(
      "set_mcp_server_enabled",
      { name, enabled },
    ),

  removeServer: (name: string) =>
    invokeIpc<CoreEnvelope<McpServerRemovePayload>>("remove_mcp_server", {
      name,
    }),
};
