/*
Restoration tier: P1
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-command-set.json; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-contracts.jsonl
Frontend module: services/voice
This file is a structured reconstruction scaffold, not recovered original source.
*/
import { invokeIpc } from "@/contracts/ipc";
import type {
  CoreEnvelope,
  VoiceAsrConfigPayload,
  VoiceGeneratePayload,
  VoiceLlmConfigPayload,
  VoiceRuntimeStatusPayload,
  VoiceWorkspacePayload,
} from "@/types";

export const voiceService = {
  loadWorkspace: () =>
    invokeIpc<CoreEnvelope<VoiceWorkspacePayload>>("load_voice_workspace"),

  upsertTemplate: (input: {
    id?: string | null;
    title: string;
    description: string;
    content: string;
  }) =>
    invokeIpc<CoreEnvelope<unknown>>("upsert_voice_template", {
      id: input.id ?? null,
      title: input.title,
      description: input.description,
      content: input.content,
    }),

  removeTemplate: (id: string) =>
    invokeIpc<CoreEnvelope<unknown>>("remove_voice_template", { id }),

  upsertVocabulary: (input: {
    id?: string | null;
    source: string;
    replacement: string;
    kind: string;
    appBundleId?: string | null;
    appName?: string | null;
    notes?: string | null;
  }) =>
    invokeIpc<CoreEnvelope<unknown>>("upsert_voice_vocabulary", {
      id: input.id ?? null,
      source: input.source,
      replacement: input.replacement,
      kind: input.kind,
      appBundleId: input.appBundleId ?? null,
      appName: input.appName ?? null,
      notes: input.notes ?? null,
    }),

  removeVocabulary: (id: string) =>
    invokeIpc<CoreEnvelope<unknown>>("remove_voice_vocabulary", { id }),

  replaceVocabularyKind: (input: {
    kind: string;
    source: string;
    replacement: string;
    entries: unknown[];
    appBundleId?: string | null;
    appName?: string | null;
    notes?: string | null;
  }) =>
    invokeIpc<CoreEnvelope<unknown>>("replace_voice_vocabulary_kind", {
      kind: input.kind,
      source: input.source,
      replacement: input.replacement,
      entries: input.entries,
      appBundleId: input.appBundleId ?? null,
      appName: input.appName ?? null,
      notes: input.notes ?? null,
    }),

  removeVocabularyAppScope: (appBundleId: string) =>
    invokeIpc<CoreEnvelope<unknown>>("remove_voice_vocabulary_app_scope", {
      appBundleId,
    }),

  upsertVocabularyAppScope: (input: {
    bundleId: string;
    name: string;
    path: string;
  }) =>
    invokeIpc<CoreEnvelope<unknown>>("upsert_voice_vocabulary_app_scope", {
      bundleId: input.bundleId,
      name: input.name,
      path: input.path,
    }),

  resolveVocabularyAppInfo: (path: string) =>
    invokeIpc<CoreEnvelope<unknown>>("resolve_voice_vocabulary_app_info", {
      path,
    }),

  generatePrompt: (input: Record<string, unknown>) =>
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
  }) => invokeIpc<CoreEnvelope<unknown>>("test_voice_llm_config", input),

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
  }) => invokeIpc<CoreEnvelope<unknown>>("test_voice_asr_config", input),

  removeHistoryEntry: (id: string) =>
    invokeIpc<CoreEnvelope<unknown>>("remove_voice_history_entry", { id }),

  loadRuntimeStatus: () =>
    invokeIpc<CoreEnvelope<VoiceRuntimeStatusPayload>>(
      "load_voice_runtime_status",
    ),

  requestPermissions: () =>
    invokeIpc<CoreEnvelope<unknown>>("request_voice_permissions"),

  requestAccessibilityPermission: () =>
    invokeIpc<CoreEnvelope<unknown>>("request_accessibility_permission"),

  setGlobalShortcut: (shortcut?: string | null) =>
    invokeIpc<CoreEnvelope<unknown>>("set_voice_global_shortcut", {
      shortcut: shortcut ?? null,
    }),

  captureTriggerKey: (style: string) =>
    invokeIpc<CoreEnvelope<unknown>>("capture_voice_trigger_key", { style }),

  cancelTriggerCapture: () =>
    invokeIpc<CoreEnvelope<unknown>>("cancel_voice_trigger_capture"),

  setTriggerListenerSuppressed: (suppressed: boolean) =>
    invokeIpc<CoreEnvelope<unknown>>(
      "set_voice_trigger_listener_suppressed",
      { suppressed },
    ),

  setTriggerKey: (input: Record<string, unknown>) =>
    invokeIpc<CoreEnvelope<unknown>>("set_voice_trigger_key", input),

  setTriggerBindings: (input: Record<string, unknown>) =>
    invokeIpc<CoreEnvelope<unknown>>("set_voice_trigger_bindings", input),

  updateRuntimeSettings: (input: Record<string, unknown>) =>
    invokeIpc<CoreEnvelope<unknown>>("update_voice_runtime_settings", input),

  setProcessingModeId: (modeId: string, processingMode?: string | null) =>
    invokeIpc<CoreEnvelope<unknown>>("set_voice_processing_mode_id", {
      modeId,
      processingMode: processingMode ?? null,
    }),

  startCapture: () => invokeIpc<CoreEnvelope<unknown>>("start_voice_capture"),

  stopCapture: () => invokeIpc<CoreEnvelope<unknown>>("stop_voice_capture"),

  injectText: (text: string, expectedBundleId?: string | null) =>
    invokeIpc<CoreEnvelope<unknown>>("inject_voice_text", {
      text,
      expectedBundleId: expectedBundleId ?? null,
    }),

  showSearchOverlay: (query: string, output: string) =>
    invokeIpc<CoreEnvelope<unknown>>("show_voice_search_overlay", {
      query,
      output,
    }),

  setModeShortcut: (input: Record<string, unknown>) =>
    invokeIpc<CoreEnvelope<unknown>>("set_voice_mode_shortcut", input),

  removeModeShortcut: (modeId: string) =>
    invokeIpc<CoreEnvelope<unknown>>("remove_voice_mode_shortcut", { modeId }),
};
