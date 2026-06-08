use crate::application::service::pending_status;
use crate::contracts::analytics::{
    AnalyticsRange, ChangeAnalyticsPayload, QuotaHistoryPayload, SessionStatsPayload,
    TodaySummaryPayload, TokenAnalyticsPayload, ToolAnalyticsPayload, UsageAnalyticsPayload,
};
use crate::repository::Repository;

pub(crate) struct AnalyticsUseCaseBoundary;

pub(crate) trait AnalyticsUseCaseBoundaryPort {}

/// 读取整体用量分析的用户动作边界；当前只返回空统计合同。
pub fn load_usage_analytics(_repo: &Repository) -> UsageAnalyticsPayload {
    UsageAnalyticsPayload {
        backend_status: pending_status(
            "analytics",
            "load_usage_analytics",
            "用量分析只完成公开 IPC 骨架；当前不推断闭源统计规则。",
        ),
        today: TodaySummaryPayload {
            session_count: 0,
            total_file_size: 0,
            active_minutes_estimate: 0,
        },
        session_stats: SessionStatsPayload {
            total_sessions: 0,
            total_size_bytes: 0,
            active_days: 0,
            avg_sessions_per_active_day: 0.0,
            most_active_date: None,
            most_active_count: 0,
        },
        daily_activity: Vec::new(),
    }
}

/// 读取配额历史的用户动作边界；真实账户来源等待仓储证据补齐。
pub fn load_quota_history(_repo: &Repository, account_key: Option<String>) -> QuotaHistoryPayload {
    QuotaHistoryPayload {
        backend_status: pending_status(
            "analytics",
            "load_quota_history",
            "配额历史只完成公开 IPC 骨架；当前不读取未恢复的账户用量来源。",
        ),
        account_key: normalize_optional_string(account_key),
        points: Vec::new(),
    }
}

/// 读取 token 分析的用户动作边界；真实 token 口径等待证据补齐。
pub fn load_token_analytics(_repo: &Repository, range: Option<String>) -> TokenAnalyticsPayload {
    TokenAnalyticsPayload {
        backend_status: pending_status(
            "analytics",
            "load_token_analytics",
            "token 分析只完成公开 IPC 骨架；当前不推断闭源 token 统计口径。",
        ),
        range: AnalyticsRange::from_input(range),
        total_tokens: 0,
        avg_per_session: 0.0,
        input_pct: 0.0,
        output_pct: 0.0,
        reasoning_pct: 0.0,
        input_total: 0,
        output_total: 0,
        reasoning_total: 0,
        series: Vec::new(),
    }
}

/// 读取工具分析的用户动作边界；真实工具分类等待证据补齐。
pub fn load_tool_analytics(_repo: &Repository, range: Option<String>) -> ToolAnalyticsPayload {
    ToolAnalyticsPayload {
        backend_status: pending_status(
            "analytics",
            "load_tool_analytics",
            "工具分析只完成公开 IPC 骨架；当前不推断闭源工具分类规则。",
        ),
        range: AnalyticsRange::from_input(range),
        total_calls: 0,
        distinct_count: 0,
        search_count: 0,
        edit_count: 0,
        top_tools: Vec::new(),
    }
}

/// 读取变更分析的用户动作边界；真实命令分类等待证据补齐。
pub fn load_change_analytics(_repo: &Repository, range: Option<String>) -> ChangeAnalyticsPayload {
    ChangeAnalyticsPayload {
        backend_status: pending_status(
            "analytics",
            "load_change_analytics",
            "变更分析只完成公开 IPC 骨架；当前不推断闭源命令分类规则。",
        ),
        range: AnalyticsRange::from_input(range),
        total_commands: 0,
        write_commands: 0,
        read_commands: 0,
        other_commands: 0,
        series: Vec::new(),
    }
}

fn normalize_optional_string(value: Option<String>) -> Option<String> {
    value.and_then(|item| {
        let trimmed = item.trim().to_string();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed)
        }
    })
}
