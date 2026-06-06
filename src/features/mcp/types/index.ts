/**
 * 中文职责说明：mcp types 只声明模块内 UI/controller 边界类型，不承载 IPC DTO 或业务规则。
 */
import type { ModuleCacheEnvelope } from "@/features/_shared/cache";
import type { McpServerSummary, McpTransport } from "@/types";

export type McpModuleId = "mcp";
export type McpCacheEnvelope<TPayload = unknown> = ModuleCacheEnvelope<TPayload>;

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
