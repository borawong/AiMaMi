import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AlertTriangle, FileCode2, History, PencilLine, RotateCw, Wand2 } from "lucide-react";

import { BentoCard } from "@/components/ui/bento-card";
import { BentoInnerPanel } from "@/components/ui/bento-inner-panel";
import { Button } from "@/components/ui/button";
import { ButtonBusyContent } from "@/components/ui/button-busy-content";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import {
  builtinCustomInstructionTemplates,
  mergeCustomInstructionTemplates,
  type CustomInstructionTemplate,
} from "@/lib/custom-instruction-templates";
import { toast } from "@/hooks/use-toast";
import { formatDateTime } from "@/lib/format-time";
import type {
  CustomInstructionPreviewPayload,
  CustomInstructionStatePayload,
} from "@/types";
import { HistoryList } from "@/components/custom-instructions/history-list";
import { PreviewDialog } from "@/components/custom-instructions/preview-dialog";
import { TemplateCard } from "@/components/custom-instructions/template-card";
import { SegmentedOptions } from "@/components/ui/segmented-options";
import { useBusyAction } from "@/hooks/use-busy-action";

type CustomInstructionsTab = "configure" | "templates";

function protectionTone(state: CustomInstructionStatePayload["current"]["protectionState"]) {
  switch (state) {
    case "ready":
      return "border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300";
    case "protected":
      return "border-destructive/20 bg-destructive/8 text-destructive";
    default:
      return "border-border bg-muted/40 text-muted-foreground";
  }
}

