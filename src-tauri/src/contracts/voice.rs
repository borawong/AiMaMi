use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) enum VoiceTemplateKind {
    #[default]
    Dictation,
    Task,
    Review,
    Translation,
    Summary,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub(crate) enum VoiceVocabularyKind {
    #[default]
    Hotword,
    Mapping,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) enum VoiceSpeechModel {
    AppleSpeech,
    AliyunFunAsr,
    Openai,
    #[default]
    Unsupported,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) enum VoiceProcessingMode {
    #[default]
    Dictation,
    Task,
    Review,
    Summary,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) enum VoicePermissionState {
    Authorized,
    Denied,
    Restricted,
    NotDetermined,
    #[default]
    Unsupported,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) enum VoiceCaptureState {
    #[default]
    Idle,
    Starting,
    Recording,
    Stopping,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) enum VoiceTriggerStyle {
    #[default]
    Hold,
    Toggle,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct VoicePromptTemplate {
    pub id: String,
    pub title: String,
    pub description: String,
    pub kind: VoiceTemplateKind,
    pub content: String,
    pub built_in: bool,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct VoiceVocabularyEntry {
    pub id: String,
    pub source: String,
    pub replacement: String,
    pub kind: VoiceVocabularyKind,
    #[serde(default)]
    pub app_bundle_id: Option<String>,
    #[serde(default)]
    pub app_name: Option<String>,
    pub notes: Option<String>,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct VoiceVocabularyAppPayload {
    pub bundle_id: String,
    pub name: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct VoiceHistoryEntry {
    pub id: String,
    pub template_id: String,
    pub template_title: String,
    pub template_kind: VoiceTemplateKind,
    #[serde(default)]
    pub prompt_content: String,
    pub raw_text: String,
    pub rendered_text: String,
    pub selected_text: String,
    pub clipboard_text: String,
    #[serde(default)]
    pub target_bundle_id: String,
    #[serde(default)]
    pub target_app_name: String,
    #[serde(default = "default_voice_history_status")]
    pub status: String,
    #[serde(default)]
    pub processing_error: Option<String>,
    #[serde(default)]
    pub asr_provider: String,
    #[serde(default)]
    pub asr_model: String,
    #[serde(default)]
    pub asr_language: String,
    #[serde(default)]
    pub asr_emotion: String,
    #[serde(default)]
    pub asr_duration_ms: Option<u64>,
    #[serde(default)]
    pub asr_error_code: Option<String>,
    pub created_at: i64,
}

impl Default for VoiceHistoryEntry {
    fn default() -> Self {
        Self {
            id: String::new(),
            template_id: String::new(),
            template_title: String::new(),
            template_kind: VoiceTemplateKind::Dictation,
            prompt_content: String::new(),
            raw_text: String::new(),
            rendered_text: String::new(),
            selected_text: String::new(),
            clipboard_text: String::new(),
            target_bundle_id: String::new(),
            target_app_name: String::new(),
            status: default_voice_history_status(),
            processing_error: None,
            asr_provider: String::new(),
            asr_model: String::new(),
            asr_language: String::new(),
            asr_emotion: String::new(),
            asr_duration_ms: None,
            asr_error_code: None,
            created_at: 0,
        }
    }
}

fn default_voice_history_status() -> String {
    "completed".into()
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct VoiceWorkspacePayload {
    pub templates: Vec<VoicePromptTemplate>,
    pub vocabulary: Vec<VoiceVocabularyEntry>,
    #[serde(default)]
    pub vocabulary_apps: Vec<VoiceVocabularyAppPayload>,
    pub history: Vec<VoiceHistoryEntry>,
    pub source_path: String,
    pub last_updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct VoiceTemplateMutationPayload {
    pub workspace: VoiceWorkspacePayload,
    pub template: VoicePromptTemplate,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct VoiceVocabularyMutationPayload {
    pub workspace: VoiceWorkspacePayload,
    pub entry: VoiceVocabularyEntry,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct VoiceGeneratePayload {
    pub output: String,
    pub history_entry: VoiceHistoryEntry,
    pub workspace: VoiceWorkspacePayload,
    pub processing_status: String,
    pub processing_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct VoiceLlmConfigPayload {
    pub provider: String,
    pub api_key: String,
    pub model: String,
    pub base_url: String,
    pub configured: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct VoiceAsrConfigPayload {
    pub provider: String,
    pub api_key: String,
    pub model: String,
    pub base_url: String,
    pub configured: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct VoiceRuntimePermissionsPayload {
    pub microphone: VoicePermissionState,
    pub speech_recognition: VoicePermissionState,
    pub accessibility: VoicePermissionState,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PerModeShortcutPayload {
    pub key_code: i64,
    pub key_label: String,
    pub key_kind: String,
    pub style: VoiceTriggerStyle,
    #[serde(default)]
    pub modifier_mask: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct VoiceRuntimeStatusPayload {
    pub supported: bool,
    pub enabled: bool,
    pub capture_state: VoiceCaptureState,
    pub permissions: VoiceRuntimePermissionsPayload,
    pub global_shortcut: String,
    pub trigger_key_code: i64,
    pub trigger_key_label: String,
    pub trigger_key_kind: String,
    pub trigger_style: VoiceTriggerStyle,
    #[serde(default)]
    pub trigger_modifier_mask: u64,
    pub hold_trigger_key_code: i64,
    pub hold_trigger_key_label: String,
    pub hold_trigger_key_kind: String,
    #[serde(default)]
    pub hold_trigger_modifier_mask: u64,
    pub toggle_trigger_key_code: i64,
    pub toggle_trigger_key_label: String,
    pub toggle_trigger_key_kind: String,
    #[serde(default)]
    pub toggle_trigger_modifier_mask: u64,
    pub speech_model: VoiceSpeechModel,
    #[serde(default)]
    pub recognition_language: String,
    pub processing_mode: VoiceProcessingMode,
    pub processing_mode_id: String,
    #[serde(default)]
    pub session_processing_mode_id: Option<String>,
    pub per_mode_shortcuts: HashMap<String, PerModeShortcutPayload>,
    pub live_text: String,
    pub committed_text: String,
    pub captured_selected_text: String,
    pub captured_clipboard_text: String,
    #[serde(default)]
    pub captured_target_bundle_id: String,
    #[serde(default)]
    pub captured_target_app_name: String,
    #[serde(default)]
    pub active_asr_provider: String,
    #[serde(default)]
    pub active_asr_model: String,
    #[serde(default)]
    pub detected_asr_language: String,
    #[serde(default)]
    pub detected_asr_emotion: String,
    #[serde(default)]
    pub last_asr_duration_ms: Option<u64>,
    #[serde(default)]
    pub last_asr_error_code: Option<String>,
    pub last_error: Option<String>,
    pub config_path: String,
    pub sidecar_path: Option<String>,
    #[serde(default = "default_auto_inject")]
    pub auto_inject: bool,
}

fn default_auto_inject() -> bool {
    true
}
