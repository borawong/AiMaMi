import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  writeCustomInstructionsStateMutationPayload,
} from "../cache";

export type CustomInstructionApplyInput = ApplyCustomInstructionParams;

interface CustomInstructionMutationOptions {
  onPreviewed: (payload: CustomInstructionPreviewPayload) => void;
  onPreviewError: (error: unknown) => void;
  onApplied: (payload: CustomInstructionStatePayload) => void;
  onApplyError: (error: unknown) => void;
  onCleared: (payload: CustomInstructionStatePayload) => void;
  onClearError: (error: unknown) => void;
  onRolledBack: (payload: CustomInstructionStatePayload) => void;
  onRollbackError: (error: unknown) => void;
}

export function useCustomInstructionMutations(
  options: CustomInstructionMutationOptions,
) {
  const queryClient = useQueryClient();

  const previewMutation = useMutation({
    mutationFn: (content: string) => customInstructionsService.previewApply(content),
    onSuccess: async (payload) => {
      options.onPreviewed(payload);
    },
    onError: options.onPreviewError,
  });

  const applyMutation = useMutation({
    mutationFn: (params: CustomInstructionApplyInput) =>
      customInstructionsService.apply(params),
    onMutate: () =>
      queryClient.cancelQueries({ queryKey: CUSTOM_INSTRUCTION_STATE_QUERY_KEY }),
    onSuccess: async (payload) => {
      await writeCustomInstructionsStateMutationPayload(queryClient, payload);
      options.onApplied(payload);
    },
    onError: options.onApplyError,
  });

  const clearMutation = useMutation({
    mutationFn: () => customInstructionsService.clearBlock(),
    onMutate: () =>
      queryClient.cancelQueries({ queryKey: CUSTOM_INSTRUCTION_STATE_QUERY_KEY }),
    onSuccess: async (payload) => {
      await writeCustomInstructionsStateMutationPayload(queryClient, payload);
      options.onCleared(payload);
    },
    onError: options.onClearError,
  });

  const rollbackMutation = useMutation({
    mutationFn: (historyId: string) =>
      customInstructionsService.rollback(historyId),
    onMutate: () =>
      queryClient.cancelQueries({ queryKey: CUSTOM_INSTRUCTION_STATE_QUERY_KEY }),
    onSuccess: async (payload) => {
      await writeCustomInstructionsStateMutationPayload(queryClient, payload);
      options.onRolledBack(payload);
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
