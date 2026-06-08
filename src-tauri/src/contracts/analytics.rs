use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};

pub(crate) struct AnalyticsContractBoundary;

pub(crate) type AnalyticsContractBoundaryPlaceholder = ();

/// 分析时间范围 IPC DTO，未知输入在用例层归一为 week。
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum AnalyticsRange {
    Today,
    #[default]
    Week,
    Month,
}

impl AnalyticsRange {
    pub fn from_input(value: Option<String>) -> Self {
        match value.as_deref() {
            Some("today") => Self::Today,
            Some("month") => Self::Month,
            _ => Self::Week,
        }
    }
}

/// 每日活动 IPC DTO，只保留公开统计展示字段。
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DailyActivityPayload {
    pub date: String,
    pub session_count: i32,
    pub total_file_size: i64,
    pub activity_level: f64,
    pub active_minutes: Option<i32>,
    pub tokens: Option<i64>,
}

/// 今日概览 IPC DTO。
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TodaySummaryPayload {
    pub session_count: i32,
    pub total_file_size: i64,
    pub active_minutes_estimate: i32,
}

/// 会话统计 IPC DTO。
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SessionStatsPayload {
    pub total_sessions: i32,
    pub total_size_bytes: i64,
    pub active_days: i32,
    pub avg_sessions_per_active_day: f64,
    pub most_active_date: Option<String>,
    pub most_active_count: i32,
}

/// 用量分析 IPC DTO，当前返回空统计骨架。
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct UsageAnalyticsPayload {
    pub backend_status: BackendSkeletonStatus,
    pub today: TodaySummaryPayload,
    pub session_stats: SessionStatsPayload,
    pub daily_activity: Vec<DailyActivityPayload>,
}

/// 配额历史点 IPC DTO。
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct QuotaHistoryPointPayload {
    pub timestamp: i64,
    pub account_key: String,
    pub primary_used_percent: Option<f64>,
    pub secondary_used_percent: Option<f64>,
}

/// 配额历史 IPC DTO，真实来源等待仓储证据补齐。
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct QuotaHistoryPayload {
    pub backend_status: BackendSkeletonStatus,
    pub account_key: Option<String>,
    pub points: Vec<QuotaHistoryPointPayload>,
}

/// 会话分析序列点 IPC DTO。
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SessionAnalyticsSeriesPointPayload {
    pub date: String,
    pub count: i32,
}

/// 会话分析 IPC DTO。
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SessionAnalyticsPayload {
    pub backend_status: BackendSkeletonStatus,
    pub range: AnalyticsRange,
    pub total_sessions: i32,
    pub avg_turns: f64,
    pub active_days: i32,
    pub series: Vec<SessionAnalyticsSeriesPointPayload>,
}

/// token 日序列 IPC DTO。
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TokenDaySeriesPayload {
    pub date: String,
    pub input_tokens: i64,
    pub output_tokens: i64,
    pub reasoning_tokens: i64,
    pub total_tokens: i64,
    pub cumulative: i64,
}

/// token 分析 IPC DTO。
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TokenAnalyticsPayload {
    pub backend_status: BackendSkeletonStatus,
    pub range: AnalyticsRange,
    pub total_tokens: i64,
    pub avg_per_session: f64,
    pub input_pct: f64,
    pub output_pct: f64,
    pub reasoning_pct: f64,
    pub input_total: i64,
    pub output_total: i64,
    pub reasoning_total: i64,
    pub series: Vec<TokenDaySeriesPayload>,
}

/// 工具排行 IPC DTO。
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ToolRankItemPayload {
    pub name: String,
    pub count: i32,
}

/// 工具分析 IPC DTO。
#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ToolAnalyticsPayload {
    pub backend_status: BackendSkeletonStatus,
    pub range: AnalyticsRange,
    pub total_calls: i32,
    pub distinct_count: i32,
    pub search_count: i32,
    pub edit_count: i32,
    pub top_tools: Vec<ToolRankItemPayload>,
}

/// 变更日序列 IPC DTO。
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ChangeDaySeriesPayload {
    pub date: String,
    pub commands: i32,
    pub write_ops: i32,
    pub read_ops: i32,
}

/// 变更分析 IPC DTO。
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ChangeAnalyticsPayload {
    pub backend_status: BackendSkeletonStatus,
    pub range: AnalyticsRange,
    pub total_commands: i32,
    pub write_commands: i32,
    pub read_commands: i32,
    pub other_commands: i32,
    pub series: Vec<ChangeDaySeriesPayload>,
}
