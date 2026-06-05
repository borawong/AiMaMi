//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: contracts::analytics
//! Current role: DTO contract
//! Future integration point: replace this stub through the declared port/use-case boundary.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct DailyActivity {
    pub date: String,
    pub session_count: i32,
    pub total_file_size: i64,
    pub activity_level: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct TodaySummary {
    pub session_count: i32,
    pub total_file_size: i64,
    pub active_minutes_estimate: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SessionStats {
    pub total_sessions: i32,
    pub total_size_bytes: i64,
    pub active_days: i32,
    pub avg_sessions_per_active_day: f64,
    pub most_active_date: Option<String>,
    pub most_active_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UsageAnalyticsPayload {
    pub today: TodaySummary,
    pub session_stats: SessionStats,
    pub daily_activity: Vec<DailyActivity>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct QuotaHistoryPoint {
    pub timestamp: i64,
    pub account_key: String,
    pub primary_used_percent: Option<f64>,
    pub secondary_used_percent: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct QuotaHistoryPayload {
    pub points: Vec<QuotaHistoryPoint>,
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
    pub total_commands: i32,
    pub write_commands: i32,
    pub read_commands: i32,
    pub other_commands: i32,
    pub series: Vec<ChangeDaySeries>,
}
