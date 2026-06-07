import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/toast";
import { useBusyAction } from "@/hooks/busy";
import type { McpServerSummary } from "@/types";
import type {
  McpEditingTarget,
  McpPageController,
  McpPageRequestState,
  McpServerFormDraft,
  McpServerFormField,
} from "../types";
import {
  buildMcpServerInput,
  createMcpServerFormDraft,
  getMcpPagination,
} from "../utils";
import {
  useMcpServerMutations,
  useUpsertMcpServerMutation,
} from "./mutation";
import { useMcpServers } from "./query";

export function useMcpPageController(): McpPageController {
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
