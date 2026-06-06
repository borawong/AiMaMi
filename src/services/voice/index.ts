import {
  invokeIpc,
  type IpcEvidencePayload,
  type IpcJsonObject,
} from "@/contracts/ipc";
import type {
  CoreEnvelope,
  VoiceAsrConfigPayload,
  VoiceGeneratePayload,
  VoiceLlmConfigPayload,
  VoiceProcessingMode,
  VoiceRuntimeStatusPayload,
  VoiceSpeechModel,
  VoiceTemplateMutationPayload,
  VoiceTriggerStyle,
  VoiceVocabularyMutationPayload,
  VoiceWorkspacePayload,
} from "@/types";

export interface VoiceGeneratePromptInput extends IpcJsonObject {
  asrDurationMs?: number | null;
  asrEmotion?: string | null;
  asrErrorCode?: string | null;
  asrLanguage?: string | null;
  asrModel?: string | null;
  asrProvider?: string | null;
  clipboardText?: string | null;
  llmApiKey?: string | null;
  llmBaseUrl?: string | null;
  llmModel?: string | null;
  llmProvider?: string | null;
  promptOverride?: string | null;
  rawText?: string | null;
  selectedText?: string | null;
  targetAppName?: string | null;
  targetBundleId?: string | null;
  templateId?: string | null;
  templateKind?: string | null;
  templateTitle?: string | null;
}

export interface VoiceTriggerKeyInput extends IpcJsonObject {
  keyCode: number;
  keyKind: string;
  keyLabel: string;
  modifierMask?: number | null;
  style: string;
}

export interface VoiceTriggerBindingsInput extends IpcJsonObject {
  activeStyle: VoiceTriggerStyle | string;
  hold: VoiceTriggerBindingKey;
  toggle: VoiceTriggerBindingKey;
}

export interface VoiceTriggerBindingKey extends IpcJsonObject {
  keyCode: number;
  keyKind: string;
  keyLabel: string;
  modifierMask?: number | null;
}

export interface VoiceRuntimeSettingsInput extends IpcJsonObject {
  enabled: boolean;
  processingMode?: VoiceProcessingMode | null;
  processingModeId?: string | null;
  shortcut?: string | null;
  speechModel?: VoiceSpeechModel | null;
}

export interface VoiceModeShortcutInput extends VoiceTriggerKeyInput {
  modeId: string;
}

