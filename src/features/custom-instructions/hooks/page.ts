import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useBusyAction } from "@/hooks/busy";
import { toast } from "@/hooks/toast";
import {
  builtinCustomInstructionTemplates,
  type CustomInstructionTemplate,
} from "@/lib/templates";
import type {
  CustomInstructionPreviewPayload,
  CustomInstructionStatePayload,
} from "@/types";
import type {
  CustomInstructionsPageController,
  CustomInstructionTemplateView,
} from "../types";
import { useCustomInstructionPathActions } from "./action";
import {
  type CustomInstructionApplyInput,
  useCustomInstructionMutations,
} from "./mutation";
import { useCustomInstructionQueries } from "./query";

export function useCustomInstructionsPageController(): CustomInstructionsPageController {
  const { t } = useTranslation();
  const [tab, setTab] =
    useState<CustomInstructionsPageController["headerPanel"]["tab"]>("configure");
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

  const state = stateQuery.data;
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