export function CustomInstructionsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<CustomInstructionsTab>("configure");
  const [draftContent, setDraftContent] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<CustomInstructionTemplate | null>(null);
  const [preview, setPreview] = useState<CustomInstructionPreviewPayload | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [pendingApply, setPendingApply] = useState<{
    content: string;
    templateCode?: string;
    templateTitle?: string;
    source: string;
  } | null>(null);
  const [draftInitialized, setDraftInitialized] = useState(false);
  const refreshAction = useBusyAction({ minVisibleMs: 800 });

  const stateQuery = useQuery({
    queryKey: ["custom-instructions", "state"],
    queryFn: () => api.loadCustomInstructionState(),
  });

  const templatesQuery = useQuery({
    queryKey: ["custom-instructions", "templates"],
    queryFn: async () => {
      return mergeCustomInstructionTemplates([]);
    },
  });

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

  const templates = useMemo(() => {
    const base = templatesQuery.data ?? builtinCustomInstructionTemplates;
    return base.map((template) => ({
      ...template,
      applyCount: template.applyCount ?? localApplyCounts.get(template.code) ?? 0,
    }));
  }, [localApplyCounts, templatesQuery.data]);

  const previewMutation = useMutation({
    mutationFn: (content: string) => api.previewCustomInstructionApply(content),
    onSuccess: (response) => {
      setPreview(response.data);
      setPreviewOpen(true);
    },
    onError: (error) => {
      toast({
        title: t("customInstructions.previewFailed"),
        description: error instanceof Error ? error.message : t("common.toastErrorGenericDesc"),
        variant: "destructive",
      });
    },
  });

  const syncAfterSuccess = (payload: CustomInstructionStatePayload) => {
    queryClient.setQueryData(["custom-instructions", "state"], {
      schemaVersion: 1,
      success: true,
      code: "ok",
      message: "",
      warnings: [],
      data: payload,
    });
    setDraftContent(payload.current.managedContent);
    setSelectedTemplate(
      payload.current.lastTemplateCode
        ? templates.find((item) => item.code === payload.current.lastTemplateCode) ?? null
        : null,
    );
  };

  const applyMutation = useMutation({
    mutationFn: (params: NonNullable<typeof pendingApply>) => api.applyCustomInstruction(params),
    onSuccess: async (response) => {
      syncAfterSuccess(response.data);
      setPreviewOpen(false);
      setPreview(null);
      setPendingApply(null);
      toast({
        title: t("customInstructions.applySuccess"),
        description: t("customInstructions.applySuccessDesc"),
        variant: "success",
      });

    },
    onError: (error) => {
      setPreviewOpen(false);
      toast({
        title: t("customInstructions.applyFailed"),
        description: error instanceof Error ? error.message : t("common.toastErrorGenericDesc"),
        variant: "destructive",
      });
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => api.clearCustomInstructionBlock(),
    onSuccess: (response) => {
      syncAfterSuccess(response.data);
      setClearOpen(false);
      toast({
        title: t("customInstructions.clearSuccess"),
        description: t("customInstructions.clearSuccessDesc"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("customInstructions.clearFailed"),
        description: error instanceof Error ? error.message : t("common.toastErrorGenericDesc"),
        variant: "destructive",
      });
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: (historyId: string) => api.rollbackCustomInstruction(historyId),
    onSuccess: (response) => {
      syncAfterSuccess(response.data);
      toast({
        title: t("customInstructions.rollbackSuccess"),
        description: t("customInstructions.rollbackSuccessDesc"),
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: t("customInstructions.rollbackFailed"),
        description: error instanceof Error ? error.message : t("common.toastErrorGenericDesc"),
        variant: "destructive",
      });
    },
  });

  const beginPreview = (params: NonNullable<typeof pendingApply>) => {
    if (current?.protectionState === "protected") return;
    setPendingApply(params);
    previewMutation.mutate(params.content);
  };

  const handleTemplateSelect = (template: CustomInstructionTemplate) => {
    setSelectedTemplate(template);
    setDraftContent(template.body);
  };

  const handleRefresh = async () => {
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
  };

  const protectedMode = current?.protectionState === "protected";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="max-w-md text-sm text-muted-foreground">{t("customInstructions.description")}</p>
        <SegmentedOptions
          items={[
            { value: "configure", label: "配置指令" },
            { value: "templates", label: "模板中心" },
          ]}
          value={tab}
          onChange={(value) => setTab(value as CustomInstructionsTab)}
        />
      </div>

      {tab === "templates" ? (
        <BentoCard className="min-h-[520px]">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Wand2 className="h-4 w-4 text-primary" />
                {t("customInstructions.templatesTitle")}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("customInstructions.templatesDescription")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshAction.busy || stateQuery.isFetching || templatesQuery.isFetching}
            >
              <ButtonBusyContent
                busy={refreshAction.busy || stateQuery.isFetching || templatesQuery.isFetching}
                idleIcon={<RotateCw className="h-4 w-4" />}
                idleLabel={t("common.refresh")}
                busyLabel={t("common.refreshing")}
                spinnerClassName="h-4 w-4"
              />
            </Button>
          </div>

          <div className="space-y-3">
            {templates.map((template) => (
              <TemplateCard
                key={template.code}
                template={template}
                isSelected={selectedTemplate?.code === template.code}
                onSelect={() => handleTemplateSelect(template)}
                onPreview={() =>
                  beginPreview({
                    content: template.body,
                    templateCode: template.code,
                    templateTitle: template.title,
                    source: "one_click",
                  })
                }
              />
            ))}
          </div>
        </BentoCard>
      ) : (
        <div className="space-y-6">
          <BentoCard>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <FileCode2 className="h-4 w-4 text-primary" />
                  {t("customInstructions.currentTitle")}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("customInstructions.currentDescription")}
                </p>
              </div>
              <Badge variant={protectedMode ? "destructive" : current?.managedBlockPresent ? "default" : "outline"}>
                {protectedMode
                  ? t("customInstructions.stateProtected")
                  : current?.managedBlockPresent
                    ? t("customInstructions.stateManaged")
                    : t("customInstructions.stateUnmanaged")}
              </Badge>
            </div>

            {current ? (
              <div className="space-y-4">
                <BentoInnerPanel className={protectionTone(current.protectionState)}>
                  <div className="space-y-2 text-sm">
                    <div className="font-medium">{t("customInstructions.globalScopeHint")}</div>
                    <div className="text-xs text-muted-foreground dark:text-white/70">
                      {current.globalPath}
                    </div>
                    {current.lastAppliedAt && (
                      <div className="text-xs">
                        {t("customInstructions.lastApplied")}：{formatDateTime(current.lastAppliedAt)}
                      </div>
                    )}
                    {current.lastTemplateTitle && (
                      <div className="text-xs">
                        {t("customInstructions.lastTemplate")}：{current.lastTemplateTitle}
                      </div>
                    )}
                    {current.issueMessage && (
                      <div className="flex items-start gap-2 text-xs">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{current.issueMessage}</span>
                      </div>
                    )}
                  </div>
                </BentoInnerPanel>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("customInstructions.currentManagedBlock")}</div>
                  <Textarea
                    value={current.managedContent || t("customInstructions.noManagedContent")}
                    readOnly
                    className="min-h-[160px] font-mono text-xs"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => api.openPath(current.globalPath)}
                    disabled={!current.fileExists}
                  >
                    {t("customInstructions.openGlobalFile")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setDraftContent(current.managedContent)}
                    disabled={protectedMode}
                  >
                    {t("customInstructions.restoreCurrent")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setClearOpen(true)}
                    disabled={protectedMode || !current.managedBlockPresent || clearMutation.isPending}
                  >
                    {clearMutation.isPending ? t("customInstructions.clearing") : t("customInstructions.clearManagedBlock")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center">
                <Spinner />
              </div>
            )}
          </BentoCard>

          <BentoCard>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <PencilLine className="h-4 w-4 text-primary" />
                  {t("customInstructions.editorTitle")}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("customInstructions.editorDescription")}
                </p>
              </div>
              {selectedTemplate && (
                <Badge variant="outline">{selectedTemplate.title}</Badge>
              )}
            </div>

            <div className="space-y-4">
              <Textarea
                value={draftContent}
                onChange={(event) => setDraftContent(event.target.value)}
                className="min-h-[220px] font-mono text-xs"
                placeholder={t("customInstructions.editorPlaceholder")}
                disabled={protectedMode}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    beginPreview({
                      content: draftContent,
                      templateCode: selectedTemplate?.code,
                      templateTitle: selectedTemplate?.title,
                      source: selectedTemplate ? "edit_then_apply" : "manual",
                    })
                  }
                  disabled={protectedMode || !draftContent.trim() || previewMutation.isPending}
                >
                  {previewMutation.isPending ? (
                    <Spinner className="h-4 w-4" data-icon="inline-start" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  {t("customInstructions.previewAndApply")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setDraftContent(current?.managedContent ?? "");
                  }}
                >
                  {t("customInstructions.resetEditor")}
                </Button>
              </div>
            </div>
          </BentoCard>

          <BentoCard>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <History className="h-4 w-4 text-primary" />
                  {t("customInstructions.historyTitle")}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("customInstructions.historyDescription")}
                </p>
              </div>
            </div>
            <HistoryList
              items={state?.history ?? []}
              rollbackingId={rollbackMutation.isPending ? rollbackMutation.variables ?? null : null}
              onRollback={(historyId) => rollbackMutation.mutate(historyId)}
            />
          </BentoCard>
        </div>
      )}

      <PreviewDialog
        open={previewOpen}
        preview={preview}
        applying={applyMutation.isPending}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) {
            setPreview(null);
            setPendingApply(null);
          }
        }}
        onApply={() => {
          if (!pendingApply) return;
          applyMutation.mutate(pendingApply);
        }}
      />

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("customInstructions.clearConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("customInstructions.clearConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => clearMutation.mutate()}>
              {t("customInstructions.clearManagedBlock")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
