use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// 中文职责说明：分析命令的 IPC DTO，业务聚合算法后续在 analytics usecase 内补齐。
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AnalyticsPayload {
    pub status: BackendSkeletonStatus,
    pub account_key: Option<String>,
    pub range: Option<String>,
    pub points: Vec<Value>,
    pub rows: Vec<Value>,
}
