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

export interface McpOverviewController {
  serverCount: number;
  enabledCount: number;
  sourcePath: string;
  onAddServer: () => void;
  onRefresh: () => Promise<void>;
  onCopySourcePath: () => Promise<void>;
}

export interface McpServersController {
  servers: McpServerSummary[];
  pagedServers: McpServerSummary[];
  isEmpty: boolean;
  isError: boolean;
  isLoading: boolean;
  onToggleServer: (name: string, enabled: boolean) => void;
  onEditServer: (server: McpServerSummary) => void;
  onRemoveServer: (name: string) => void;
}

export interface McpPaginationController {
  currentPage: number;
  totalPages: number;
  range: McpPaginationItem[];
  onPageChange: (page: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export interface McpEditorController {
  open: boolean;
  server?: McpServerSummary;
  draft: McpServerFormDraft;
  canSave: boolean;
  requestState: McpPageRequestState;
  onFieldChange: <TField extends McpServerFormField>(
    field: TField,
    value: McpServerFormDraft[TField],
  ) => void;
  onSave: () => void;
  onClose: () => void;
}

export interface McpRemoveController {
  open: boolean;
  serverName: string | null;
  requestState: McpPageRequestState;
  onConfirm: () => void;
  onClose: () => void;
}

export interface McpPageController {
  overview: McpOverviewController;
  list: McpServersController;
  pagination: McpPaginationController;
  editor: McpEditorController;
  remover: McpRemoveController;
  requestState: McpPageRequestState;
}
