use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DailyActivity {
    pub date: String,
    pub session_count: i32,
    pub total_file_size: i64,
    pub activity_level: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TodaySummary {
    pub session_count: i32,
    pub total_file_size: i64,
    pub active_minutes_estimate: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct SessionStats {
    pub total_sessions: i32,
    pub total_size_bytes: i64,
    pub active_days: i32,
    pub avg_sessions_per_active_day: f64,
    pub most_active_date: Option<String>,
    pub most_active_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct UsageAnalyticsPayload {
    pub today: TodaySummary,
    pub session_stats: SessionStats,
    pub daily_activity: Vec<DailyActivity>,
}
