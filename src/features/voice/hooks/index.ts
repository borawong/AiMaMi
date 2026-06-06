import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useModuleCacheController } from "@/features/_shared/controller";
import { voiceService } from "@/services/voice";
import type {
  VoiceHeaderModel,
  VoiceMetricModel,
} from "../types";
import {
  invalidateVoiceContractQueries,
  nextVoiceCacheSequence,
  runVoiceQuery,
  selectVoiceRuntimeFacts,
  selectVoiceWorkspaceFacts,
  VoiceCache,
  VOICE_RUNTIME_QUERY_KEY,
  VOICE_WORKSPACE_QUERY_KEY,
  writeVoiceMutationPayload,
} from "../cache";

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

function useVoiceEvidenceMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<unknown>,
) {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, TVariables, VoiceMutationContext>({
    mutationFn,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: VoiceCache.queryKeys.root });
      const receivedAt = Date.now();
      const sequence = nextVoiceCacheSequence();
      return { sequence, receivedAt };
    },
    onSuccess: (payload, _variables, context) => {
      if (
        !context ||
        !writeVoiceMutationPayload(
          queryClient,
          payload,
          context.sequence,
          context.receivedAt,
        )
      ) {
        return;
      }

      void invalidateVoiceContractQueries(queryClient);
    },
  });
}

