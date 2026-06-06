/**
 * 中文职责说明：voice 模块拥有自己的 TanStack cache key、权威写入、查询防护和只读视图模型。
 */
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import {
  envelopeData,
  isRecord,
  readArray,
  readBoolean,
  readString,
} from "@/features/_shared/evidence-data";
import {
  createModuleCacheOwner,
  type ModuleCacheSource,
} from "@/features/_shared/module-cache";

export const VoiceCache = createModuleCacheOwner("voice");
export const VoiceQueryKeys = VoiceCache.queryKeys;
export const VOICE_WORKSPACE_QUERY_KEY = [
  ...VoiceCache.queryKeys.root,
  "workspace",
] as const;
export const VOICE_RUNTIME_QUERY_KEY = [
  ...VoiceCache.queryKeys.root,
  "runtime",
] as const;
export const writeVoiceAuthoritativePayload = VoiceCache.writeAuthoritativePayload;
export const invalidateVoiceContractQueries = VoiceCache.invalidateContractQueries;

export interface VoiceRecordPreview {
  id: string;
  primary: string;
  secondary: string;
  raw: unknown;
}

export interface VoiceWorkspaceFacts {
  templates: VoiceRecordPreview[];
  vocabulary: VoiceRecordPreview[];
  history: VoiceRecordPreview[];
}

export interface VoiceRuntimeFacts {
  supported: boolean;
  enabled: boolean;
  captureState: string;
  globalShortcut: string;
  processingMode: string;
  processingModeId: string;
  speechModel: string;
  triggerStyle: string;
  triggerKeyLabel: string;
  activeAsrProvider: string;
  activeAsrModel: string;
  capturedBundleId: string;
  capturedAppName: string;
  permissions: unknown;
}

let voiceCacheSequence = 0;
let voiceLatestMutationSequence = 0;
const voiceLatestAcceptedSequenceByOperation = new Map<string, number>();
const voiceInFlightQueries = new Map<string, Promise<unknown>>();

export function nextVoiceCacheSequence() {
  voiceCacheSequence += 1;
  return voiceCacheSequence;
}

export async function runVoiceQuery<TPayload>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  operationKey: string,
  load: () => Promise<TPayload>,
  signal?: AbortSignal,
) {
  const cached = queryClient.getQueryData<TPayload>(queryKey);
  const inFlight = voiceInFlightQueries.get(operationKey) as
    | Promise<TPayload>
    | undefined;
  if (inFlight) {
    return inFlight;
  }

  const sequence = nextVoiceCacheSequence();
  let queryPromise!: Promise<TPayload>;
  queryPromise = (async () => {
    try {
      const payload = await load();
      if (signal?.aborted) {
        return cached ?? payload;
      }

      const accepted = writeVoiceCachePayload({
        queryClient,
        operationKey,
        payload,
        source: "full-refresh",
        sequence,
        receivedAt: Date.now(),
      });

      if (!accepted) {
        return queryClient.getQueryData<TPayload>(queryKey) ?? cached ?? payload;
      }

      return payload;
    } finally {
      if (voiceInFlightQueries.get(operationKey) === queryPromise) {
        voiceInFlightQueries.delete(operationKey);
      }
    }
  })();

  voiceInFlightQueries.set(operationKey, queryPromise);
  return queryPromise;
}

export function writeVoiceMutationPayload(
  queryClient: QueryClient,
  payload: unknown,
  sequence: number,
  receivedAt: number,
) {
  return writeVoiceCachePayload({
    queryClient,
    payload,
    source: "mutation-payload",
    sequence,
    receivedAt,
  });
}

export function selectVoiceWorkspaceFacts(payload: unknown): VoiceWorkspaceFacts {
  const workspace = envelopeData(payload);

  return {
    templates: readArray(workspace, ["templates"]).map((item) =>
      toPreview(item, ["title", "name", "id"], ["description", "kind"]),
    ),
    vocabulary: readArray(workspace, ["vocabulary"]).map((item) =>
      toPreview(item, ["source", "id"], ["replacement", "kind"]),
    ),
    history: readArray(workspace, ["history"]).map((item) =>
      toPreview(item, ["templateTitle", "id"], ["renderedText", "rawText"]),
    ),
  };
}

