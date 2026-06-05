/**
 * 中文职责说明：custom-instructions 模块 hook 拥有 full refresh、active-only refresh、abort 和 replay 防护入口。
 */
import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import {
  mergeCustomInstructionTemplates,
} from "@/lib/custom-instruction-templates";
import { customInstructionsService } from "@/services/custom-instructions";
import type {
  CustomInstructionPreviewPayload,
  CustomInstructionStatePayload,
} from "@/types";
import { CustomInstructionsCache } from "../cache";

export interface CustomInstructionApplyInput {
  content: string;
  templateCode?: string;
  templateTitle?: string;
  source: string;
}

export function useCustomInstructionsCacheController() {
  return useModuleCacheController(CustomInstructionsCache);
}

export function useCustomInstructionQueries() {
  const stateQuery = useQuery({
    queryKey: ["custom-instructions", "state"],
    queryFn: () => customInstructionsService.loadState(),
  });

  const templatesQuery = useQuery({
    queryKey: ["custom-instructions", "templates"],
    queryFn: async () => mergeCustomInstructionTemplates([]),
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

  const syncStateCache = useCallback(
    (payload: CustomInstructionStatePayload) => {
      queryClient.setQueryData(["custom-instructions", "state"], {
        schemaVersion: 1,
        success: true,
        code: "ok",
        message: "",
        warnings: [],
        data: payload,
      });
    },
    [queryClient],
  );

  const previewMutation = useMutation({
    mutationFn: (content: string) => customInstructionsService.previewApply(content),
    onSuccess: (response) => options.onPreviewed(response.data),
    onError: options.onPreviewError,
  });

  const applyMutation = useMutation({
    mutationFn: (params: CustomInstructionApplyInput) => customInstructionsService.apply(params),
    onSuccess: (response) => {
      syncStateCache(response.data);
      options.onApplied(response.data);
    },
    onError: options.onApplyError,
  });

  const clearMutation = useMutation({
    mutationFn: () => customInstructionsService.clearBlock(),
    onSuccess: (response) => {
      syncStateCache(response.data);
      options.onCleared(response.data);
    },
    onError: options.onClearError,
  });

  const rollbackMutation = useMutation({
    mutationFn: (historyId: string) => customInstructionsService.rollback(historyId),
    onSuccess: (response) => {
      syncStateCache(response.data);
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
