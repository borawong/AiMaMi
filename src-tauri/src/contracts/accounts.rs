use crate::contracts::BackendSkeletonStatus;
use serde::Serialize;

// accounts 合同只承载 IPC DTO 形状，不承载账号领域模型或文件读写规则。
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountSummaryPayload {
    pub account_key: String,
    pub email: Option<String>,
    pub alias: Option<String>,
    pub account_name: Option<String>,
    pub workspace_name: Option<String>,
    pub profile_name: Option<String>,
    pub plan: Option<String>,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountSkippedPayload {
    pub account_key: Option<String>,
    pub reason: String,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountMonitorPayload {
    pub backend_status: BackendSkeletonStatus,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SwitchPayload {
    pub backend_status: BackendSkeletonStatus,
    pub previous_account_key: Option<String>,
    pub active_account_key: Option<String>,
    pub active_account: Option<AccountSummaryPayload>,
    pub auth_updated: bool,
    pub registry_updated: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LogoutPayload {
    pub backend_status: BackendSkeletonStatus,
    pub auth_removed: bool,
    pub auth_backed_up: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RemovePayload {
    pub backend_status: BackendSkeletonStatus,
    pub removed_account_keys: Vec<String>,
    pub removed_count: i32,
    pub previous_account_key: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountImportPayload {
    pub backend_status: BackendSkeletonStatus,
    pub imported_count: i32,
    pub imported_account_keys: Vec<String>,
    pub skipped: Vec<AccountSkippedPayload>,
    pub registry_account_count: i32,
    pub active_account_key: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountSessionImportPayload {
    pub backend_status: BackendSkeletonStatus,
    pub imported: bool,
    pub account_key: Option<String>,
    pub email: Option<String>,
    pub plan: Option<String>,
    pub snapshot_path: Option<String>,
    pub registry_account_count: i32,
    pub active_account_key: Option<String>,
    pub refresh_token_placeholder: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountExportPayload {
    pub backend_status: BackendSkeletonStatus,
    pub target_path: String,
    pub account_count: i32,
    pub exported_at: Option<String>,
    pub skipped: Vec<AccountSkippedPayload>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountImportPreviewEntry {
    pub account_key: String,
    pub email: Option<String>,
    pub plan: Option<String>,
    pub auth_mode: Option<String>,
    pub workspace_name: Option<String>,
    pub profile_name: Option<String>,
    pub conflict: bool,
    pub is_active_locally: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AccountImportPreviewPayload {
    pub backend_status: BackendSkeletonStatus,
    pub file_path: String,
    pub schema_version: i32,
    pub kind: String,
    pub app_version: Option<String>,
    pub exported_at: Option<String>,
    pub exported_hostname: Option<String>,
    pub entries: Vec<AccountImportPreviewEntry>,
    pub account_count: i32,
    pub conflict_count: i32,
}
