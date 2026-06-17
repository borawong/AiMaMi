use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum PlanType {
    Free,
    Plus,
    Pro5x,
    Pro20x,
    Team,
    Business,
    Enterprise,
    Edu,
    Unknown,
}

impl PlanType {
    pub fn title(&self) -> &str {
        match self {
            Self::Free => "Free",
            Self::Plus => "Plus",
            Self::Pro5x => "5x Pro",
            Self::Pro20x => "20x Pro",
            Self::Team => "Team",
            Self::Business => "Business",
            Self::Enterprise => "Enterprise",
            Self::Edu => "Edu",
            Self::Unknown => "Unknown",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum AuthMode {
    Chatgpt,
    Apikey,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum UsageSource {
    Local,
    Api,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash, Default)]
#[serde(rename_all = "lowercase")]
pub enum ApiProxyMode {
    #[default]
    Direct,
    Manual,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub enum AutoSwitchRuntimeState {
    Running,
    Stopped,
    NotInstalled,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum McpTransport {
    Stdio,
    Http,
    Sse,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum CustomInstructionProtectionState {
    Ready,
    Unmanaged,
    Protected,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum CustomInstructionHistoryAction {
    Apply,
    Clear,
    Rollback,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub enum VoiceTemplateKind {
    Dictation,
    Task,
    Review,
    Translation,
    Summary,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum VoiceVocabularyKind {
    Hotword,
    Mapping,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub enum VoiceSpeechModel {
    AppleSpeech,
    AliyunFunAsr,
    Openai,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub enum VoiceProcessingMode {
    Dictation,
    Task,
    Review,
    Summary,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub enum VoicePermissionState {
    Authorized,
    Denied,
    Restricted,
    NotDetermined,
    Unsupported,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub enum VoiceCaptureState {
    Idle,
    Starting,
    Recording,
    Stopping,
    Error,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub enum VoiceTriggerStyle {
    Hold,
    Toggle,
}

// ---------------------------------------------------------------------------
// Core data structs
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CoreWarning {
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RateLimitWindow {
    pub used_percent: f64,
    pub remaining_percent: i32,
    pub window_minutes: Option<i32>,
    pub resets_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppPathState {
    pub codex_home: String,
    pub accounts_path: String,
    pub auth_path: String,
    pub registry_path: String,
    pub sessions_path: String,
    pub launch_agent_path: String,
    pub auto_switch_log_path: String,
    pub auth_exists: bool,
    pub registry_exists: bool,
    pub sessions_exists: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ApiProxyConfigPayload {
    #[serde(default)]
    pub mode: ApiProxyMode,
    #[serde(default)]
    pub url: Option<String>,
}

impl Default for ApiProxyConfigPayload {
    fn default() -> Self {
        Self {
            mode: ApiProxyMode::Direct,
            url: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AutoSwitchStatusPayload {
    pub enabled: bool,
    pub threshold_5h_percent: i32,
    pub threshold_weekly_percent: i32,
    pub service_state: AutoSwitchRuntimeState,
    pub service_label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ApiConfigPayload {
    #[serde(default)]
    pub proxy: ApiProxyConfigPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ApiReachabilityStatus {
    Unknown,
    Reachable,
    Unreachable,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ApiConnectivityPayload {
    pub usage_status: ApiReachabilityStatus,
    pub usage_last_error: Option<String>,
}

// ---------------------------------------------------------------------------
// Response payloads
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppStatusPayload {
    pub paths: AppPathState,
    pub last_scan_at: i64,
    pub usage_source: UsageSource,
    pub auto_switch: AutoSwitchStatusPayload,
    pub api: ApiConfigPayload,
    pub api_connectivity: ApiConnectivityPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CoreSnapshotPayload {
    pub status: AppStatusPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CustomInstructionCurrentState {
    pub global_path: String,
    pub file_exists: bool,
    pub managed_block_present: bool,
    pub protection_state: CustomInstructionProtectionState,
    pub issue_message: Option<String>,
    pub managed_content: String,
    pub last_applied_at: Option<i64>,
    pub last_template_code: Option<String>,
    pub last_template_title: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CustomInstructionHistoryEntry {
    pub id: String,
    pub created_at: i64,
    pub action: CustomInstructionHistoryAction,
    pub source: String,
    pub template_code: Option<String>,
    pub template_title: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CustomInstructionStatePayload {
    pub current: CustomInstructionCurrentState,
    pub history: Vec<CustomInstructionHistoryEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CustomInstructionPreviewPayload {
    pub global_path: String,
    pub protection_state: CustomInstructionProtectionState,
    pub issue_message: Option<String>,
    pub current_managed_content: String,
    pub next_managed_content: String,
    pub resulting_content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VoicePromptTemplate {
    pub id: String,
    pub title: String,
    pub description: String,
    pub kind: VoiceTemplateKind,
    pub content: String,
    pub built_in: bool,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VoiceVocabularyEntry {
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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VoiceVocabularyAppPayload {
    pub bundle_id: String,
    pub name: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VoiceHistoryEntry {
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

fn default_voice_history_status() -> String {
    "completed".into()
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VoiceWorkspacePayload {
    pub templates: Vec<VoicePromptTemplate>,
    pub vocabulary: Vec<VoiceVocabularyEntry>,
    #[serde(default)]
    pub vocabulary_apps: Vec<VoiceVocabularyAppPayload>,
    pub history: Vec<VoiceHistoryEntry>,
    pub source_path: String,
    pub last_updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VoiceTemplateMutationPayload {
    pub workspace: VoiceWorkspacePayload,
    pub template: VoicePromptTemplate,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VoiceVocabularyMutationPayload {
    pub workspace: VoiceWorkspacePayload,
    pub entry: VoiceVocabularyEntry,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VoiceGeneratePayload {
    pub output: String,
    pub history_entry: VoiceHistoryEntry,
    pub workspace: VoiceWorkspacePayload,
    pub processing_status: String,
    pub processing_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VoiceLlmConfigPayload {
    pub provider: String,
    pub api_key: String,
    pub model: String,
    pub base_url: String,
    pub configured: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VoiceAsrConfigPayload {
    pub provider: String,
    pub api_key: String,
    pub model: String,
    pub base_url: String,
    pub configured: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VoiceRuntimePermissionsPayload {
    pub microphone: VoicePermissionState,
    pub speech_recognition: VoicePermissionState,
    /// macOS 辅助功能权限。用于合成 Cmd+V 把识别文本粘贴到光标位置。
    /// 其他平台永远为 `Unsupported`。
    #[serde(default = "default_accessibility_state")]
    pub accessibility: VoicePermissionState,
}

fn default_accessibility_state() -> VoicePermissionState {
    if cfg!(target_os = "macos") {
        VoicePermissionState::NotDetermined
    } else {
        VoicePermissionState::Unsupported
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PerModeShortcutPayload {
    pub key_code: i64,
    pub key_label: String,
    pub key_kind: String,
    pub style: VoiceTriggerStyle,
    /// 修饰键 mask（CGEventFlags & RELEVANT_MODIFIER_MASK）；0 表示单键。
    /// 旧前端 / 旧数据未提供时默认 0，向后兼容。
    #[serde(default)]
    pub modifier_mask: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VoiceRuntimeStatusPayload {
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
    #[serde(default = "default_recognition_language")]
    pub recognition_language: String,
    pub processing_mode: VoiceProcessingMode,
    pub processing_mode_id: String,
    #[serde(default)]
    pub session_processing_mode_id: Option<String>,
    pub per_mode_shortcuts: std::collections::HashMap<String, PerModeShortcutPayload>,
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

fn default_recognition_language() -> String {
    "auto".into()
}

fn default_auto_inject() -> bool {
    true
}

// ---------------------------------------------------------------------------
// SSH remote payloads
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "lowercase")]
pub enum SshSyncStatus {
    Success,
    Failed,
    Skipped,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SshServerConfig {
    pub alias: String,
    pub host: String,
    #[serde(default)]
    pub user: Option<String>,
    #[serde(default)]
    pub port: Option<u16>,
    #[serde(default)]
    pub key_path: Option<String>,
    #[serde(default = "default_remote_codex_home")]
    pub remote_codex_home: String,
    #[serde(default = "default_true_bool")]
    pub enabled: bool,
}

fn default_remote_codex_home() -> String {
    "~/.codex".into()
}

fn default_true_bool() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SshServerSummary {
    pub id: String,
    pub alias: String,
    pub host: String,
    #[serde(default)]
    pub user: Option<String>,
    #[serde(default)]
    pub port: Option<u16>,
    #[serde(default)]
    pub key_path: Option<String>,
    pub remote_codex_home: String,
    pub enabled: bool,
    #[serde(default)]
    pub last_sync_status: Option<SshSyncStatus>,
    #[serde(default)]
    pub last_synced_at: Option<i64>,
    #[serde(default)]
    pub last_error: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SshServerListPayload {
    pub items: Vec<SshServerSummary>,
    pub total: i32,
    pub source_path: String,
    pub last_scan_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SshConnectionTestPayload {
    #[serde(default)]
    pub server_id: Option<String>,
    pub reachable: bool,
    pub code: String,
    pub message: String,
    pub elapsed_ms: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SshSyncResult {
    pub server_id: String,
    pub alias: String,
    pub status: SshSyncStatus,
    #[serde(default)]
    pub message: Option<String>,
    #[serde(default)]
    pub synced_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SshSyncPayload {
    pub results: Vec<SshSyncResult>,
}

// ---------------------------------------------------------------------------
// MCP payloads
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct McpServerSummary {
    pub name: String,
    pub transport: McpTransport,
    pub enabled: bool,
    pub source_path: String,
    pub command: Option<String>,
    pub args: Vec<String>,
    pub url: Option<String>,
    pub headers: HashMap<String, String>,
    pub environment: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct McpServerListPayload {
    pub items: Vec<McpServerSummary>,
    pub total: i32,
    pub source_path: String,
    pub last_scan_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct McpServerMutationPayload {
    pub server: McpServerSummary,
    pub total: i32,
    pub source_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct McpServerRemovePayload {
    pub removed_name: String,
    pub total: i32,
    pub source_path: String,
}

// ---------------------------------------------------------------------------
// Skill payloads
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct InstalledSkillSummary {
    pub id: String,
    pub name: String,
    pub title: Option<String>,
    pub summary: Option<String>,
    pub relative_path: String,
    pub directory_path: String,
    pub skill_file_path: String,
    pub updated_at: Option<i64>,
}

impl InstalledSkillSummary {
    pub fn display_title(&self) -> &str {
        match &self.title {
            Some(t) if !t.is_empty() => t.as_str(),
            _ => &self.name,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SkillListPayload {
    pub items: Vec<InstalledSkillSummary>,
    pub total: i32,
    pub root_path: String,
    pub last_scan_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SkillBackupSummary {
    pub id: String,
    #[serde(rename = "skillID")]
    pub skill_id: String,
    pub name: String,
    pub title: Option<String>,
    pub relative_path: String,
    pub backup_path: String,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SkillBackupListPayload {
    pub items: Vec<SkillBackupSummary>,
    pub total: i32,
    pub root_path: String,
    pub last_scan_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SkillImportPayload {
    pub skill: InstalledSkillSummary,
    pub replaced_existing: bool,
    pub backup: Option<SkillBackupSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SkillRemovePayload {
    #[serde(rename = "removedSkillID")]
    pub removed_skill_id: String,
    pub backup: SkillBackupSummary,
    pub remaining_installed_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SkillRestorePayload {
    pub restored_skill: InstalledSkillSummary,
    pub backup: SkillBackupSummary,
    pub rollback_backup: Option<SkillBackupSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SkillDeleteBackupPayload {
    #[serde(rename = "deletedBackupID")]
    pub deleted_backup_id: String,
    pub remaining_backup_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CleanPayload {
    pub auth_backups_removed: i32,
    pub registry_backups_removed: i32,
    pub stale_entries_removed: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RebuildRegistryPayload {
    pub account_count: i32,
    pub active_account_key: Option<String>,
    pub registry_updated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AutoSwitchConfigPayload {
    pub auto_switch: AutoSwitchStatusPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ApiModePayload {
    pub api: ApiConfigPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ApiProxyTestPayload {
    pub code: String,
    pub reachable: bool,
    pub status_code: Option<i32>,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ApiProxyDetectPayload {
    pub found: bool,
    pub mode: Option<ApiProxyMode>,
    pub url: Option<String>,
    pub probe: ApiProxyTestPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInstallabilityPayload {
    pub can_install: bool,
    pub code: String,
    pub executable_path: Option<String>,
    pub bundle_path: Option<String>,
    pub translocated: bool,
    pub quarantined: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DaemonRunPayload {
    pub executed_at: i64,
    pub run_once: bool,
    pub auto_switch_enabled: bool,
    pub service_state: AutoSwitchRuntimeState,
}

// ---------------------------------------------------------------------------
// Diagnose payload
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosePlatform {
    pub os: String,
    pub arch: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DiagnoseRegistryState {
    pub account_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DiagnoseSessionState {
    pub latest_rollout_found: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DiagnoseApiState {
    pub usage_attempt_count: i32,
    pub usage_success_count: i32,
    pub name_attempt_count: i32,
    pub name_success_count: i32,
    pub last_usage_failure: Option<String>,
    pub last_usage_failure_account: Option<String>,
    pub last_name_failure: Option<String>,
    pub last_name_failure_account: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosePayload {
    pub paths: AppPathState,
    pub core_version: String,
    pub platform: DiagnosePlatform,
    pub registry_state: DiagnoseRegistryState,
    pub session_state: DiagnoseSessionState,
    pub api_state: DiagnoseApiState,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TokenDaySeries {
    pub date: String,
    pub input_tokens: i64,
    pub output_tokens: i64,
    pub reasoning_tokens: i64,
    pub total_tokens: i64,
    pub cumulative: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenAnalyticsPayload {
    pub total_tokens: i64,
    pub avg_per_session: f64,
    pub input_pct: f64,
    pub output_pct: f64,
    pub reasoning_pct: f64,
    pub input_total: i64,
    pub output_total: i64,
    pub reasoning_total: i64,
    pub series: Vec<TokenDaySeries>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ToolRankItem {
    pub name: String,
    pub count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ToolAnalyticsPayload {
    pub total_calls: i32,
    pub distinct_count: i32,
    pub search_count: i32,
    pub edit_count: i32,
    pub top_tools: Vec<ToolRankItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ChangeDaySeries {
    pub date: String,
    pub commands: i32,
    pub write_ops: i32,
    pub read_ops: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ChangeAnalyticsPayload {
    pub total_commands: i32,
    pub write_commands: i32,
    pub read_commands: i32,
    pub other_commands: i32,
    pub series: Vec<ChangeDaySeries>,
}

// ---------------------------------------------------------------------------
// Generic envelope
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CoreEnvelope<T: Serialize> {
    pub schema_version: i32,
    pub success: bool,
    pub code: String,
    pub message: String,
    pub warnings: Vec<CoreWarning>,
    pub data: T,
}

impl<T: Serialize> CoreEnvelope<T> {
    pub fn ok(data: T) -> Self {
        Self {
            schema_version: 1,
            success: true,
            code: "ok".to_string(),
            message: "Success".to_string(),
            warnings: vec![],
            data,
        }
    }

    pub fn ok_with_warnings(data: T, warnings: Vec<CoreWarning>) -> Self {
        Self {
            schema_version: 1,
            success: true,
            code: "ok".to_string(),
            message: "Success".to_string(),
            warnings,
            data,
        }
    }

    pub fn error(code: &str, message: &str, data: T) -> Self {
        Self {
            schema_version: 1,
            success: false,
            code: code.to_string(),
            message: message.to_string(),
            warnings: vec![],
            data,
        }
    }
}

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

#[derive(Debug, thiserror::Error)]
pub enum CoreError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("TOML parse error: {0}")]
    TomlParse(#[from] toml::de::Error),

    #[error("TOML serialize error: {0}")]
    TomlSerialize(#[from] toml::ser::Error),

    #[error("HTTP error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Invalid data: {0}")]
    InvalidData(String),

    #[error("Operation failed: {0}")]
    OperationFailed(String),
}

impl Serialize for CoreError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}
