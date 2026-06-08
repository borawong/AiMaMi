use crate::contracts::{CoreWarning, RelayPassthroughAuditEntryPayload};
use crate::repository::{relay as relay_repository, Repository};

pub(crate) struct RelayUseCaseBoundary;

pub(crate) trait RelayUseCaseBoundaryPort {}

/// 设置官方直连拦截开关的用户动作边界；真实持久化等待 raw/internal 证据补齐。
pub fn set_block_official_passthrough(repo: &Repository, blocked: bool) -> (bool, CoreWarning) {
    let value = relay_repository::record_passthrough_policy_intent(repo, blocked);
    (
        value,
        pending_warning(
            "set_block_official_passthrough",
            "relay 官方直连拦截开关只完成公开六边形骨架；未写入未恢复的闭源代理配置。",
        ),
    )
}

/// 读取官方直连审计日志的用户动作边界；当前公开仓储没有可证明的日志来源。
pub fn get_passthrough_audit_log(
    repo: &Repository,
    limit: Option<u32>,
) -> (Vec<RelayPassthroughAuditEntryPayload>, CoreWarning) {
    let normalized_limit = limit.unwrap_or(50).min(200);
    (
        relay_repository::load_passthrough_audit_log(repo, normalized_limit),
        pending_warning(
            "get_passthrough_audit_log",
            "relay 官方直连审计日志只完成公开六边形骨架；当前返回空集合等待证据补齐。",
        ),
    )
}

fn pending_warning(command: &str, message: &str) -> CoreWarning {
    CoreWarning {
        code: format!("relay.{command}.pending"),
        message: message.to_string(),
    }
}
