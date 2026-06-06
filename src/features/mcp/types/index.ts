import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type {
  CoreEnvelope,
  McpServerListPayload,
  McpServerMutationPayload,
  McpServerRemovePayload,
  McpServerSummary,
  McpTransport,
} from "@/types";

export type McpModuleId = "mcp";
export type McpListEnvelope = CoreEnvelope<McpServerListPayload>;
export type McpMutationEnvelope = CoreEnvelope<McpServerMutationPayload>;
export type McpRemoveEnvelope = CoreEnvelope<McpServerRemovePayload>;
export type McpCachePayload =
  | McpListEnvelope
  | McpMutationEnvelope
  | McpRemoveEnvelope;
export type McpCacheEnvelope<TPayload = McpCachePayload> =
  ModuleCacheEnvelope<TPayload>;

export type McpEditingTarget = McpServerSummary | "new" | null;
export type McpPaginationItem = number | "ellipsis";

export interface McpServerFormDraft {
  name: string;
  transport: McpTransport;
  command: string;
  args: string;
  url: string;
  envText: string;
  headersText: string;
}

export type McpServerFormField = keyof McpServerFormDraft;

export interface McpPageRequestState {
  refresh: boolean;
  save: boolean;
  remove: boolean;
  toggle: boolean;
  test: boolean;
  import: boolean;
  export: boolean;
}