export const voiceService = {
  loadWorkspace: () =>
    invokeIpc<CoreEnvelope<VoiceWorkspacePayload>>("load_voice_workspace"),

  upsertTemplate: (input: {
    id?: string | null;
    title: string;
    description: string;
    content: string;
  }) =>
    invokeIpc<CoreEnvelope<VoiceTemplateMutationPayload>>("upsert_voice_template", {
      id: input.id ?? null,
      title: input.title,
      description: input.description,
      content: input.content,
    }),

  removeTemplate: (id: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("remove_voice_template", { id }),

  upsertVocabulary: (input: {
    id?: string | null;
    source: string;
    replacement: string;
    kind: string;
    appBundleId?: string | null;
    appName?: string | null;
    notes?: string | null;
  }) =>
    invokeIpc<CoreEnvelope<VoiceVocabularyMutationPayload>>(
      "upsert_voice_vocabulary",
      {
        id: input.id ?? null,
        source: input.source,
        replacement: input.replacement,
        kind: input.kind,
        appBundleId: input.appBundleId ?? null,
        appName: input.appName ?? null,
        notes: input.notes ?? null,
      },
    ),

  removeVocabulary: (id: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("remove_voice_vocabulary", {
      id,
    }),

  replaceVocabularyKind: (input: {
    kind: string;
    entries: IpcJsonObject[];
    appBundleId?: string | null;
    appName?: string | null;
  }) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("replace_voice_vocabulary_kind", {
      kind: input.kind,
      entries: input.entries,
      appBundleId: input.appBundleId ?? null,
      appName: input.appName ?? null,
    }),

  removeVocabularyAppScope: (appBundleId: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>(
      "remove_voice_vocabulary_app_scope",
      { appBundleId },
    ),

  upsertVocabularyAppScope: (input: {
    bundleId: string;
    name: string;
    path: string;
  }) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>(
      "upsert_voice_vocabulary_app_scope",
      {
        bundleId: input.bundleId,
        name: input.name,
        path: input.path,
      },
    ),

  resolveVocabularyAppInfo: (path: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("resolve_voice_vocabulary_app_info", {
      path,
    }),

  generatePrompt: (input: VoiceGeneratePromptInput) =>
    invokeIpc<CoreEnvelope<VoiceGeneratePayload>>("generate_voice_prompt", input),

  loadLlmConfig: (provider: string) =>
    invokeIpc<CoreEnvelope<VoiceLlmConfigPayload>>("load_voice_llm_config", {
      provider,
    }),

  saveLlmConfig: (input: {
    llmProvider: string;
    llmApiKey: string;
    llmModel: string;
    llmBaseUrl: string;
  }) => invokeIpc<CoreEnvelope<VoiceLlmConfigPayload>>("save_voice_llm_config", input),

  testLlmConfig: (input: {
    llmProvider: string;
    llmApiKey: string;
    llmModel: string;
    llmBaseUrl: string;
  }) => invokeIpc<CoreEnvelope<IpcEvidencePayload>>("test_voice_llm_config", input),

  loadAsrConfig: (provider: string) =>
    invokeIpc<CoreEnvelope<VoiceAsrConfigPayload>>("load_voice_asr_config", {
      provider,
    }),

  saveAsrConfig: (input: {
    asrProvider: string;
    asrApiKey: string;
    asrModel: string;
    asrBaseUrl: string;
  }) => invokeIpc<CoreEnvelope<VoiceAsrConfigPayload>>("save_voice_asr_config", input),

  testAsrConfig: (input: {
    asrProvider: string;
    asrApiKey: string;
    asrModel: string;
    asrBaseUrl: string;
  }) => invokeIpc<CoreEnvelope<IpcEvidencePayload>>("test_voice_asr_config", input),

  removeHistoryEntry: (id: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("remove_voice_history_entry", {
      id,
    }),

  loadRuntimeStatus: () =>
    invokeIpc<CoreEnvelope<VoiceRuntimeStatusPayload>>(
      "load_voice_runtime_status",
    ),

  requestPermissions: () =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("request_voice_permissions"),

  requestAccessibilityPermission: () =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("request_accessibility_permission"),

  setGlobalShortcut: (shortcut?: string | null) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("set_voice_global_shortcut", {
      shortcut: shortcut ?? null,
    }),

  captureTriggerKey: (style: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("capture_voice_trigger_key", {
      style,
    }),

  cancelTriggerCapture: () =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("cancel_voice_trigger_capture"),

  setTriggerListenerSuppressed: (suppressed: boolean) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>(
      "set_voice_trigger_listener_suppressed",
      { suppressed },
    ),

  setTriggerKey: (input: VoiceTriggerKeyInput) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("set_voice_trigger_key", {
      keyCode: input.keyCode,
      keyLabel: input.keyLabel,
      keyKind: input.keyKind,
      style: input.style,
      modifierMask: input.modifierMask ?? 0,
    }),

  setTriggerBindings: (input: VoiceTriggerBindingsInput) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("set_voice_trigger_bindings", {
      activeStyle: input.activeStyle,
      holdKeyCode: input.hold.keyCode,
      holdKeyLabel: input.hold.keyLabel,
      holdKeyKind: input.hold.keyKind,
      holdModifierMask: input.hold.modifierMask ?? 0,
      toggleKeyCode: input.toggle.keyCode,
      toggleKeyLabel: input.toggle.keyLabel,
      toggleKeyKind: input.toggle.keyKind,
      toggleModifierMask: input.toggle.modifierMask ?? 0,
    }),

  updateRuntimeSettings: (input: VoiceRuntimeSettingsInput) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("update_voice_runtime_settings", {
      enabled: input.enabled,
      shortcut: input.shortcut ?? null,
      speechModel: input.speechModel ?? null,
      processingMode: input.processingMode ?? null,
      processingModeId: input.processingModeId ?? null,
    }),

  setProcessingModeId: (modeId: string, processingMode?: string | null) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("set_voice_processing_mode_id", {
      modeId,
      processingMode: processingMode ?? null,
    }),

  startCapture: () =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("start_voice_capture"),

  stopCapture: () =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("stop_voice_capture"),

  injectText: (text: string, expectedBundleId?: string | null) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("inject_voice_text", {
      text,
      expectedBundleId: expectedBundleId ?? null,
    }),

  showSearchOverlay: (query: string, output: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("show_voice_search_overlay", {
      query,
      output,
    }),

  setModeShortcut: (input: VoiceModeShortcutInput) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("set_voice_mode_shortcut", {
      modeId: input.modeId,
      keyCode: input.keyCode,
      keyLabel: input.keyLabel,
      keyKind: input.keyKind,
      style: input.style,
      modifierMask: input.modifierMask ?? 0,
    }),

  removeModeShortcut: (modeId: string) =>
    invokeIpc<CoreEnvelope<IpcEvidencePayload>>("remove_voice_mode_shortcut", {
      modeId,
    }),
};
