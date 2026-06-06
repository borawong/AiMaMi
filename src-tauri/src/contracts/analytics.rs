use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AnalyticsPayload {
    pub status: BackendSkeletonStatus,
    pub account_key: Option<String>,
    pub range: Option<String>,
    pub points: Vec<Value>,
    pub rows: Vec<Value>,
}
