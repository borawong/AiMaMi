import type { QueryClient, QueryKey } from "@tanstack/react-query";
import {
  createModuleCacheOwner,
  type ModuleCacheSource,
} from "@/features/_shared/cache";
import type {
  OverviewCacheEnvelope,
  OverviewCachePayload,
  OverviewMysteryGrantsEnvelope,
} from "../types";

export const OverviewCache =
  createModuleCacheOwner<OverviewCachePayload>("overview");
export const OverviewQueryKeys = OverviewCache.queryKeys;
export const OVERVIEW_SNAPSHOT_QUERY_KEY = [
  ...OverviewCache.queryKeys.root,
  "snapshot",
] as const;
export const OVERVIEW_USAGE_QUERY_KEY = [
  ...OverviewCache.queryKeys.root,
  "usage",
] as const;
export const OVERVIEW_MCP_QUERY_KEY = [
  ...OverviewCache.queryKeys.root,
  "mcp",
] as const;
export const OVERVIEW_SKILLS_QUERY_KEY = [
  ...OverviewCache.queryKeys.root,
  "skills",
] as const;
export const OVERVIEW_DEVICE_ID_QUERY_KEY = [
  ...OverviewCache.queryKeys.root,
  "device-id",
] as const;
export const OVERVIEW_NOTIFICATION_STATE_QUERY_KEY = [
  ...OverviewCache.queryKeys.root,
  "notification-client-state",
] as const;
export const OVERVIEW_MYSTERY_GRANTS_QUERY_KEY = [
  ...OverviewCache.queryKeys.root,
  "mystery-unlock-grants",
] as const;
export const writeOverviewAuthoritativePayload = <
  TPayload extends OverviewCachePayload,
>(
  queryClient: QueryClient,
  envelope: Omit<OverviewCacheEnvelope<TPayload>, "moduleId">,
) => OverviewCache.writeAuthoritativePayload(queryClient, envelope);

let overviewModuleSequence = 0;
const overviewQuerySequences = new Map<string, number>();
const overviewMutationFences = new Map<string, number>();

function nextOverviewModuleSequence() {
  overviewModuleSequence += 1;
  return overviewModuleSequence;
}

function serializeOverviewQueryKey(queryKey: QueryKey) {
  return JSON.stringify(queryKey);
}

function nextOverviewQuerySequence(queryKey: QueryKey) {
  const serialized = serializeOverviewQueryKey(queryKey);
  const next = (overviewQuerySequences.get(serialized) ?? 0) + 1;
  overviewQuerySequences.set(serialized, next);
  return next;
}

function canAcceptOverviewPayload(
  queryKey: QueryKey,
  source: ModuleCacheSource,
  sequence: number,
) {
  const serialized = serializeOverviewQueryKey(queryKey);
  const latestStarted = overviewQuerySequences.get(serialized) ?? 0;
  const mutationFence = overviewMutationFences.get(serialized) ?? 0;

  if (source === "mutation-payload") {
    return sequence >= mutationFence;
  }

  return sequence >= latestStarted && sequence >= mutationFence;
}

export function beginOverviewMutation(queryKey: QueryKey) {
  const sequence = nextOverviewQuerySequence(queryKey);
  const serialized = serializeOverviewQueryKey(queryKey);
  overviewMutationFences.set(
    serialized,
    Math.max(overviewMutationFences.get(serialized) ?? 0, sequence),
  );
  return sequence;
}

export interface OverviewPreparedMutation {
  sequences: Array<{
    queryKey: QueryKey;
    sequence: number;
  }>;
}

export async function prepareOverviewMutation(
  queryClient: QueryClient,
  queryKeys: QueryKey[],
): Promise<OverviewPreparedMutation> {
  const sequences = queryKeys.map((queryKey) => ({
    queryKey,
    sequence: beginOverviewMutation(queryKey),
  }));

  await Promise.all(
    queryKeys.map((queryKey) => queryClient.cancelQueries({ queryKey })),
  );

  return { sequences };
}

export function readOverviewMutationSequence(
  context: OverviewPreparedMutation | undefined,
  queryKey: QueryKey,
) {
  const serialized = serializeOverviewQueryKey(queryKey);
  return context?.sequences.find(
    (item) => serializeOverviewQueryKey(item.queryKey) === serialized,
  )?.sequence;
}

export function writeOverviewQueryPayload<TPayload extends OverviewCachePayload>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  payload: TPayload,
  options: {
    source: ModuleCacheSource;
    sequence?: number;
  },
) {
  const sequence =
    options.sequence ??
    (options.source === "mutation-payload"
      ? beginOverviewMutation(queryKey)
      : nextOverviewQuerySequence(queryKey));

  if (!canAcceptOverviewPayload(queryKey, options.source, sequence)) {
    return false;
  }

  queryClient.setQueryData<TPayload>(queryKey, payload);
  writeOverviewAuthoritativePayload(queryClient, {
    payload,
    source: options.source,
    sequence: nextOverviewModuleSequence(),
    receivedAt: Date.now(),
  });
  return true;
}

export async function runOverviewQuery<TPayload extends OverviewCachePayload>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  load: () => Promise<TPayload>,
  source: ModuleCacheSource = "full-refresh",
) {
  const sequence = nextOverviewQuerySequence(queryKey);
  const payload = await load();
  const accepted = writeOverviewQueryPayload(queryClient, queryKey, payload, {
    source,
    sequence,
  });

  if (!accepted) {
    return queryClient.getQueryData<TPayload>(queryKey) ?? payload;
  }

  return payload;
}

export async function writeOverviewMutationPayload<
  TPayload extends OverviewCachePayload,
>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  payload: TPayload,
  sequence?: number,
) {
  const accepted = writeOverviewQueryPayload(queryClient, queryKey, payload, {
    source: "mutation-payload",
    sequence,
  });

  if (accepted) {
    await invalidateOverviewContractQueries(queryClient);
  }

  return accepted;
}

export async function writeOverviewMysteryGrantsPayload(
  queryClient: QueryClient,
  payload: OverviewMysteryGrantsEnvelope,
  sequence?: number,
) {
  const accepted = await writeOverviewMutationPayload(
    queryClient,
    OVERVIEW_MYSTERY_GRANTS_QUERY_KEY,
    payload,
    sequence,
  );

  if (accepted) {
    await invalidateOverviewMysteryGrantsQueries(queryClient);
  }

  return accepted;
}

export async function invalidateOverviewContractQueries(queryClient: QueryClient) {
  await OverviewCache.invalidateContractQueries(queryClient);
}

export async function invalidateOverviewUsageMutationQueries(
  queryClient: QueryClient,
) {
  await Promise.all([
    invalidateOverviewContractQueries(queryClient),
    queryClient.invalidateQueries({ queryKey: ["usage-analytics"] }),
    queryClient.invalidateQueries({ queryKey: ["analytics", "usage"] }),
  ]);
}

export async function invalidateOverviewMysteryGrantsQueries(
  queryClient: QueryClient,
) {
  await Promise.all([
    invalidateOverviewContractQueries(queryClient),
    queryClient.invalidateQueries({
      queryKey: OVERVIEW_MYSTERY_GRANTS_QUERY_KEY,
    }),
  ]);
}