export function selectVoiceRuntimeFacts(payload: unknown): VoiceRuntimeFacts {
  const runtime = envelopeData(payload);

  return {
    supported: readBoolean(runtime, ["supported"]),
    enabled: readBoolean(runtime, ["enabled"]),
    captureState: readString(runtime, ["captureState"]),
    globalShortcut: readString(runtime, ["globalShortcut"]),
    processingMode: readString(runtime, ["processingMode"]),
    processingModeId: readString(runtime, ["processingModeId"]),
    speechModel: readString(runtime, ["speechModel"]),
    triggerStyle: readString(runtime, ["triggerStyle"]),
    triggerKeyLabel: readString(runtime, ["triggerKeyLabel"]),
    activeAsrProvider: readString(runtime, ["activeAsrProvider"]),
    activeAsrModel: readString(runtime, ["activeAsrModel"]),
    capturedBundleId: readString(runtime, ["capturedTargetBundleId"]),
    capturedAppName: readString(runtime, ["capturedTargetAppName"]),
    permissions: isRecord(runtime) ? runtime.permissions ?? null : null,
  };
}

function writeVoiceCachePayload({
  queryClient,
  operationKey,
  payload,
  source,
  sequence,
  receivedAt,
}: {
  queryClient: QueryClient;
  operationKey?: string;
  payload: unknown;
  source: ModuleCacheSource;
  sequence: number;
  receivedAt: number;
}) {
  if (source === "mutation-payload") {
    voiceLatestMutationSequence = Math.max(voiceLatestMutationSequence, sequence);
  } else if (operationKey) {
    const latestOperationSequence =
      voiceLatestAcceptedSequenceByOperation.get(operationKey) ?? 0;
    if (
      sequence < latestOperationSequence ||
      sequence < voiceLatestMutationSequence
    ) {
      return false;
    }
    voiceLatestAcceptedSequenceByOperation.set(operationKey, sequence);
  }

  VoiceCache.writeAuthoritativePayload(queryClient, {
    payload,
    source,
    sequence,
    receivedAt,
  });
  writeKnownVoiceQueryPayload(queryClient, payload);
  return true;
}

function writeKnownVoiceQueryPayload(queryClient: QueryClient, payload: unknown) {
  const data = envelopeData(payload);
  if (!data) return;

  const workspace = readWorkspacePayload(data);
  if (workspace) {
    writeQueryPayload(queryClient, VOICE_WORKSPACE_QUERY_KEY, payload, workspace);
  }

  const runtime = readRuntimePayload(data);
  if (runtime) {
    writeQueryPayload(queryClient, VOICE_RUNTIME_QUERY_KEY, payload, runtime);
  }
}

function writeQueryPayload(
  queryClient: QueryClient,
  queryKey: QueryKey,
  sourcePayload: unknown,
  data: unknown,
) {
  queryClient.setQueryData<unknown>(queryKey, (current: unknown) => {
    if (isEnvelopeRecord(current)) {
      return { ...current, data };
    }
    if (isEnvelopeRecord(sourcePayload)) {
      return { ...sourcePayload, data };
    }
    return data;
  });
}

function readWorkspacePayload(data: unknown) {
  if (hasWorkspaceShape(data)) return data;

  if (!isRecord(data)) return null;
  const workspace = data.workspace;
  return hasWorkspaceShape(workspace) ? workspace : null;
}

function readRuntimePayload(data: unknown) {
  if (hasRuntimeShape(data)) return data;

  if (!isRecord(data)) return null;
  const runtime = data.runtime;
  if (hasRuntimeShape(runtime)) return runtime;

  const status = data.status;
  return hasRuntimeShape(status) ? status : null;
}

function hasWorkspaceShape(value: unknown) {
  return (
    isRecord(value) &&
    ("templates" in value || "vocabulary" in value || "history" in value)
  );
}

function hasRuntimeShape(value: unknown) {
  return (
    isRecord(value) &&
    ("captureState" in value ||
      "permissions" in value ||
      "globalShortcut" in value ||
      "triggerStyle" in value)
  );
}

function isEnvelopeRecord(
  value: unknown,
): value is Record<string, unknown> & { data: unknown } {
  return isRecord(value) && "data" in value;
}

function toPreview(
  value: unknown,
  primaryPaths: string[],
  secondaryPaths: string[],
): VoiceRecordPreview {
  return {
    id: readString(value, ["id"]),
    primary: readString(value, primaryPaths),
    secondary: readString(value, secondaryPaths),
    raw: value,
  };
}
