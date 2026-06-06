import { useRef, type MutableRefObject } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/use-module-cache-controller";
import { voiceService } from "@/services/voice";
import { VoiceCache } from "../cache";

export function useVoiceCacheController() {
  return useModuleCacheController(VoiceCache);
}

type VoiceMutationContext = {
  sequence: number;
  receivedAt: number;
};

type VoiceTemplateInput = Parameters<typeof voiceService.upsertTemplate>[0];
type VoiceVocabularyInput = Parameters<typeof voiceService.upsertVocabulary>[0];
type VoiceVocabularyKindInput = Parameters<typeof voiceService.replaceVocabularyKind>[0];
type VoiceVocabularyAppScopeInput = Parameters<typeof voiceService.upsertVocabularyAppScope>[0];
type VoiceGeneratePromptInput = Parameters<typeof voiceService.generatePrompt>[0];
type VoiceLlmConfigInput = Parameters<typeof voiceService.saveLlmConfig>[0];
type VoiceAsrConfigInput = Parameters<typeof voiceService.saveAsrConfig>[0];
type VoiceRuntimeSettingsInput = Parameters<typeof voiceService.updateRuntimeSettings>[0];
type VoiceTriggerKeyInput = Parameters<typeof voiceService.setTriggerKey>[0];
type VoiceTriggerBindingsInput = Parameters<typeof voiceService.setTriggerBindings>[0];
type VoiceModeShortcutInput = Parameters<typeof voiceService.setModeShortcut>[0];

type VoiceProcessingModeInput = {
  modeId: string;
  processingMode?: string | null;
};

type VoiceInjectInput = {
  text: string;
  expectedBundleId?: string | null;
};

type VoiceOverlayInput = {
  query: string;
  output: string;
};

const voiceWorkspaceQueryKey = [...VoiceCache.queryKeys.root, "workspace"] as const;
const voiceRuntimeQueryKey = [...VoiceCache.queryKeys.root, "runtime"] as const;

function useVoiceEvidenceMutation<TVariables>(
  latestMutationSequenceRef: MutableRefObject<number>,
  mutationFn: (variables: TVariables) => Promise<unknown>,
) {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, TVariables, VoiceMutationContext>({
    mutationFn,
    onMutate: () => {
      const receivedAt = Date.now();
      const sequence = latestMutationSequenceRef.current + 1;
      latestMutationSequenceRef.current = sequence;
      return { sequence, receivedAt };
    },
    onSuccess: (payload, _variables, context) => {
      if (!context || context.sequence < latestMutationSequenceRef.current) {
        return;
      }

      VoiceCache.writeAuthoritativePayload(queryClient, {
        payload,
        source: "mutation-payload",
        sequence: context.sequence,
        receivedAt: context.receivedAt,
      });
      writeKnownVoiceQueryPayload(queryClient, payload);
      void VoiceCache.invalidateContractQueries(queryClient);
    },
  });
}

function writeKnownVoiceQueryPayload(queryClient: QueryClient, payload: unknown) {
  const data = readEnvelopeData(payload);
  if (!data) return;

  const workspace = readObjectField(data, "workspace");
  if (workspace) {
    writeQueryPayload(queryClient, voiceWorkspaceQueryKey, payload, workspace);
  }

  const runtime = readRuntimePayload(data);
  if (runtime) {
    writeQueryPayload(queryClient, voiceRuntimeQueryKey, payload, runtime);
  }
}

