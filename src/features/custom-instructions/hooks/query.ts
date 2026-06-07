import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/controller";
import {
  mergeCustomInstructionTemplates,
  type CustomInstructionTemplate,
} from "@/lib/templates";
import { customInstructionsService } from "@/services/custom-instructions";
import type { CustomInstructionStatePayload } from "@/types";
import {
  CUSTOM_INSTRUCTION_STATE_QUERY_KEY,
  CUSTOM_INSTRUCTION_TEMPLATES_QUERY_KEY,
  CustomInstructionsCache,
  runCustomInstructionsStateQuery,
} from "../cache";

export function useCustomInstructionsCacheController() {
  return useModuleCacheController(CustomInstructionsCache);
}

export function useCustomInstructionQueries() {
  const queryClient = useQueryClient();

  const stateQuery = useQuery<CustomInstructionStatePayload>({
    queryKey: CUSTOM_INSTRUCTION_STATE_QUERY_KEY,
    queryFn: () =>
      runCustomInstructionsStateQuery(queryClient, () =>
        customInstructionsService.loadState(),
      ),
    staleTime: Infinity,
  });

  const templatesQuery = useQuery<CustomInstructionTemplate[]>({
    queryKey: CUSTOM_INSTRUCTION_TEMPLATES_QUERY_KEY,
    queryFn: async () => mergeCustomInstructionTemplates([]),
    staleTime: Infinity,
  });

  return {
    stateQuery,
    templatesQuery,
  };
}
