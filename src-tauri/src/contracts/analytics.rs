use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};

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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct TokenDaySeries {
    pub date: String,
    pub input_tokens: i64,
    pub output_tokens: i64,
    pub reasoning_tokens: i64,
    pub total_tokens: i64,
    pub cumulative: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct TokenAnalyticsPayload {
    pub backend_status: BackendSkeletonStatus,
    pub range: String,
    pub total_tokens: i64,
    pub avg_per_session: f64,
    pub input_pct: f64,
    pub output_pct: f64,
    pub reasoning_pct: f64,
    pub input_total: i64,
    pub output_total: i64,
    pub reasoning_total: i64,
    pub series: Vec<TokenDaySeries>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ToolRankItem {
    pub name: String,
    pub count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ToolAnalyticsPayload {
    pub backend_status: BackendSkeletonStatus,
    pub range: String,
    pub total_calls: i32,
    pub distinct_count: i32,
    pub search_count: i32,
    pub edit_count: i32,
    pub top_tools: Vec<ToolRankItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ChangeDaySeries {
    pub date: String,
    pub commands: i32,
    pub write_ops: i32,
    pub read_ops: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ChangeAnalyticsPayload {
    pub backend_status: BackendSkeletonStatus,
    pub range: String,
    pub total_commands: i32,
    pub write_commands: i32,
    pub read_commands: i32,
    pub other_commands: i32,
    pub series: Vec<ChangeDaySeries>,
}