function writeQueryPayload(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
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

function readRuntimePayload(data: unknown) {
  if (hasRuntimeShape(data)) return data;

  const runtime = readObjectField(data, "runtime");
  if (hasRuntimeShape(runtime)) return runtime;

  const status = readObjectField(data, "status");
  if (hasRuntimeShape(status)) return status;

  return null;
}

function readEnvelopeData(value: unknown) {
  if (isRecord(value) && "data" in value) {
    return value.data ?? null;
  }
  return value ?? null;
}

function readObjectField(value: unknown, key: string) {
  if (!isRecord(value)) return null;
  const item = value[key];
  return isRecord(item) ? item : null;
}

function isEnvelopeRecord(value: unknown): value is Record<string, unknown> & { data: unknown } {
  return isRecord(value) && "data" in value;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function useVoiceModule() {
  const latestMutationSequenceRef = useRef(0);

  const workspaceQuery = useQuery({
    queryKey: voiceWorkspaceQueryKey,
    queryFn: () => voiceService.loadWorkspace(),
    staleTime: 30_000,
  });
  const runtimeQuery = useQuery({
    queryKey: voiceRuntimeQueryKey,
    queryFn: () => voiceService.loadRuntimeStatus(),
    staleTime: 30_000,
  });

  const upsertTemplateMutation = useVoiceEvidenceMutation<VoiceTemplateInput>(
    latestMutationSequenceRef,
    (input) => voiceService.upsertTemplate(input),
  );
  const removeTemplateMutation = useVoiceEvidenceMutation<string>(
    latestMutationSequenceRef,
    (id) => voiceService.removeTemplate(id),
  );
  const upsertVocabularyMutation = useVoiceEvidenceMutation<VoiceVocabularyInput>(
    latestMutationSequenceRef,
    (input) => voiceService.upsertVocabulary(input),
  );
  const removeVocabularyMutation = useVoiceEvidenceMutation<string>(
    latestMutationSequenceRef,
    (id) => voiceService.removeVocabulary(id),
  );
  const replaceVocabularyKindMutation = useVoiceEvidenceMutation<VoiceVocabularyKindInput>(
    latestMutationSequenceRef,
    (input) => voiceService.replaceVocabularyKind(input),
  );
  const removeVocabularyAppScopeMutation = useVoiceEvidenceMutation<string>(
    latestMutationSequenceRef,
    (appBundleId) => voiceService.removeVocabularyAppScope(appBundleId),
  );
  const upsertVocabularyAppScopeMutation =
    useVoiceEvidenceMutation<VoiceVocabularyAppScopeInput>(
      latestMutationSequenceRef,
      (input) => voiceService.upsertVocabularyAppScope(input),
    );
  const resolveVocabularyAppInfoMutation = useVoiceEvidenceMutation<string>(
    latestMutationSequenceRef,
    (path) => voiceService.resolveVocabularyAppInfo(path),
  );
  const generatePromptMutation = useVoiceEvidenceMutation<VoiceGeneratePromptInput>(
    latestMutationSequenceRef,
    (input) => voiceService.generatePrompt(input),
  );
  const loadLlmConfigMutation = useVoiceEvidenceMutation<string>(
    latestMutationSequenceRef,
    (provider) => voiceService.loadLlmConfig(provider),
  );
  const saveLlmConfigMutation = useVoiceEvidenceMutation<VoiceLlmConfigInput>(
    latestMutationSequenceRef,
    (input) => voiceService.saveLlmConfig(input),
  );
  const testLlmConfigMutation = useVoiceEvidenceMutation<VoiceLlmConfigInput>(
    latestMutationSequenceRef,
    (input) => voiceService.testLlmConfig(input),
  );
  const loadAsrConfigMutation = useVoiceEvidenceMutation<string>(
    latestMutationSequenceRef,
    (provider) => voiceService.loadAsrConfig(provider),
  );
  const saveAsrConfigMutation = useVoiceEvidenceMutation<VoiceAsrConfigInput>(
    latestMutationSequenceRef,
    (input) => voiceService.saveAsrConfig(input),
  );
  const testAsrConfigMutation = useVoiceEvidenceMutation<VoiceAsrConfigInput>(
    latestMutationSequenceRef,
    (input) => voiceService.testAsrConfig(input),
  );
  const removeHistoryEntryMutation = useVoiceEvidenceMutation<string>(
    latestMutationSequenceRef,
    (id) => voiceService.removeHistoryEntry(id),
  );
  const permissionsMutation = useVoiceEvidenceMutation<void>(
    latestMutationSequenceRef,
    () => voiceService.requestPermissions(),
  );
  const accessibilityPermissionMutation = useVoiceEvidenceMutation<void>(
    latestMutationSequenceRef,
    () => voiceService.requestAccessibilityPermission(),
  );
  const setGlobalShortcutMutation = useVoiceEvidenceMutation<string | null | undefined>(
    latestMutationSequenceRef,
    (shortcut) => voiceService.setGlobalShortcut(shortcut),
  );
  const captureTriggerKeyMutation = useVoiceEvidenceMutation<string>(
    latestMutationSequenceRef,
    (style) => voiceService.captureTriggerKey(style),
  );
  const cancelTriggerCaptureMutation = useVoiceEvidenceMutation<void>(
    latestMutationSequenceRef,
    () => voiceService.cancelTriggerCapture(),
  );
  const setTriggerListenerSuppressedMutation = useVoiceEvidenceMutation<boolean>(
    latestMutationSequenceRef,
    (suppressed) => voiceService.setTriggerListenerSuppressed(suppressed),
  );
  const setTriggerKeyMutation = useVoiceEvidenceMutation<VoiceTriggerKeyInput>(
    latestMutationSequenceRef,
    (input) => voiceService.setTriggerKey(input),
  );
  const setTriggerBindingsMutation = useVoiceEvidenceMutation<VoiceTriggerBindingsInput>(
    latestMutationSequenceRef,
    (input) => voiceService.setTriggerBindings(input),
  );
  const updateRuntimeSettingsMutation = useVoiceEvidenceMutation<VoiceRuntimeSettingsInput>(
    latestMutationSequenceRef,
    (input) => voiceService.updateRuntimeSettings(input),
  );
  const setProcessingModeIdMutation = useVoiceEvidenceMutation<VoiceProcessingModeInput>(
    latestMutationSequenceRef,
    ({ modeId, processingMode }) =>
      voiceService.setProcessingModeId(modeId, processingMode),
  );
  const startCaptureMutation = useVoiceEvidenceMutation<void>(
    latestMutationSequenceRef,
    () => voiceService.startCapture(),
  );
  const stopCaptureMutation = useVoiceEvidenceMutation<void>(
    latestMutationSequenceRef,
    () => voiceService.stopCapture(),
  );
  const injectTextMutation = useVoiceEvidenceMutation<VoiceInjectInput>(
    latestMutationSequenceRef,
    ({ text, expectedBundleId }) => voiceService.injectText(text, expectedBundleId),
  );
  const showSearchOverlayMutation = useVoiceEvidenceMutation<VoiceOverlayInput>(
    latestMutationSequenceRef,
    ({ query, output }) => voiceService.showSearchOverlay(query, output),
  );
  const setModeShortcutMutation = useVoiceEvidenceMutation<VoiceModeShortcutInput>(
    latestMutationSequenceRef,
    (input) => voiceService.setModeShortcut(input),
  );
  const removeModeShortcutMutation = useVoiceEvidenceMutation<string>(
    latestMutationSequenceRef,
    (modeId) => voiceService.removeModeShortcut(modeId),
  );

  const isAnyMutationPending =
    upsertTemplateMutation.isPending ||
    removeTemplateMutation.isPending ||
    upsertVocabularyMutation.isPending ||
    removeVocabularyMutation.isPending ||
    replaceVocabularyKindMutation.isPending ||
    removeVocabularyAppScopeMutation.isPending ||
    upsertVocabularyAppScopeMutation.isPending ||
    resolveVocabularyAppInfoMutation.isPending ||
    generatePromptMutation.isPending ||
    loadLlmConfigMutation.isPending ||
    saveLlmConfigMutation.isPending ||
    testLlmConfigMutation.isPending ||
    loadAsrConfigMutation.isPending ||
    saveAsrConfigMutation.isPending ||
    testAsrConfigMutation.isPending ||
    removeHistoryEntryMutation.isPending ||
    permissionsMutation.isPending ||
    accessibilityPermissionMutation.isPending ||
    setGlobalShortcutMutation.isPending ||
    captureTriggerKeyMutation.isPending ||
    cancelTriggerCaptureMutation.isPending ||
    setTriggerListenerSuppressedMutation.isPending ||
    setTriggerKeyMutation.isPending ||
    setTriggerBindingsMutation.isPending ||
    updateRuntimeSettingsMutation.isPending ||
    setProcessingModeIdMutation.isPending ||
    startCaptureMutation.isPending ||
    stopCaptureMutation.isPending ||
    injectTextMutation.isPending ||
    showSearchOverlayMutation.isPending ||
    setModeShortcutMutation.isPending ||
    removeModeShortcutMutation.isPending;

  return {
    workspaceQuery,
    runtimeQuery,
    requestPermissionsAction: {
      id: "request-permissions",
      labelKey: "voice.requestPermissions",
      run: () => permissionsMutation.mutateAsync(),
      isPending: permissionsMutation.isPending,
    },
    requestAccessibilityAction: {
      id: "request-accessibility-permission",
      labelKey: "voice.requestAccessibilityPermission",
      run: () => accessibilityPermissionMutation.mutateAsync(),
      isPending: accessibilityPermissionMutation.isPending,
    },
    workspaceActions: {
      upsertTemplate: {
        run: (input: VoiceTemplateInput) => upsertTemplateMutation.mutateAsync(input),
        isPending: upsertTemplateMutation.isPending,
      },
      removeTemplate: {
        run: (id: string) => removeTemplateMutation.mutateAsync(id),
        isPending: removeTemplateMutation.isPending,
      },
      upsertVocabulary: {
        run: (input: VoiceVocabularyInput) =>
          upsertVocabularyMutation.mutateAsync(input),
        isPending: upsertVocabularyMutation.isPending,
      },
      removeVocabulary: {
        run: (id: string) => removeVocabularyMutation.mutateAsync(id),
        isPending: removeVocabularyMutation.isPending,
      },
      replaceVocabularyKind: {
        run: (input: VoiceVocabularyKindInput) =>
          replaceVocabularyKindMutation.mutateAsync(input),
        isPending: replaceVocabularyKindMutation.isPending,
      },
      removeVocabularyAppScope: {
        run: (appBundleId: string) =>
          removeVocabularyAppScopeMutation.mutateAsync(appBundleId),
        isPending: removeVocabularyAppScopeMutation.isPending,
      },
      upsertVocabularyAppScope: {
        run: (input: VoiceVocabularyAppScopeInput) =>
          upsertVocabularyAppScopeMutation.mutateAsync(input),
        isPending: upsertVocabularyAppScopeMutation.isPending,
      },
      resolveVocabularyAppInfo: {
        run: (path: string) => resolveVocabularyAppInfoMutation.mutateAsync(path),
        isPending: resolveVocabularyAppInfoMutation.isPending,
      },
      removeHistoryEntry: {
        run: (id: string) => removeHistoryEntryMutation.mutateAsync(id),
        isPending: removeHistoryEntryMutation.isPending,
      },
    },
    generationActions: {
      generatePrompt: {
        run: (input: VoiceGeneratePromptInput) =>
          generatePromptMutation.mutateAsync(input),
        isPending: generatePromptMutation.isPending,
      },
    },
    configActions: {
      loadLlmConfig: {
        run: (provider: string) => loadLlmConfigMutation.mutateAsync(provider),
        isPending: loadLlmConfigMutation.isPending,
      },
      saveLlmConfig: {
        run: (input: VoiceLlmConfigInput) => saveLlmConfigMutation.mutateAsync(input),
        isPending: saveLlmConfigMutation.isPending,
      },
      testLlmConfig: {
        run: (input: VoiceLlmConfigInput) => testLlmConfigMutation.mutateAsync(input),
        isPending: testLlmConfigMutation.isPending,
      },
      loadAsrConfig: {
        run: (provider: string) => loadAsrConfigMutation.mutateAsync(provider),
        isPending: loadAsrConfigMutation.isPending,
      },
      saveAsrConfig: {
        run: (input: VoiceAsrConfigInput) => saveAsrConfigMutation.mutateAsync(input),
        isPending: saveAsrConfigMutation.isPending,
      },
      testAsrConfig: {
        run: (input: VoiceAsrConfigInput) => testAsrConfigMutation.mutateAsync(input),
        isPending: testAsrConfigMutation.isPending,
      },
    },
    runtimeActions: {
      setGlobalShortcut: {
        run: (shortcut?: string | null) =>
          setGlobalShortcutMutation.mutateAsync(shortcut),
        isPending: setGlobalShortcutMutation.isPending,
      },
      captureTriggerKey: {
        run: (style: string) => captureTriggerKeyMutation.mutateAsync(style),
        isPending: captureTriggerKeyMutation.isPending,
      },
      cancelTriggerCapture: {
        run: () => cancelTriggerCaptureMutation.mutateAsync(),
        isPending: cancelTriggerCaptureMutation.isPending,
      },
      setTriggerListenerSuppressed: {
        run: (suppressed: boolean) =>
          setTriggerListenerSuppressedMutation.mutateAsync(suppressed),
        isPending: setTriggerListenerSuppressedMutation.isPending,
      },
      setTriggerKey: {
        run: (input: VoiceTriggerKeyInput) =>
          setTriggerKeyMutation.mutateAsync(input),
        isPending: setTriggerKeyMutation.isPending,
      },
      setTriggerBindings: {
        run: (input: VoiceTriggerBindingsInput) =>
          setTriggerBindingsMutation.mutateAsync(input),
        isPending: setTriggerBindingsMutation.isPending,
      },
      updateRuntimeSettings: {
        run: (input: VoiceRuntimeSettingsInput) =>
          updateRuntimeSettingsMutation.mutateAsync(input),
        isPending: updateRuntimeSettingsMutation.isPending,
      },
      setProcessingModeId: {
        run: (input: VoiceProcessingModeInput) =>
          setProcessingModeIdMutation.mutateAsync(input),
        isPending: setProcessingModeIdMutation.isPending,
      },
      startCapture: {
        run: () => startCaptureMutation.mutateAsync(),
        isPending: startCaptureMutation.isPending,
      },
      stopCapture: {
        run: () => stopCaptureMutation.mutateAsync(),
        isPending: stopCaptureMutation.isPending,
      },
      injectText: {
        run: (input: VoiceInjectInput) => injectTextMutation.mutateAsync(input),
        isPending: injectTextMutation.isPending,
      },
      showSearchOverlay: {
        run: (input: VoiceOverlayInput) =>
          showSearchOverlayMutation.mutateAsync(input),
        isPending: showSearchOverlayMutation.isPending,
      },
      setModeShortcut: {
        run: (input: VoiceModeShortcutInput) =>
          setModeShortcutMutation.mutateAsync(input),
        isPending: setModeShortcutMutation.isPending,
      },
      removeModeShortcut: {
        run: (modeId: string) => removeModeShortcutMutation.mutateAsync(modeId),
        isPending: removeModeShortcutMutation.isPending,
      },
    },
    isAnyMutationPending,
  };
}
