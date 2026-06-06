/**
 * 中文职责说明：mcp 模块 hook 拥有 full refresh、active-only refresh、abort 和 replay 防护入口。
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/toast";
import { useBusyAction } from "@/hooks/busy";
import { useModuleCacheController } from "@/features/_shared/controller";
import { mcpService, type UpsertMcpServerInput } from "@/services/mcp";
import type {
  CoreEnvelope,
  McpServerListPayload,
  McpServerSummary,
} from "@/types";
import {
  invalidateMcpContractQueries,
  McpCache,
  MCP_SERVERS_QUERY_KEY,
} from "../cache";
import type {
  McpEditingTarget,
  McpPageRequestState,
  McpServerFormDraft,
  McpServerFormField,
} from "../types";
import {
  buildMcpServerInput,
  createMcpServerFormDraft,
  getMcpPagination,
} from "../utils";

export type { UpsertMcpServerInput } from "@/services/mcp";

let mcpCacheSequence = 0;
let mcpLatestAcceptedSequence = 0;

function nextMcpCacheSequence() {
  mcpCacheSequence += 1;
  return mcpCacheSequence;
}

function writeMcpCachePayload<TPayload>(
  queryClient: QueryClient,
  payload: TPayload,
  source: "full-refresh" | "mutation-payload",
  sequence: number,
) {
  if (sequence < mcpLatestAcceptedSequence) {
    return false;
  }

  mcpLatestAcceptedSequence = sequence;
  McpCache.writeAuthoritativePayload(queryClient, {
    payload,
    source,
    sequence,
    receivedAt: Date.now(),
  });
  return true;
}

async function writeMcpMutationPayload<TPayload>(
  queryClient: QueryClient,
  payload: TPayload,
) {
  const accepted = writeMcpCachePayload(
    queryClient,
    payload,
    "mutation-payload",
    nextMcpCacheSequence(),
  );
  if (!accepted) return;

  writeMcpServersMutationPayload(queryClient, payload);
  await invalidateMcpContractQueries(queryClient);
}

export function useMcpCacheController() {
  return useModuleCacheController(McpCache);
}

export function useMcpServers() {
  const queryClient = useQueryClient();

  const serversQuery = useQuery({
    queryKey: MCP_SERVERS_QUERY_KEY,
    queryFn: async () => {
      const sequence = nextMcpCacheSequence();
      const payload = await mcpService.loadServers();
      const accepted = writeMcpCachePayload(
        queryClient,
        payload,
        "full-refresh",
        sequence,
      );
      if (!accepted) {
        return queryClient.getQueryData<typeof payload>(MCP_SERVERS_QUERY_KEY) ?? payload;
      }
      return payload;
    },
    staleTime: Infinity,
  });

  const refresh = useCallback(
    () => invalidateMcpContractQueries(queryClient),
    [queryClient],
  );

  return {
    ...serversQuery,
    refresh,
  };
}

export function useMcpServerMutations(options?: { onRemoved?: () => void }) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: ({ name, enabled }: { name: string; enabled: boolean }) =>
      mcpService.setServerEnabled(name, enabled),
    onMutate: () =>
      queryClient.cancelQueries({ queryKey: MCP_SERVERS_QUERY_KEY }),
    onSuccess: (payload) => writeMcpMutationPayload(queryClient, payload),
  });

  const removeMutation = useMutation({
    mutationFn: (name: string) => mcpService.removeServer(name),
    onMutate: () =>
      queryClient.cancelQueries({ queryKey: MCP_SERVERS_QUERY_KEY }),
    onSuccess: async (payload) => {
      await writeMcpMutationPayload(queryClient, payload);
      options?.onRemoved?.();
    },
  });

  return {
    toggleMutation,
    removeMutation,
  };
}

export function useUpsertMcpServerMutation(options?: { onSaved?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpsertMcpServerInput) => mcpService.upsertServer(input),
    onMutate: () =>
      queryClient.cancelQueries({ queryKey: MCP_SERVERS_QUERY_KEY }),
    onSuccess: async (payload) => {
      await writeMcpMutationPayload(queryClient, payload);
      options?.onSaved?.();
    },
  });
}

// 中文职责说明：页面 controller owning mcp 页面短生命周期 UI 状态、表单草稿和请求派发。
export function useMcpPageController() {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<McpEditingTarget>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formDraft, setFormDraft] = useState<McpServerFormDraft>(() =>
    createMcpServerFormDraft(),
  );

  const refreshAction = useBusyAction({ minVisibleMs: 800 });
  const { data, refresh, isError, isLoading } = useMcpServers();
  const { toggleMutation, removeMutation } = useMcpServerMutations({
    onRemoved: () => setRemoving(null),
  });
  const upsertMutation = useUpsertMcpServerMutation({
    onSaved: () => setEditing(null),
  });

  const editingServer = editing === "new" ? undefined : editing ?? undefined;

  useEffect(() => {
    if (editing === null) return;
    setFormDraft(createMcpServerFormDraft(editingServer));
  }, [editing, editingServer]);

  const servers = data?.data.items ?? [];
  const sourcePath = data?.data.sourcePath ?? "";
  const pagination = useMemo(
    () => getMcpPagination(servers, currentPage),
    [servers, currentPage],
  );

  useEffect(() => {
    if (currentPage !== pagination.safePage) {
      setCurrentPage(pagination.safePage);
    }
  }, [currentPage, pagination.safePage]);

  const enabledCount = useMemo(
    () => servers.filter((server) => server.enabled).length,
    [servers],
  );

  const requestState = useMemo<McpPageRequestState>(() => ({
    refresh: refreshAction.busy,
    save: upsertMutation.isPending,
    remove: removeMutation.isPending,
    toggle: toggleMutation.isPending,
    test: false,
    import: false,
    export: false,
  }), [
    refreshAction.busy,
    removeMutation.isPending,
    toggleMutation.isPending,
    upsertMutation.isPending,
  ]);

  const openNewServerDialog = useCallback(() => {
    setEditing("new");
  }, []);

  const openEditServerDialog = useCallback((server: McpServerSummary) => {
    setEditing(server);
  }, []);

  const closeEditorDialog = useCallback(() => {
    setEditing(null);
  }, []);

  const openRemoveDialog = useCallback((name: string) => {
    setRemoving(name);
  }, []);

  const closeRemoveDialog = useCallback(() => {
    setRemoving(null);
  }, []);

  const setFormField = useCallback(
    <TField extends McpServerFormField>(
      field: TField,
      value: McpServerFormDraft[TField],
    ) => {
      setFormDraft((draft) => ({
        ...draft,
        [field]: value,
      }));
    },
    [],
  );

  const refreshServers = useCallback(async () => {
    await refreshAction.run(async () => {
      await refresh();
    });
  }, [refresh, refreshAction]);

  const copySourcePath = useCallback(async () => {
    if (!sourcePath) return;

    await navigator.clipboard.writeText(sourcePath);
    toast({
      title: t("mcp.pathCopied"),
      description: t("mcp.pathCopiedDesc"),
      variant: "default",
    });
  }, [sourcePath, t]);

  const saveServer = useCallback(() => {
    upsertMutation.mutate(buildMcpServerInput(formDraft));
  }, [formDraft, upsertMutation]);

  const confirmRemoveServer = useCallback(() => {
    if (!removing) return;
    removeMutation.mutate(removing);
  }, [removeMutation, removing]);

  const toggleServerEnabled = useCallback((name: string, enabled: boolean) => {
    toggleMutation.mutate({ name, enabled });
  }, [toggleMutation]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage((page) => Math.max(1, page - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((page) => Math.min(pagination.totalPages, page + 1));
  }, [pagination.totalPages]);

  return {
    overview: {
      serverCount: servers.length,
      enabledCount,
      sourcePath,
      onAddServer: openNewServerDialog,
      onRefresh: refreshServers,
      onCopySourcePath: copySourcePath,
    },
    list: {
      servers,
      pagedServers: pagination.pagedItems,
      isEmpty: servers.length === 0,
      isError,
      isLoading,
      onToggleServer: toggleServerEnabled,
      onEditServer: openEditServerDialog,
      onRemoveServer: openRemoveDialog,
    },
    pagination: {
      currentPage: pagination.safePage,
      totalPages: pagination.totalPages,
      range: pagination.range,
      onPageChange: goToPage,
      onPreviousPage: goToPreviousPage,
      onNextPage: goToNextPage,
    },
    editor: {
      open: editing !== null,
      server: editingServer,
      draft: formDraft,
      canSave: Boolean(formDraft.name) && !requestState.save,
      requestState,
      onFieldChange: setFormField,
      onSave: saveServer,
      onClose: closeEditorDialog,
    },
    remover: {
      open: removing !== null,
      serverName: removing,
      requestState,
      onConfirm: confirmRemoveServer,
      onClose: closeRemoveDialog,
    },
    requestState,
  };
}

function writeMcpServersMutationPayload(queryClient: QueryClient, payload: unknown) {
  const data = readEnvelopeData(payload);
  if (!isRecord(data)) return;

  queryClient.setQueryData<CoreEnvelope<McpServerListPayload>>(
    MCP_SERVERS_QUERY_KEY,
    (current) => {
      if (!isMcpListEnvelope(current)) return current;

      const server = data.server;
      if (isMcpServerSummary(server)) {
        const items = upsertByName(current.data.items, server);
        return {
          ...current,
          data: {
            ...current.data,
            items,
            total: readNumber(data.total) ?? items.length,
            sourcePath: readString(data.sourcePath) ?? current.data.sourcePath,
          },
        };
      }

      const removedName = readString(data.removedName);
      if (removedName) {
        const items = current.data.items.filter((item) => item.name !== removedName);
        return {
          ...current,
          data: {
            ...current.data,
            items,
            total: readNumber(data.total) ?? items.length,
            sourcePath: readString(data.sourcePath) ?? current.data.sourcePath,
          },
        };
      }

      return current;
    },
  );
}

function upsertByName(items: McpServerSummary[], server: McpServerSummary) {
  const index = items.findIndex((item) => item.name === server.name);
  if (index === -1) return [...items, server];
  return items.map((item, itemIndex) => (itemIndex === index ? server : item));
}

function readEnvelopeData(value: unknown) {
  if (isRecord(value) && "data" in value) {
    return value.data ?? null;
  }
  return null;
}

function isMcpListEnvelope(
  value: unknown,
): value is CoreEnvelope<McpServerListPayload> {
  return isRecord(value) && isRecord(value.data) && Array.isArray(value.data.items);
}

function isMcpServerSummary(value: unknown): value is McpServerSummary {
  return isRecord(value) && typeof value.name === "string";
}

function readString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function readNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
