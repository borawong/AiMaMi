use crate::contracts::BackendSkeletonStatus;
use serde::Serialize;

pub(crate) struct SessionsContractBoundary;

pub(crate) type SessionsContractBoundaryPlaceholder = ();

/// 会话列表条目 IPC DTO，只表达前端合同字段，不承载领域扫描逻辑。
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SessionRecordPayload {
    pub id: String,
    pub thread_name: String,
    pub project_path: Option<String>,
    pub project_name: Option<String>,
    pub parent_session_id: Option<String>,
    pub updated_at: i64,
    pub created_at: Option<i64>,
    pub file_size: i64,
    pub is_conversation_thread: bool,
    pub project_path_missing: bool,
    pub agent_nickname: Option<String>,
    pub agent_role: Option<String>,
}

/// 会话列表 IPC DTO，当前只允许返回空骨架与边界状态。
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SessionsListPayload {
    pub backend_status: BackendSkeletonStatus,
    pub items: Vec<SessionRecordPayload>,
    pub total: i32,
    pub source_path: String,
    pub last_scan_at: i64,
}

/// 会话删除 IPC DTO，真实删除事务等待 raw/internal 证据补齐。
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SessionsDeletePayload {
    pub backend_status: BackendSkeletonStatus,
    pub requested_ids: Vec<String>,
    pub deleted_ids: Vec<String>,
    pub skipped_ids: Vec<String>,
    pub deleted_count: i32,
    pub source_path: String,
}

/// 会话导入账号 IPC DTO，仅保留公开合同字段，不解析或写入账号数据。
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
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
