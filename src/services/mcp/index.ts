import { invokeIpc } from "@/contracts/ipc";
import type { IpcJsonObject } from "@/contracts/ipc";
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
  config?: IpcJsonObject | null;
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
