/**
 * 中文职责说明：settings 模块拥有自己的 TanStack cache key、权威写入和失效合同。
 */
import type { QueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import {
  createModuleCacheOwner,
  type ModuleCacheSource,
} from "@/features/_shared/cache";

export const SettingsCache = createModuleCacheOwner("settings");
export const SettingsQueryKeys = SettingsCache.queryKeys;
export const SETTINGS_RUNTIME_STATE_DISPLAY_QUERY_KEY = [
  "runtime-state",
  "display",
] as const;
export const SETTINGS_HAS_NOTCH_QUERY_KEY = ["has-notch"] as const;
export const SETTINGS_HOTSPOT_ENABLED_QUERY_KEY = ["hotspot-enabled"] as const;
export const SETTINGS_IMAGE_COMPAT_QUERY_KEY = ["imageCompat"] as const;
export const SETTINGS_USAGE_REFRESH_INTERVAL_QUERY_KEY = [
  "usage-refresh-interval",
] as const;
export const writeSettingsAuthoritativePayload = SettingsCache.writeAuthoritativePayload;

let settingsModuleSequence = 0;
const settingsQuerySequences = new Map<string, number>();
const settingsMutationFences = new Map<string, number>();

function nextSettingsModuleSequence() {
  settingsModuleSequence += 1;
  return settingsModuleSequence;
}

function serializeSettingsQueryKey(queryKey: QueryKey) {
  return JSON.stringify(queryKey);
}

function nextSettingsQuerySequence(queryKey: QueryKey) {
  const serialized = serializeSettingsQueryKey(queryKey);
  const next = (settingsQuerySequences.get(serialized) ?? 0) + 1;
  settingsQuerySequences.set(serialized, next);
  return next;
}

function canAcceptSettingsPayload(
  queryKey: QueryKey,
  source: ModuleCacheSource,
  sequence: number,
) {
  const serialized = serializeSettingsQueryKey(queryKey);
  const latestStarted = settingsQuerySequences.get(serialized) ?? 0;
  const mutationFence = settingsMutationFences.get(serialized) ?? 0;

  if (source === "mutation-payload") {
    return sequence >= mutationFence;
  }

  return sequence >= latestStarted && sequence >= mutationFence;
}

export function beginSettingsMutation(queryKey: QueryKey) {
  const sequence = nextSettingsQuerySequence(queryKey);
  const serialized = serializeSettingsQueryKey(queryKey);
  settingsMutationFences.set(
    serialized,
    Math.max(settingsMutationFences.get(serialized) ?? 0, sequence),
  );
  return sequence;
}

export function writeSettingsQueryPayload<TPayload>(
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
      ? beginSettingsMutation(queryKey)
      : nextSettingsQuerySequence(queryKey));

  if (!canAcceptSettingsPayload(queryKey, options.source, sequence)) {
    return false;
  }

  queryClient.setQueryData<TPayload>(queryKey, payload);
  SettingsCache.writeAuthoritativePayload(queryClient, {
    payload: {
      queryKey,
      value: payload,
    },
    source: options.source,
    sequence: nextSettingsModuleSequence(),
    receivedAt: Date.now(),
  });
  return true;
}

export async function runSettingsQuery<TPayload>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  load: () => Promise<TPayload>,
  source: ModuleCacheSource = "full-refresh",
) {
  const sequence = nextSettingsQuerySequence(queryKey);
  const payload = await load();
  const accepted = writeSettingsQueryPayload(queryClient, queryKey, payload, {
    source,
    sequence,
  });

  if (!accepted) {
    return queryClient.getQueryData<TPayload>(queryKey) ?? payload;
  }

  return payload;
}

export async function writeSettingsMutationPayload<TPayload>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  payload: TPayload,
  sequence?: number,
) {
  const accepted = writeSettingsQueryPayload(queryClient, queryKey, payload, {
    source: "mutation-payload",
    sequence,
  });

  if (accepted) {
    await invalidateSettingsContractQueries(queryClient);
  }

  return accepted;
}

export async function invalidateSettingsContractQueries(queryClient: QueryClient) {
  await Promise.all([
    SettingsCache.invalidateContractQueries(queryClient),
    queryClient.invalidateQueries({
      queryKey: SETTINGS_RUNTIME_STATE_DISPLAY_QUERY_KEY,
    }),
    queryClient.invalidateQueries({
      queryKey: SETTINGS_HAS_NOTCH_QUERY_KEY,
    }),
    queryClient.invalidateQueries({
      queryKey: SETTINGS_HOTSPOT_ENABLED_QUERY_KEY,
    }),
    queryClient.invalidateQueries({
      queryKey: SETTINGS_IMAGE_COMPAT_QUERY_KEY,
    }),
    queryClient.invalidateQueries({
      queryKey: SETTINGS_USAGE_REFRESH_INTERVAL_QUERY_KEY,
    }),
  ]);
}
