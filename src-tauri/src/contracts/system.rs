use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub(crate) enum UsageSource {
    #[default]
    Local,
    Api,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub(crate) enum ApiProxyMode {
    #[default]
    Direct,
    Manual,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) enum AutoSwitchRuntimeState {
    Running,
    Stopped,
    NotInstalled,
    #[default]
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) enum ApiReachabilityStatus {
    #[default]
    Unknown,
    Reachable,
    Unreachable,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AppPathState {
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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ApiProxyConfigPayload {
    #[serde(default)]
    pub mode: ApiProxyMode,
    #[serde(default)]
    pub url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AutoSwitchStatusPayload {
    pub enabled: bool,
    pub threshold_5h_percent: i32,
    pub threshold_weekly_percent: i32,
    pub service_state: AutoSwitchRuntimeState,
    pub service_label: String,
}

impl Default for AutoSwitchStatusPayload {
    fn default() -> Self {
        Self {
            enabled: false,
            threshold_5h_percent: 80,
            threshold_weekly_percent: 80,
            service_state: AutoSwitchRuntimeState::Unknown,
            service_label: "backend".into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ApiConfigPayload {
    #[serde(default)]
    pub proxy: ApiProxyConfigPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ApiConnectivityPayload {
    pub usage_status: ApiReachabilityStatus,
    pub usage_last_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AppStatusPayload {
    pub paths: AppPathState,
    pub last_scan_at: i64,
    pub usage_source: UsageSource,
    pub auto_switch: AutoSwitchStatusPayload,
    pub api: ApiConfigPayload,
    pub api_connectivity: ApiConnectivityPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CleanPayload {
    #[serde(default)]
    pub backend_status: BackendSkeletonStatus,
    pub auth_backups_removed: i32,
    pub registry_backups_removed: i32,
    pub stale_entries_removed: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RebuildRegistryPayload {
    #[serde(default)]
    pub backend_status: BackendSkeletonStatus,
    pub account_count: i32,
    pub active_account_key: Option<String>,
    pub registry_updated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AutoSwitchConfigPayload {
    #[serde(default)]
    pub backend_status: BackendSkeletonStatus,
    pub auto_switch: AutoSwitchStatusPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ApiModePayload {
    #[serde(default)]
    pub backend_status: BackendSkeletonStatus,
    pub api: ApiConfigPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ApiProxyTestPayload {
    #[serde(default)]
    pub backend_status: BackendSkeletonStatus,
    pub code: String,
    pub reachable: bool,
    pub status_code: Option<i32>,
    pub message: String,
}

impl Default for ApiProxyTestPayload {
    fn default() -> Self {
        Self {
            backend_status: BackendSkeletonStatus::default(),
            code: "not_implemented".into(),
            reachable: false,
            status_code: None,
            message: "当前后端未执行连通性探测。".into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ApiProxyDetectPayload {
    #[serde(default)]
    pub backend_status: BackendSkeletonStatus,
    pub found: bool,
    pub mode: Option<ApiProxyMode>,
    pub url: Option<String>,
    pub probe: ApiProxyTestPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UpdateInstallabilityPayload {
    #[serde(default)]
    pub backend_status: BackendSkeletonStatus,
    pub can_install: bool,
    pub code: String,
    pub executable_path: Option<String>,
    pub bundle_path: Option<String>,
    pub translocated: bool,
    pub quarantined: bool,
}

impl Default for UpdateInstallabilityPayload {
    fn default() -> Self {
        Self {
            backend_status: BackendSkeletonStatus::default(),
            can_install: false,
            code: "not_implemented".into(),
            executable_path: None,
            bundle_path: None,
            translocated: false,
            quarantined: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DaemonRunPayload {
    #[serde(default)]
    pub backend_status: BackendSkeletonStatus,
    pub executed_at: i64,
    pub run_once: bool,
    pub auto_switch_enabled: bool,
    pub service_state: AutoSwitchRuntimeState,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DiagnosePlatform {
    pub os: String,
    pub arch: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DiagnoseRegistryState {
    pub account_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DiagnoseSessionState {
    pub latest_rollout_found: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DiagnoseApiState {
    pub usage_attempt_count: i32,
    pub usage_success_count: i32,
    pub name_attempt_count: i32,
    pub name_success_count: i32,
    pub last_usage_failure: Option<String>,
    pub last_usage_failure_account: Option<String>,
    pub last_name_failure: Option<String>,
    pub last_name_failure_account: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DiagnosePayload {
    #[serde(default)]
    pub backend_status: BackendSkeletonStatus,
    pub paths: AppPathState,
    pub core_version: String,
    pub platform: DiagnosePlatform,
    pub registry_state: DiagnoseRegistryState,
    pub session_state: DiagnoseSessionState,
    pub api_state: DiagnoseApiState,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SystemInfo {
    #[serde(default)]
    pub backend_status: BackendSkeletonStatus,
    pub os: String,
    pub os_version: String,
    pub arch: String,
    pub hostname: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct NotificationClientStatePayload {
    #[serde(default)]
    pub backend_status: BackendSkeletonStatus,
    pub device_id: String,
    pub notifications_since: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct MysteryRouteGrant {
    pub route: String,
    pub epoch_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CoreSnapshotPayload {
    #[serde(default)]
    pub backend_status: BackendSkeletonStatus,
    pub status: AppStatusPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DailyActivity {
    pub date: String,
    pub session_count: i32,
    pub total_file_size: i64,
    pub activity_level: i32,
    pub active_minutes: i32,
    pub tokens: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct TodaySummary {
    pub session_count: i32,
    pub total_file_size: i64,
    pub active_minutes_estimate: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SessionStats {
    pub total_sessions: i32,
    pub total_size_bytes: i64,
    pub active_days: i32,
    pub avg_sessions_per_active_day: f64,
    pub most_active_date: Option<String>,
    pub most_active_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UsageAnalyticsPayload {
    #[serde(default)]
    pub backend_status: BackendSkeletonStatus,
    pub today: TodaySummary,
    pub session_stats: SessionStats,
    pub daily_activity: Vec<DailyActivity>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct QuotaHistoryPoint {
    pub timestamp: i64,
    pub account_key: String,
    pub primary_used_percent: Option<f64>,
    pub secondary_used_percent: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct QuotaHistoryPayload {
    #[serde(default)]
    pub backend_status: BackendSkeletonStatus,
    pub account_key: Option<String>,
    pub points: Vec<QuotaHistoryPoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct HotspotStatePayload {
    pub supported: bool,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BootstrapStatePayload {
    #[serde(default)]
    pub backend_status: BackendSkeletonStatus,
    pub executed_at: Option<String>,
    pub run_once: bool,
    pub auto_switch_enabled: bool,
    pub active_account_key: Option<String>,
    pub switched_account_key: Option<String>,
    pub pending_switch_account_key: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PendingAutoSwitchStatePayload {
    #[serde(default)]
    pub backend_status: BackendSkeletonStatus,
    pub current_account_key: String,
    pub candidate_account_key: String,
    pub dismissed_at: Option<String>,
}
