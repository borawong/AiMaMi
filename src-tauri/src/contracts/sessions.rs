use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SessionsPayload {
    pub status: BackendSkeletonStatus,
    pub ids: Vec<String>,
    pub sessions: Vec<Value>,
}
