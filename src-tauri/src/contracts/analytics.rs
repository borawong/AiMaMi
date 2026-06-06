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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SessionAnalyticsSeriesPoint {
    pub date: String,
    pub count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SessionAnalyticsPayload {
    pub backend_status: BackendSkeletonStatus,
    pub range: String,
    pub total_sessions: i32,
    pub avg_turns: f64,
    pub active_days: i32,
    pub series: Vec<SessionAnalyticsSeriesPoint>,
}
