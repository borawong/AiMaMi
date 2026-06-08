use crate::application::service::{current_timestamp, pending_status};
use crate::contracts::analytics::{AnalyticsRange, SessionAnalyticsPayload};
use crate::contracts::sessions::{
    AccountSessionImportPayload, SessionsDeletePayload, SessionsListPayload,
};
use crate::repository::Repository;

pub(crate) struct SessionsUseCaseBoundary;

pub(crate) trait SessionsUseCaseBoundaryPort {}

/// 读取会话列表的用户动作边界；真实扫描逻辑等待仓储证据补齐。
pub fn load_sessions(repo: &Repository) -> SessionsListPayload {
    SessionsListPayload {
        backend_status: pending_status(
            "sessions",
            "load_sessions",
            "会话列表只完成公开 IPC 骨架；当前不扫描或解析本地会话文件。",
        ),
        items: Vec::new(),
        total: 0,
        source_path: sessions_source_path(repo),
        last_scan_at: current_timestamp(),
    }
}

/// 删除会话的用户动作边界；当前不执行文件删除。
pub fn delete_sessions(repo: &Repository, ids: Vec<String>) -> SessionsDeletePayload {
    SessionsDeletePayload {
        backend_status: pending_status(
            "sessions",
            "delete_sessions",
            "会话删除只完成公开 IPC 骨架；真实删除事务等待证据补齐。",
        ),
        requested_ids: ids.clone(),
        deleted_ids: Vec::new(),
        skipped_ids: ids,
        deleted_count: 0,
        source_path: sessions_source_path(repo),
    }
}

/// 导入会话账号的用户动作边界；当前不解析 session JSON，也不写账号仓储。
pub fn import_chatgpt_session_account(
    _repo: &Repository,
    _session_json: String,
    _overwrite_existing: bool,
) -> AccountSessionImportPayload {
    AccountSessionImportPayload {
        backend_status: pending_status(
            "sessions",
            "import_chatgpt_session_account",
            "会话账号导入只完成公开 IPC 骨架；账号写入和快照生成等待证据补齐。",
        ),
        imported: false,
        account_key: None,
        email: None,
        plan: None,
        snapshot_path: None,
        registry_account_count: 0,
        active_account_key: None,
        refresh_token_placeholder: false,
    }
}

/// 会话分析的 sessions 模块入口；统计来源与解析规则等待证据补齐。
pub fn load_session_analytics(
    _repo: &Repository,
    range: Option<String>,
) -> SessionAnalyticsPayload {
    let normalized_range = AnalyticsRange::from_input(range);
    SessionAnalyticsPayload {
        backend_status: pending_status(
            "sessions",
            "load_session_analytics",
            "会话分析只完成公开 IPC 骨架；当前不推断闭源统计规则。",
        ),
        range: normalized_range,
        total_sessions: 0,
        avg_turns: 0.0,
        active_days: 0,
        series: Vec::new(),
    }
}

fn sessions_source_path(repo: &Repository) -> String {
    repo.paths().sessions_dir.display().to_string()
}
