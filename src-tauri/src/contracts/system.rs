use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum UsageSource {
    #[default]
    Local,
    Api,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum ApiProxyMode {
    #[default]
    Direct,
    Manual,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub enum ApiReachabilityStatus {
    #[default]
    Unknown,
    Reachable,
    Unreachable,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub enum AutoSwitchRuntimeState {
    Running,
    Stopped,
    NotInstalled,
    #[default]
    Unknown,
}

#[derive(Debug, Clone, Serialize)]
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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettingsFile {
    #[serde(default)]
    pub hotspot_enabled: bool,
    #[serde(default = "default_usage_refresh_interval")]
    pub usage_refresh_interval: String,
    #[serde(default)]
    pub api_proxy: ApiProxyConfigPayload,
    #[serde(default)]
    pub auto_switch_enabled: bool,
    #[serde(default = "default_threshold_5h")]
    pub threshold_5h_percent: i32,
    #[serde(default = "default_threshold_weekly")]
    pub threshold_weekly_percent: i32,
    #[serde(default)]
    pub device_id: Option<String>,
}

impl Default for AppSettingsFile {
    fn default() -> Self {
        Self {
            hotspot_enabled: false,
            usage_refresh_interval: default_usage_refresh_interval(),
            api_proxy: ApiProxyConfigPayload::default(),
            auto_switch_enabled: false,
            threshold_5h_percent: default_threshold_5h(),
            threshold_weekly_percent: default_threshold_weekly(),
            device_id: None,
        }
    }
}

pub fn default_usage_refresh_interval() -> String {
    "1m".to_string()
}

fn default_threshold_5h() -> i32 {
    15
}

fn default_threshold_weekly() -> i32 {
    10
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoSwitchStatusPayload {
    pub enabled: bool,
    pub threshold_5h_percent: i32,
    pub threshold_weekly_percent: i32,
    pub service_state: AutoSwitchRuntimeState,
    pub service_label: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiConfigPayload {
    pub proxy: ApiProxyConfigPayload,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiConnectivityPayload {
    pub usage_status: ApiReachabilityStatus,
    pub usage_last_error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppStatusPayload {
    pub paths: AppPathState,
    pub last_scan_at: i64,
    pub usage_source: UsageSource,
    pub auto_switch: AutoSwitchStatusPayload,
    pub api: ApiConfigPayload,
    pub api_connectivity: ApiConnectivityPayload,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CoreSnapshotPayload {
    pub backend_status: BackendSkeletonStatus,
    pub status: AppStatusPayload,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BootstrapStatePayload {
    pub backend_status: BackendSkeletonStatus,
    pub executed_at: Option<String>,
    pub run_once: bool,
    pub auto_switch_enabled: bool,
    pub active_account_key: Option<String>,
    pub switched_account_key: Option<String>,
    pub pending_switch_account_key: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanPayload {
    pub auth_backups_removed: i32,
    pub registry_backups_removed: i32,
    pub stale_entries_removed: i32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RebuildRegistryPayload {
    pub account_count: i32,
    pub active_account_key: Option<String>,
    pub registry_updated: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutoSwitchConfigPayload {
    pub backend_status: BackendSkeletonStatus,
    pub auto_switch: AutoSwitchStatusPayload,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiModePayload {
    pub api: ApiConfigPayload,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiProxyTestPayload {
    pub code: String,
    pub reachable: bool,
    pub status_code: Option<i32>,
    pub message: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiProxyDetectPayload {
    pub found: bool,
    pub mode: Option<ApiProxyMode>,
    pub url: Option<String>,
    pub probe: ApiProxyTestPayload,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateInstallabilityPayload {
    pub backend_status: BackendSkeletonStatus,
    pub can_install: bool,
    pub code: String,
    pub executable_path: Option<String>,
    pub bundle_path: Option<String>,
    pub translocated: bool,
    pub quarantined: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DaemonRunPayload {
    pub backend_status: BackendSkeletonStatus,
    pub executed_at: i64,
    pub run_once: bool,
    pub auto_switch_enabled: bool,
    pub service_state: AutoSwitchRuntimeState,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosePayload {
    pub paths: AppPathState,
    pub core_version: String,
    pub platform: DiagnosePlatform,
    pub registry_state: DiagnoseRegistryState,
    pub session_state: DiagnoseSessionState,
    pub api_state: DiagnoseApiState,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosePlatform {
    pub os: String,
    pub arch: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnoseRegistryState {
    pub account_count: i32,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnoseSessionState {
    pub latest_rollout_found: bool,
}

#[derive(Debug, Clone, Serialize)]
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

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfoPayload {
    pub backend_status: BackendSkeletonStatus,
    pub os: String,
    pub os_version: String,
    pub arch: String,
    pub hostname: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemActionPayload {
    pub backend_status: BackendSkeletonStatus,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationClientStatePayload {
    pub backend_status: BackendSkeletonStatus,
    pub device_id: String,
    pub notifications_since: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MysteryRouteGrant {
    pub route: String,
    #[serde(rename = "epochMs", alias = "epoch_ms")]
    pub epoch_ms: i64,
}
