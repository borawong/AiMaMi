use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(untagged)]
pub(crate) enum RelayExtraHeaders {
    Text(String),
    Map(BTreeMap<String, String>),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RelayProviderDraftInput {
    pub id: Option<String>,
    pub provider_id: Option<String>,
    pub ide: Option<String>,
    pub name: Option<String>,
    pub base_url: Option<String>,
    pub url: Option<String>,
    pub endpoint: Option<String>,
    pub api_key: Option<String>,
    pub api_key_stored: Option<bool>,
    pub model: Option<String>,
    pub default_model: Option<String>,
    pub wire_api: Option<String>,
    pub extra_headers: Option<RelayExtraHeaders>,
    pub network: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RelayProviderPayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub backend_status: Option<BackendSkeletonStatus>,
    pub id: String,
    pub ide: String,
    pub name: String,
    pub base_url: String,
    pub api_key: Option<String>,
    pub api_key_stored: bool,
    pub model: String,
    pub wire_api: String,
    pub extra_headers: Option<RelayExtraHeaders>,
    pub network: String,
    pub active: bool,
    pub health_score: Option<i64>,
    pub latency_ms: Option<i64>,
    pub last_tested_at: Option<i64>,
    pub updated_at: Option<i64>,
    pub last_error: Option<String>,
    pub error_message: Option<String>,
    pub models_sample: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RelayProxyPayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub backend_status: Option<BackendSkeletonStatus>,
    pub running: bool,
    pub port: i64,
    pub base_url: String,
    pub codex_base_url: String,
    pub last_error: Option<String>,
}

pub(crate) type RelayActiveByIdePayload = BTreeMap<String, Vec<String>>;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RelayActivePayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub backend_status: Option<BackendSkeletonStatus>,
    pub enabled: bool,
    pub active_provider: Option<String>,
    pub active_provider_id: Option<String>,
    pub ide: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RelayStatePayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub backend_status: Option<BackendSkeletonStatus>,
    pub schema_version: i64,
    pub providers: Vec<RelayProviderPayload>,
    pub active_by_ide: RelayActiveByIdePayload,
    pub proxy: RelayProxyPayload,
    pub codex_router_enabled: bool,
    pub block_official_passthrough: bool,
    pub last_codex_route: Option<String>,
    pub enabled: bool,
    pub active_provider_id: Option<String>,
    pub proxy_status: RelayProxyPayload,
    pub source_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RelayRouterMigrationPayload {
    pub action: String,
    pub migrated_count: i64,
    pub rolled_back_count: i64,
    pub skipped_count: i64,
    pub target_provider: Option<String>,
    pub target_model: Option<String>,
    pub manifest_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RelayRouterTogglePayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub backend_status: Option<BackendSkeletonStatus>,
    pub state: RelayStatePayload,
    pub migration: RelayRouterMigrationPayload,
    pub codex_launch_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RelayTestPayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub backend_status: Option<BackendSkeletonStatus>,
    pub ok: bool,
    pub health: i64,
    pub latency_ms: i64,
    pub status_code: Option<i64>,
    pub message: Option<String>,
    pub error_message: Option<String>,
    pub models: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RelayExportPayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub backend_status: Option<BackendSkeletonStatus>,
    pub schema_version: i64,
    pub exported_by: String,
    pub exported_at: Option<String>,
    pub file_path: String,
    pub include_api_keys: bool,
    pub provider_count: i64,
    pub providers: Vec<RelayProviderPayload>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RelayImportSkipPayload {
    pub id: Option<String>,
    pub reason: String,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RelayImportPayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub backend_status: Option<BackendSkeletonStatus>,
    pub file_path: String,
    pub imported_count: i64,
    pub skipped_count: i64,
    pub total: i64,
    pub skipped: Vec<RelayImportSkipPayload>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RelayPassthroughAuditEntry {
    pub timestamp: String,
    pub event: String,
    pub direction: String,
    pub provider_id: Option<String>,
    pub model: Option<String>,
    pub blocked: bool,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RelayDiagnosticIssuePayload {
    pub id: String,
    pub title: Option<String>,
    pub label: Option<String>,
    pub message: String,
    pub detail: Option<String>,
    pub severity: String,
    pub status: Option<String>,
    pub fixable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RelayDiagnosticPayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub backend_status: Option<BackendSkeletonStatus>,
    pub ok: bool,
    pub codex_provider_count: i64,
    pub catalog_path: Option<String>,
    pub catalog_exists: bool,
    pub config_toml_has_router: bool,
    pub config_toml_has_catalog: bool,
    #[serde(rename = "config_toml_has_router")]
    pub config_toml_has_router_raw: bool,
    #[serde(rename = "config_toml_has_catalog")]
    pub config_toml_has_catalog_raw: bool,
    pub user_top_level_profile: Option<String>,
    pub config_stale_reason: Option<String>,
    pub thread_migration_exists: bool,
    pub router_enabled: bool,
    pub has_issues: bool,
    pub issues: Vec<RelayDiagnosticIssuePayload>,
    pub items: Vec<RelayDiagnosticIssuePayload>,
    pub summary: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RelayRouterIssueFixPayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub backend_status: Option<BackendSkeletonStatus>,
    pub item_id: String,
    pub issue_id: String,
    pub fixed: bool,
    pub requires_restart: bool,
    pub message: String,
    pub details: Option<String>,
    pub diagnostics: RelayDiagnosticPayload,
}