export function useVoiceModule() {
  const queryClient = useQueryClient();

  const workspaceQuery = useQuery({
    queryKey: VOICE_WORKSPACE_QUERY_KEY,
    queryFn: ({ signal }) =>
      runVoiceQuery(
        queryClient,
        VOICE_WORKSPACE_QUERY_KEY,
        "workspace",
        () => voiceService.loadWorkspace(),
        signal,
      ),
    staleTime: 30_000,
  });
  const runtimeQuery = useQuery({
    queryKey: VOICE_RUNTIME_QUERY_KEY,
    queryFn: ({ signal }) =>
      runVoiceQuery(
        queryClient,
        VOICE_RUNTIME_QUERY_KEY,
        "runtime",
        () => voiceService.loadRuntimeStatus(),
        signal,
      ),
    staleTime: 30_000,
  });

  const upsertTemplateMutation = useVoiceEvidenceMutation<VoiceTemplateInput>(
    (input) => voiceService.upsertTemplate(input),
  );
  const removeTemplateMutation = useVoiceEvidenceMutation<string>((id) =>
    voiceService.removeTemplate(id),
  );
  const upsertVocabularyMutation = useVoiceEvidenceMutation<VoiceVocabularyInput>(
    (input) => voiceService.upsertVocabulary(input),
  );
  const removeVocabularyMutation = useVoiceEvidenceMutation<string>((id) =>
    voiceService.removeVocabulary(id),
  );
  const replaceVocabularyKindMutation =
    useVoiceEvidenceMutation<VoiceVocabularyKindInput>((input) =>
      voiceService.replaceVocabularyKind(input),
    );
  const removeVocabularyAppScopeMutation = useVoiceEvidenceMutation<string>(
    (appBundleId) => voiceService.removeVocabularyAppScope(appBundleId),
  );
  const upsertVocabularyAppScopeMutation =
    useVoiceEvidenceMutation<VoiceVocabularyAppScopeInput>((input) =>
      voiceService.upsertVocabularyAppScope(input),
    );
  const resolveVocabularyAppInfoMutation = useVoiceEvidenceMutation<string>(
    (path) => voiceService.resolveVocabularyAppInfo(path),
  );
  const generatePromptMutation = useVoiceEvidenceMutation<VoiceGeneratePromptInput>(
    (input) => voiceService.generatePrompt(input),
  );
  const loadLlmConfigMutation = useVoiceEvidenceMutation<string>((provider) =>
    voiceService.loadLlmConfig(provider),
  );
  const saveLlmConfigMutation = useVoiceEvidenceMutation<VoiceLlmConfigInput>(
    (input) => voiceService.saveLlmConfig(input),
  );
  const testLlmConfigMutation = useVoiceEvidenceMutation<VoiceLlmConfigInput>(
    (input) => voiceService.testLlmConfig(input),
  );
  const loadAsrConfigMutation = useVoiceEvidenceMutation<string>((provider) =>
    voiceService.loadAsrConfig(provider),
  );
  const saveAsrConfigMutation = useVoiceEvidenceMutation<VoiceAsrConfigInput>(
    (input) => voiceService.saveAsrConfig(input),
  );
  const testAsrConfigMutation = useVoiceEvidenceMutation<VoiceAsrConfigInput>(
    (input) => voiceService.testAsrConfig(input),
  );
  const removeHistoryEntryMutation = useVoiceEvidenceMutation<string>((id) =>
    voiceService.removeHistoryEntry(id),
  );
  const permissionsMutation = useVoiceEvidenceMutation<void>(() =>
    voiceService.requestPermissions(),
  );
  const accessibilityPermissionMutation = useVoiceEvidenceMutation<void>(() =>
    voiceService.requestAccessibilityPermission(),
  );
  const setGlobalShortcutMutation =
    useVoiceEvidenceMutation<string | null | undefined>((shortcut) =>
      voiceService.setGlobalShortcut(shortcut),
    );
  const captureTriggerKeyMutation = useVoiceEvidenceMutation<string>((style) =>
    voiceService.captureTriggerKey(style),
  );
  const cancelTriggerCaptureMutation = useVoiceEvidenceMutation<void>(() =>
    voiceService.cancelTriggerCapture(),
  );
  const setTriggerListenerSuppressedMutation =
    useVoiceEvidenceMutation<boolean>((suppressed) =>
      voiceService.setTriggerListenerSuppressed(suppressed),
    );
  const setTriggerKeyMutation = useVoiceEvidenceMutation<VoiceTriggerKeyInput>(
    (input) => voiceService.setTriggerKey(input),
  );
  const setTriggerBindingsMutation =
    useVoiceEvidenceMutation<VoiceTriggerBindingsInput>((input) =>
      voiceService.setTriggerBindings(input),
    );
  const updateRuntimeSettingsMutation =
    useVoiceEvidenceMutation<VoiceRuntimeSettingsInput>((input) =>
      voiceService.updateRuntimeSettings(input),
    );
  const setProcessingModeIdMutation =
    useVoiceEvidenceMutation<VoiceProcessingModeInput>(
      ({ modeId, processingMode }) =>
        voiceService.setProcessingModeId(modeId, processingMode),
    );
  const startCaptureMutation = useVoiceEvidenceMutation<void>(() =>
    voiceService.startCapture(),
  );
  const stopCaptureMutation = useVoiceEvidenceMutation<void>(() =>
    voiceService.stopCapture(),
  );
  const injectTextMutation = useVoiceEvidenceMutation<VoiceInjectInput>(
    ({ text, expectedBundleId }) => voiceService.injectText(text, expectedBundleId),
  );
  const showSearchOverlayMutation = useVoiceEvidenceMutation<VoiceOverlayInput>(
    ({ query, output }) => voiceService.showSearchOverlay(query, output),
  );
  const setModeShortcutMutation = useVoiceEvidenceMutation<VoiceModeShortcutInput>(
    (input) => voiceService.setModeShortcut(input),
  );
  const removeModeShortcutMutation = useVoiceEvidenceMutation<string>((modeId) =>
    voiceService.removeModeShortcut(modeId),
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
    workspaceFacts: selectVoiceWorkspaceFacts(workspaceQuery.data),
    runtimeFacts: selectVoiceRuntimeFacts(runtimeQuery.data),
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

export type VoiceModuleView = ReturnType<typeof useVoiceModule>;

export interface VoicePageController {
  header: VoiceHeaderModel;
  metrics: VoiceMetricModel[];
  module: VoiceModuleView;
}

export function useVoicePageController(): VoicePageController {
  const module = useVoiceModule();
  const { workspaceFacts, runtimeFacts } = module;

  return {
    header: {
      titleKey: "nav.voice",
      descriptionKey: "voice.description",
    },
    metrics: [
      {
        id: "templates",
        labelKey: "voice.templateCount",
        kind: "count",
        icon: "templates",
        value: workspaceFacts.templates.length,
      },
      {
        id: "vocabulary",
        labelKey: "voice.vocabularyCount",
        kind: "count",
        icon: "vocabulary",
        value: workspaceFacts.vocabulary.length,
      },
      {
        id: "history",
        labelKey: "voice.historyCount",
        kind: "count",
        icon: "history",
        value: workspaceFacts.history.length,
      },
      {
        id: "runtime",
        labelKey: "voice.runtimeEnabled",
        kind: "runtime",
        supported: runtimeFacts.supported,
        enabled: runtimeFacts.enabled,
        captureState: runtimeFacts.captureState,
      },
    ],
    module,
  };
}
