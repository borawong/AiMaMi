use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SessionRecordPayload {
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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SessionsListPayload {
    pub backend_status: BackendSkeletonStatus,
    pub items: Vec<SessionRecordPayload>,
    pub total: usize,
    pub source_path: String,
    pub last_scan_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SessionsDeletePayload {
    pub backend_status: BackendSkeletonStatus,
    pub requested_ids: Vec<String>,
    pub deleted_ids: Vec<String>,
    pub skipped_ids: Vec<String>,
    pub deleted_count: usize,
    pub source_path: String,
}
