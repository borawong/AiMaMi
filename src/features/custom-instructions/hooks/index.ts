import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useModuleCacheController } from "@/features/_shared/controller";
import { useBusyAction } from "@/hooks/busy";
import { toast } from "@/hooks/toast";
import {
  builtinCustomInstructionTemplates,
  mergeCustomInstructionTemplates,
  type CustomInstructionTemplate,
} from "@/lib/templates";
import {
  customInstructionsService,
  type ApplyCustomInstructionParams,
} from "@/services/custom-instructions";
import type {
  CustomInstructionPreviewPayload,
  CustomInstructionStatePayload,
} from "@/types";
import {
  CUSTOM_INSTRUCTION_STATE_QUERY_KEY,
  CUSTOM_INSTRUCTION_TEMPLATES_QUERY_KEY,
  CustomInstructionsCache,
  invalidateCustomInstructionsContractQueries,
} from "../cache";
import type {
  CustomInstructionsTab,
  CustomInstructionTemplateView,
} from "../types";

let customInstructionsCacheSequence = 0;
let customInstructionsLatestAcceptedSequence = 0;

function nextCustomInstructionsCacheSequence() {
  customInstructionsCacheSequence += 1;
  return customInstructionsCacheSequence;
}

function writeCustomInstructionsCachePayload<TPayload>(
  queryClient: QueryClient,
  payload: TPayload,
  source: "full-refresh" | "mutation-payload",
  sequence: number,
) {
  if (sequence < customInstructionsLatestAcceptedSequence) {
    return false;
  }

  customInstructionsLatestAcceptedSequence = sequence;
  CustomInstructionsCache.writeAuthoritativePayload(queryClient, {
    payload,
    source,
    sequence,
    receivedAt: Date.now(),
  });
  return true;
}

async function writeCustomInstructionsMutationPayload<TPayload>(
  queryClient: QueryClient,
  payload: TPayload,
) {
  const accepted = writeCustomInstructionsCachePayload(
    queryClient,
    payload,
    "mutation-payload",
    nextCustomInstructionsCacheSequence(),
  );
  if (!accepted) return;

  queryClient.setQueryData(CUSTOM_INSTRUCTION_STATE_QUERY_KEY, payload);
  await invalidateCustomInstructionsContractQueries(queryClient);
}

export type CustomInstructionApplyInput = ApplyCustomInstructionParams;

export function useCustomInstructionsCacheController() {
  return useModuleCacheController(CustomInstructionsCache);
}

export function useCustomInstructionQueries() {
  const queryClient = useQueryClient();

  const stateQuery = useQuery({
    queryKey: CUSTOM_INSTRUCTION_STATE_QUERY_KEY,
    queryFn: async () => {
      const sequence = nextCustomInstructionsCacheSequence();
      const payload = await customInstructionsService.loadState();
      const accepted = writeCustomInstructionsCachePayload(queryClient, payload, "full-refresh", sequence);
      if (!accepted) {
        return queryClient.getQueryData<typeof payload>(CUSTOM_INSTRUCTION_STATE_QUERY_KEY) ?? payload;
      }
      return payload;
    },
    staleTime: Infinity,
  });

  const templatesQuery = useQuery({
    queryKey: CUSTOM_INSTRUCTION_TEMPLATES_QUERY_KEY,
    queryFn: async () => mergeCustomInstructionTemplates([]),
    staleTime: Infinity,
  });

  return {
    stateQuery,
    templatesQuery,
  };
}

export function useCustomInstructionMutations(options: {
  onPreviewed: (payload: CustomInstructionPreviewPayload) => void;
  onPreviewError: (error: unknown) => void;
  onApplied: (payload: CustomInstructionStatePayload) => void;
  onApplyError: (error: unknown) => void;
  onCleared: (payload: CustomInstructionStatePayload) => void;
  onClearError: (error: unknown) => void;
  onRolledBack: (payload: CustomInstructionStatePayload) => void;
  onRollbackError: (error: unknown) => void;
}) {
  const queryClient = useQueryClient();

  const previewMutation = useMutation({
    mutationFn: (content: string) => customInstructionsService.previewApply(content),
    onSuccess: async (response) => {
      options.onPreviewed(response.data);
    },
    onError: options.onPreviewError,
  });

  const applyMutation = useMutation({
    mutationFn: (params: CustomInstructionApplyInput) =>
      customInstructionsService.apply(params),
    onMutate: () =>
      queryClient.cancelQueries({ queryKey: CUSTOM_INSTRUCTION_STATE_QUERY_KEY }),
    onSuccess: async (response) => {
      await writeCustomInstructionsMutationPayload(queryClient, response);
      options.onApplied(response.data);
    },
    onError: options.onApplyError,
  });

  const clearMutation = useMutation({
    mutationFn: () => customInstructionsService.clearBlock(),
    onMutate: () =>
      queryClient.cancelQueries({ queryKey: CUSTOM_INSTRUCTION_STATE_QUERY_KEY }),
    onSuccess: async (response) => {
      await writeCustomInstructionsMutationPayload(queryClient, response);
      options.onCleared(response.data);
    },
    onError: options.onClearError,
  });

  const rollbackMutation = useMutation({
    mutationFn: (historyId: string) =>
      customInstructionsService.rollback(historyId),
    onMutate: () =>
      queryClient.cancelQueries({ queryKey: CUSTOM_INSTRUCTION_STATE_QUERY_KEY }),
    onSuccess: async (response) => {
      await writeCustomInstructionsMutationPayload(queryClient, response);
      options.onRolledBack(response.data);
    },
    onError: options.onRollbackError,
  });

  return {
    previewMutation,
    applyMutation,
    clearMutation,
    rollbackMutation,
  };
}

