//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: contracts::custom_instructions
//! Current role: DTO contract
//! Future integration point: replace this stub through the declared port/use-case boundary.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub(crate) enum CustomInstructionProtectionState {
    Ready,
    #[default]
    Unmanaged,
    Protected,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub(crate) enum CustomInstructionHistoryAction {
    #[default]
    Apply,
    Clear,
    Rollback,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CustomInstructionCurrentState {
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

impl Default for CustomInstructionCurrentState {
    fn default() -> Self {
        Self {
            global_path: String::new(),
            file_exists: false,
            managed_block_present: false,
            protection_state: CustomInstructionProtectionState::Unmanaged,
            issue_message: None,
            managed_content: String::new(),
            last_applied_at: None,
            last_template_code: None,
            last_template_title: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CustomInstructionHistoryEntry {
    pub id: String,
    pub created_at: i64,
    pub action: CustomInstructionHistoryAction,
    pub source: String,
    pub template_code: Option<String>,
    pub template_title: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CustomInstructionStatePayload {
    pub current: CustomInstructionCurrentState,
    pub history: Vec<CustomInstructionHistoryEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CustomInstructionPreviewPayload {
    pub global_path: String,
    pub protection_state: CustomInstructionProtectionState,
    pub issue_message: Option<String>,
    pub current_managed_content: String,
    pub next_managed_content: String,
    pub resulting_content: String,
}

impl Default for CustomInstructionPreviewPayload {
    fn default() -> Self {
        Self {
            global_path: String::new(),
            protection_state: CustomInstructionProtectionState::Unmanaged,
            issue_message: None,
            current_managed_content: String::new(),
            next_managed_content: String::new(),
            resulting_content: String::new(),
        }
    }
}
