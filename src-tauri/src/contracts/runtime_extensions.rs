use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};
use serde_json::Value;

/// 中文职责说明：运行时扩展命令的 IPC DTO，插件发现与配置写入后续在本域补齐。
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RuntimeExtensionPayload {
    pub status: BackendSkeletonStatus,
    pub id: Option<String>,
    pub enabled: Option<bool>,
    pub settings: Value,
    pub plugins: Vec<Value>,
}
