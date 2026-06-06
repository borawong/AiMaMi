import { invokeIpc } from "@/contracts/ipc";
import type { IpcArgValue } from "@/contracts/ipc";
import type {
  CoreEnvelope,
  McpServerConfigInput,
  McpServerListPayload,
  McpServerMutationPayload,
  McpServerRemovePayload,
  McpTransport,
} from "@/types";

export interface UpsertMcpServerInput {
  name: string;
  transport: McpTransport;
  enabled?: boolean;
  config?: McpServerConfigInput | null;
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
    invokeIpc<CoreEnvelope<McpServerMutationPayload>>(
      "upsert_mcp_server",
      toMcpUpsertArgs(input),
    ),

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

type McpInvokeArgs = Record<string, IpcArgValue>;

function toMcpUpsertArgs(input: UpsertMcpServerInput): McpInvokeArgs {
  return {
    ...input,
    name: input.name,
    config: toMcpConfigArgs(input.config),
    transport: input.transport,
    enabled: input.enabled,
    command: input.command,
    args: input.args ?? [],
    url: input.url,
    headers: input.headers ?? {},
    environment: input.environment ?? {},
  };
}

function toMcpConfigArgs(
  config: McpServerConfigInput | null | undefined,
): McpInvokeArgs | null | undefined {
  if (!config) return config;
  return {
    name: config.name,
    transport: config.transport,
    enabled: config.enabled,
    command: config.command,
    args: config.args ?? [],
    url: config.url,
    headers: config.headers ?? {},
    environment: config.environment ?? {},
  };
}
