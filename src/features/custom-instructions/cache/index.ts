import type { QueryClient } from "@tanstack/react-query";
import {
  createModuleCacheOwner,
  type ModuleCacheSource,
} from "@/features/_shared/cache";
import type { CustomInstructionStatePayload } from "@/types";
import type {
  CustomInstructionsCacheEnvelope,
  CustomInstructionsCachePayload,
  CustomInstructionsStateQueryKey,
  CustomInstructionsTemplatesQueryKey,
} from "../types";

export const CustomInstructionsCache =
  createModuleCacheOwner<CustomInstructionsCachePayload>("custom-instructions");
export const CustomInstructionsQueryKeys = CustomInstructionsCache.queryKeys;
export const CUSTOM_INSTRUCTION_STATE_QUERY_KEY: CustomInstructionsStateQueryKey = [
  "custom-instructions",
  "current",
] as const;
export const CUSTOM_INSTRUCTION_TEMPLATES_QUERY_KEY: CustomInstructionsTemplatesQueryKey = [
  "custom-instructions",
  "templates",
] as const;
export const writeCustomInstructionsAuthoritativePayload = <
  TPayload extends CustomInstructionsCachePayload,
>(
  queryClient: QueryClient,
  envelope: Omit<CustomInstructionsCacheEnvelope<TPayload>, "moduleId">,
) => CustomInstructionsCache.writeAuthoritativePayload(queryClient, envelope);

let customInstructionsCacheSequence = 0;
let customInstructionsLatestAcceptedSequence = 0;

function nextCustomInstructionsCacheSequence() {
  customInstructionsCacheSequence += 1;
  return customInstructionsCacheSequence;
}

function toCustomInstructionsStateCachePayload(
  value: CustomInstructionStatePayload,
): CustomInstructionsCachePayload {
  return {
    queryKey: CUSTOM_INSTRUCTION_STATE_QUERY_KEY,
    value,
  };
}

export function writeCustomInstructionsStatePayload(
  queryClient: QueryClient,
  payload: CustomInstructionStatePayload,
  options: {
    source: ModuleCacheSource;
    sequence?: number;
  },
) {
  const sequence = options.sequence ?? nextCustomInstructionsCacheSequence();
  if (sequence < customInstructionsLatestAcceptedSequence) {
    return false;
  }

  customInstructionsLatestAcceptedSequence = sequence;
  queryClient.setQueryData<CustomInstructionStatePayload>(
    CUSTOM_INSTRUCTION_STATE_QUERY_KEY,
    payload,
  );
  writeCustomInstructionsAuthoritativePayload(queryClient, {
    payload: toCustomInstructionsStateCachePayload(payload),
    source: options.source,
    sequence,
    receivedAt: Date.now(),
  });
  return true;
}

export async function runCustomInstructionsStateQuery(
  queryClient: QueryClient,
  load: () => Promise<CustomInstructionStatePayload>,
  source: ModuleCacheSource = "full-refresh",
) {
  const sequence = nextCustomInstructionsCacheSequence();
  const payload = await load();
  const accepted = writeCustomInstructionsStatePayload(queryClient, payload, {
    source,
    sequence,
  });

  if (!accepted) {
    return (
      queryClient.getQueryData<CustomInstructionStatePayload>(
        CUSTOM_INSTRUCTION_STATE_QUERY_KEY,
      ) ?? payload
    );
  }

  return payload;
}

export async function writeCustomInstructionsStateMutationPayload(
  queryClient: QueryClient,
  payload: CustomInstructionStatePayload,
) {
  const accepted = writeCustomInstructionsStatePayload(queryClient, payload, {
    source: "mutation-payload",
  });
  if (!accepted) return;

  await invalidateCustomInstructionsContractQueries(queryClient);
}

export async function invalidateCustomInstructionsContractQueries(
  queryClient: QueryClient,
) {
  await Promise.all([
    CustomInstructionsCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: CUSTOM_INSTRUCTION_STATE_QUERY_KEY }),
  ]);
}
