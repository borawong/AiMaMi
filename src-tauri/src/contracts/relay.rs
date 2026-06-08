use serde::Serialize;

pub(crate) struct RelayContractBoundary;

pub(crate) type RelayContractBoundaryPlaceholder = ();

/// relay 官方直连审计日志条目 DTO，字段必须和前端 RelayPassthroughAuditEntry 保持同步。
#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RelayPassthroughAuditEntryPayload {
    pub timestamp: String,
    pub event: String,
    pub direction: String,
    pub provider_id: Option<String>,
    pub model: Option<String>,
    pub blocked: bool,
    pub message: Option<String>,
}
