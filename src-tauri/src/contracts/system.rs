//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: contracts::system
//! Current role: DTO contract
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::contracts::{
    CoreSnapshotPayload, McpServerListPayload, SkillListPayload, UsageAnalyticsPayload,
};
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
            service_label: "shell".into(),
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
    pub auth_backups_removed: i32,
    pub registry_backups_removed: i32,
    pub stale_entries_removed: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RebuildRegistryPayload {
    pub account_count: i32,
    pub active_account_key: Option<String>,
    pub registry_updated: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AutoSwitchConfigPayload {
    pub auto_switch: AutoSwitchStatusPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ApiModePayload {
    pub api: ApiConfigPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ApiProxyTestPayload {
    pub code: String,
    pub reachable: bool,
    pub status_code: Option<i32>,
    pub message: String,
}

impl Default for ApiProxyTestPayload {
    fn default() -> Self {
        Self {
            code: "not_implemented".into(),
            reachable: false,
            status_code: None,
            message: "Connectivity probing is not implemented in the shell backend.".into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ApiProxyDetectPayload {
    pub found: bool,
    pub mode: Option<ApiProxyMode>,
    pub url: Option<String>,
    pub probe: ApiProxyTestPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UpdateInstallabilityPayload {
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
    pub os: String,
    pub os_version: String,
    pub arch: String,
    pub hostname: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BootstrapStatePayload {
    pub written_at: Option<i64>,
    pub snapshot_progressive: Option<CoreSnapshotPayload>,
    pub usage_analytics: Option<UsageAnalyticsPayload>,
    pub mcp_servers: Option<McpServerListPayload>,
    pub installed_skills: Option<SkillListPayload>,
}
