use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum CustomInstructionProtectionState {
    Ready,
    Unmanaged,
    Protected,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum CustomInstructionHistoryAction {
    Apply,
    Clear,
    Rollback,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomInstructionCurrentState {
    pub global_path: String,
    pub file_exists: bool,
    pub managed_block_present: bool,
    pub protection_state: CustomInstructionProtectionState,
    pub issue_message: Option<String>,
    pub managed_content: String,
    pub last_applied_at: Option<i64>,
    pub last_template_code: Option<String>,
    pub last_template_title: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomInstructionHistoryEntry {
    pub id: String,
    pub created_at: i64,
    pub action: CustomInstructionHistoryAction,
    pub source: String,
    pub template_code: Option<String>,
    pub template_title: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomInstructionStatePayload {
    pub current: CustomInstructionCurrentState,
    pub history: Vec<CustomInstructionHistoryEntry>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomInstructionPreviewPayload {
    pub global_path: String,
    pub protection_state: CustomInstructionProtectionState,
    pub issue_message: Option<String>,
    pub current_managed_content: String,
    pub next_managed_content: String,
    pub resulting_content: String,
}
