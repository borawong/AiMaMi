use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AccountActionPayload {
    pub status: BackendSkeletonStatus,
    pub account_key: Option<String>,
    pub account_keys: Vec<String>,
    pub file_path: Option<String>,
    pub target_path: Option<String>,
    pub selected_keys: Vec<String>,
    pub session_json_present: bool,
    pub overwrite_existing: bool,
}