export function useCustomInstructionPathActions() {
  return {
    openPath: (path: string) => customInstructionsService.openPath(path),
  };
}

export function useCustomInstructionsPageController() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<CustomInstructionsTab>("configure");
  const [draftContent, setDraftContent] = useState("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<CustomInstructionTemplate | null>(null);
  const [preview, setPreview] =
    useState<CustomInstructionPreviewPayload | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [pendingApply, setPendingApply] =
    useState<CustomInstructionApplyInput | null>(null);
  const [draftInitialized, setDraftInitialized] = useState(false);
  const refreshAction = useBusyAction({ minVisibleMs: 800 });
  const { stateQuery, templatesQuery } = useCustomInstructionQueries();
  const { openPath } = useCustomInstructionPathActions();

  const state = stateQuery.data?.data;
  const current = state?.current ?? null;

  useEffect(() => {
    if (!state || draftInitialized) return;
    setDraftContent(state.current.managedContent);
    setDraftInitialized(true);
  }, [draftInitialized, state]);

  const localApplyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of state?.history ?? []) {
      if (item.action !== "apply" || !item.templateCode) continue;
      counts.set(item.templateCode, (counts.get(item.templateCode) ?? 0) + 1);
    }
    return counts;
  }, [state?.history]);

  const templates = useMemo<CustomInstructionTemplateView[]>(() => {
    const base = templatesQuery.data ?? builtinCustomInstructionTemplates;
    return base.map((template) => ({
      ...template,
      applyCount: template.applyCount ?? localApplyCounts.get(template.code) ?? 0,
    }));
  }, [localApplyCounts, templatesQuery.data]);

  const syncAfterSuccess = useCallback(
    (payload: CustomInstructionStatePayload) => {
      setDraftContent(payload.current.managedContent);
      setSelectedTemplate(
        payload.current.lastTemplateCode
          ? templates.find((item) => item.code === payload.current.lastTemplateCode) ?? null
          : null,
      );
    },
    [templates],
  );

  const {
    previewMutation,
    applyMutation,
    clearMutation,
    rollbackMutation,
  } = useCustomInstructionMutations({
    onPreviewed: (payload) => {
      setPreview(payload);
      setPreviewOpen(true);
    },
    onPreviewError: (error) => {
      toast({
        title: t("customInstructions.previewFailed"),
        description: error instanceof Error ? error.message : t("common.toastErrorGenericDesc"),
        variant: "destructive",
      });
    },
    onApplied: (payload) => {
      syncAfterSuccess(payload);
      setPreviewOpen(false);
      setPreview(null);
      setPendingApply(null);
      toast({
        title: t("customInstructions.applySuccess"),
        description: t("customInstructions.applySuccessDesc"),
        variant: "success",
      });
    },
    onApplyError: (error) => {
      setPreviewOpen(false);
      toast({
        title: t("customInstructions.applyFailed"),
        description: error instanceof Error ? error.message : t("common.toastErrorGenericDesc"),
        variant: "destructive",
      });
    },
    onCleared: (payload) => {
      syncAfterSuccess(payload);
      setClearOpen(false);
      toast({
        title: t("customInstructions.clearSuccess"),
        description: t("customInstructions.clearSuccessDesc"),
        variant: "success",
      });
    },
    onClearError: (error) => {
      toast({
        title: t("customInstructions.clearFailed"),
        description: error instanceof Error ? error.message : t("common.toastErrorGenericDesc"),
        variant: "destructive",
      });
    },
    onRolledBack: (payload) => {
      syncAfterSuccess(payload);
      toast({
        title: t("customInstructions.rollbackSuccess"),
        description: t("customInstructions.rollbackSuccessDesc"),
        variant: "success",
      });
    },
    onRollbackError: (error) => {
      toast({
        title: t("customInstructions.rollbackFailed"),
        description: error instanceof Error ? error.message : t("common.toastErrorGenericDesc"),
        variant: "destructive",
      });
    },
  });

  const beginPreview = useCallback(
    (params: CustomInstructionApplyInput) => {
      if (current?.protectionState === "protected") return;
      setPendingApply(params);
      previewMutation.mutate(params.content);
    },
    [current?.protectionState, previewMutation],
  );

  const handleTemplateSelect = useCallback((template: CustomInstructionTemplate) => {
    setSelectedTemplate(template);
    setDraftContent(template.body);
  }, []);

  const handleTemplatePreview = useCallback(
    (template: CustomInstructionTemplate) => {
      beginPreview({
        content: template.body,
        templateCode: template.code,
        templateTitle: template.title,
        source: "one_click",
      });
    },
    [beginPreview],
  );

  const handleDraftPreview = useCallback(() => {
    beginPreview({
      content: draftContent,
      templateCode: selectedTemplate?.code,
      templateTitle: selectedTemplate?.title,
      source: selectedTemplate ? "edit_then_apply" : "manual",
    });
  }, [beginPreview, draftContent, selectedTemplate]);

  const handleRefresh = useCallback(async () => {
    await refreshAction.run(async () => {
      try {
        await Promise.all([stateQuery.refetch(), templatesQuery.refetch()]);
      } catch {
        toast({
          title: t("customInstructions.loadFailed"),
          description: t("customInstructions.loadFailedDesc"),
          variant: "destructive",
        });
      }
    });
  }, [refreshAction, stateQuery, templatesQuery, t]);

  const handlePreviewOpenChange = useCallback((open: boolean) => {
    setPreviewOpen(open);
    if (!open) {
      setPreview(null);
      setPendingApply(null);
    }
  }, []);

  const handleApplyPreview = useCallback(() => {
    if (!pendingApply) return;
    applyMutation.mutate(pendingApply);
  }, [applyMutation, pendingApply]);

  const handleClearConfirm = useCallback(() => {
    clearMutation.mutate();
  }, [clearMutation]);

  const handleResetEditor = useCallback(() => {
    setSelectedTemplate(null);
    setDraftContent(current?.managedContent ?? "");
  }, [current?.managedContent]);

  const protectedMode = current?.protectionState === "protected";
  const loadErrorVisible = stateQuery.isError || templatesQuery.isError;
  const refreshBusy =
    refreshAction.busy || stateQuery.isFetching || templatesQuery.isFetching;

  return {
    headerPanel: {
      tab,
      onTabChange: setTab,
    },
    loadErrorPanel: {
      visible: loadErrorVisible,
      refreshing: refreshBusy,
      onRefresh: handleRefresh,
    },
    bodyPanel: {
      tab,
      configure: {
        current,
        draftContent,
        history: state?.history ?? [],
        protectedMode,
        selectedTemplateTitle: selectedTemplate?.title ?? null,
        previewPending: previewMutation.isPending,
        clearPending: clearMutation.isPending,
        rollbackingId: rollbackMutation.isPending
          ? rollbackMutation.variables ?? null
          : null,
        onDraftContentChange: setDraftContent,
        onOpenGlobalPath: () => {
          if (!current) return;
          void openPath(current.globalPath);
        },
        onRestoreCurrent: () => {
          setDraftContent(current?.managedContent ?? "");
        },
        onRequestClear: () => setClearOpen(true),
        onPreviewDraft: handleDraftPreview,
        onResetEditor: handleResetEditor,
        onRollback: (historyId: string) => rollbackMutation.mutate(historyId),
      },
      templates: {
        templates,
        selectedTemplateCode: selectedTemplate?.code ?? null,
        refreshing: refreshBusy,
        onRefresh: handleRefresh,
        onSelectTemplate: handleTemplateSelect,
        onPreviewTemplate: handleTemplatePreview,
      },
    },
    previewDialog: {
      open: previewOpen,
      preview,
      applying: applyMutation.isPending,
      onOpenChange: handlePreviewOpenChange,
      onApply: handleApplyPreview,
    },
    clearDialog: {
      open: clearOpen,
      clearing: clearMutation.isPending,
      onOpenChange: setClearOpen,
      onConfirm: handleClearConfirm,
    },
  };
}

export type CustomInstructionsPageController = ReturnType<
  typeof useCustomInstructionsPageController
>;
