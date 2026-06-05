use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// 中文职责说明：Relay 命令的 IPC DTO，实际代理配置读写后续在 relay usecase 内补齐。
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RelayActionPayload {
    pub status: BackendSkeletonStatus,
    pub provider_id: Option<String>,
    pub ide: Option<String>,
    pub network: Option<String>,
    pub input: Option<Value>,
    pub enabled: Option<bool>,
    pub relaunch: bool,
    pub file_path: Option<String>,
    pub include_api_keys: bool,
    pub blocked: Option<bool>,
    pub limit: Option<i64>,
    pub item_id: Option<String>,
}
