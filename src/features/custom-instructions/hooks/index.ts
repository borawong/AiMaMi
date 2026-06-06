/**
 * 中文职责说明：custom-instructions 模块 hook 拥有 full refresh、active-only refresh、abort 和 replay 防护入口。
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import {
  mergeCustomInstructionTemplates,
} from "@/lib/custom-instruction-templates";
import { api } from "@/lib/api";
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
  const queryClient = useQueryClient();

  const stateQuery = useQuery({
    queryKey: CUSTOM_INSTRUCTION_STATE_QUERY_KEY,
    queryFn: async () => {
      const sequence = nextCustomInstructionsCacheSequence();
      const payload = await api.loadCustomInstructionState();
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
    mutationFn: (content: string) => api.previewCustomInstructionApply(content),
    onSuccess: async (response) => {
      options.onPreviewed(response.data);
    },
    onError: options.onPreviewError,
  });

  const applyMutation = useMutation({
    mutationFn: (params: CustomInstructionApplyInput) => api.applyCustomInstruction(params),
    onMutate: () =>
      queryClient.cancelQueries({ queryKey: CUSTOM_INSTRUCTION_STATE_QUERY_KEY }),
    onSuccess: async (response) => {
      await writeCustomInstructionsMutationPayload(queryClient, response);
      options.onApplied(response.data);
    },
    onError: options.onApplyError,
  });

  const clearMutation = useMutation({
    mutationFn: () => api.clearCustomInstructionBlock(),
    onMutate: () =>
      queryClient.cancelQueries({ queryKey: CUSTOM_INSTRUCTION_STATE_QUERY_KEY }),
    onSuccess: async (response) => {
      await writeCustomInstructionsMutationPayload(queryClient, response);
      options.onCleared(response.data);
    },
    onError: options.onClearError,
  });

  const rollbackMutation = useMutation({
    mutationFn: (historyId: string) => api.rollbackCustomInstruction(historyId),
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
    openPath: (path: string) => api.openCustomInstructionPath(path),
  };
}
