use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RuntimeExtensionPayload {
    pub status: BackendSkeletonStatus,
    pub id: Option<String>,
    pub enabled: Option<bool>,
    pub settings: Value,
    pub plugins: Vec<Value>,
}
