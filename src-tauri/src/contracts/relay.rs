use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

pub(crate) struct RelayContractBoundary;

pub(crate) type RelayContractBoundaryPlaceholder = ();

pub type RelayActiveByIdePayload = HashMap<String, Vec<String>>;

/// relay 供应商草稿 DTO 只承接前端 IPC 参数，不在合同层解释代理规则。
#[derive(Debug, Clone, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RelayProviderDraftInput {
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
    pub extra_headers: Option<Value>,
    pub network: Option<String>,
}

/// relay 供应商 DTO 字段必须和前端 RelayProviderPayload 同步，当前只表达空骨架状态。
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RelayProviderPayload {
    pub backend_status: BackendSkeletonStatus,
    pub id: String,
    pub ide: String,
    pub name: String,
    pub base_url: String,
    pub api_key: Option<String>,
    pub api_key_stored: bool,
    pub model: String,
    pub wire_api: String,
    pub extra_headers: Value,
    pub network: String,
    pub active: bool,
    pub health_score: Option<i32>,
    pub latency_ms: Option<i32>,
    pub last_tested_at: Option<i64>,
    pub updated_at: Option<i64>,
    pub last_error: Option<String>,
    pub error_message: Option<String>,
    pub models_sample: Vec<String>,
}

/// relay 本地代理状态 DTO 只描述公开 IPC 形状，不承诺进程真实运行状态。
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RelayProxyPayload {
    pub backend_status: BackendSkeletonStatus,
    pub running: bool,
    pub port: i32,
    pub base_url: String,
    pub codex_base_url: String,
    pub last_error: Option<String>,
}

/// relay 当前激活信息 DTO 当前只保留空状态边界。
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RelayActivePayload {
    pub backend_status: BackendSkeletonStatus,
    pub enabled: bool,
    pub active_provider: Option<String>,
    pub active_provider_id: Option<String>,
    pub ide: String,
}

/// relay 页面状态 DTO 对齐前端缓存合同，真实配置读写等待证据补齐。
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RelayStatePayload {
    pub backend_status: BackendSkeletonStatus,
    pub schema_version: i32,
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

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RelayRouterMigrationPayload {
    pub action: String,
    pub migrated_count: i32,
    pub rolled_back_count: i32,
    pub skipped_count: i32,
    pub target_provider: Option<String>,
    pub target_model: Option<String>,
    pub manifest_path: Option<String>,
}

/// relay 路由开关 DTO 仅返回 mutation 空骨架，不执行平台副作用。
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RelayRouterTogglePayload {
    pub backend_status: BackendSkeletonStatus,
    pub state: RelayStatePayload,
    pub migration: RelayRouterMigrationPayload,
    pub codex_launch_error: Option<String>,
}

/// relay 连通性测试 DTO 当前不发起网络请求。
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RelayTestPayload {
    pub backend_status: BackendSkeletonStatus,
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub health: Option<i32>,
    pub latency_ms: i32,
    pub status_code: Option<i32>,
    pub message: Option<String>,
    pub error_message: Option<String>,
    pub models: Vec<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RelayExportPayload {
    pub backend_status: BackendSkeletonStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub schema_version: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub exported_by: Option<String>,
    pub exported_at: Option<String>,
    pub file_path: String,
    pub include_api_keys: bool,
    pub provider_count: i32,
    pub providers: Vec<RelayProviderPayload>,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RelayImportSkipPayload {
    pub id: Option<String>,
    pub reason: String,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RelayImportPayload {
    pub backend_status: BackendSkeletonStatus,
    pub file_path: String,
    pub imported_count: i32,
    pub skipped_count: i32,
    pub total: i32,
    pub skipped: Vec<RelayImportSkipPayload>,
}

/// relay 官方直连审计日志条目 DTO，字段必须和前端 RelayPassthroughAuditEntry 保持同步。
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RelayPassthroughAuditEntryPayload {
    pub timestamp: String,
    pub event: String,
    pub direction: String,
    pub provider_id: Option<String>,
    pub model: Option<String>,
    pub blocked: bool,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RelayDiagnosticIssuePayload {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    pub message: String,
    pub detail: Option<String>,
    pub severity: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    pub fixable: bool,
}

/// relay 诊断 DTO 保留前端新旧字段别名，真实文件检查等待证据补齐。
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RelayDiagnosticPayload {
    pub backend_status: BackendSkeletonStatus,
    pub ok: bool,
    pub codex_provider_count: i32,
    pub catalog_path: Option<String>,
    pub catalog_exists: bool,
    pub config_toml_has_router: bool,
    pub config_toml_has_catalog: bool,
    #[serde(rename = "config_toml_has_router")]
    pub config_toml_has_router_legacy: bool,
    #[serde(rename = "config_toml_has_catalog")]
    pub config_toml_has_catalog_legacy: bool,
    pub user_top_level_profile: Option<String>,
    pub config_stale_reason: Option<String>,
    pub thread_migration_exists: bool,
    pub router_enabled: bool,
    pub has_issues: bool,
    pub issues: Vec<RelayDiagnosticIssuePayload>,
    pub items: Vec<RelayDiagnosticIssuePayload>,
    pub summary: String,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RelayRouterIssueFixPayload {
    pub backend_status: BackendSkeletonStatus,
    pub item_id: String,
    pub issue_id: String,
    pub fixed: bool,
    pub requires_restart: bool,
    pub message: String,
    pub details: Option<String>,
    pub diagnostics: RelayDiagnosticPayload,
}
