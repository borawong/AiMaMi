use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// 中文职责说明：会话命令的 IPC DTO，保持列表与删除事务的后端 owner 边界。
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SessionsPayload {
    pub status: BackendSkeletonStatus,
    pub ids: Vec<String>,
    pub sessions: Vec<Value>,
}
