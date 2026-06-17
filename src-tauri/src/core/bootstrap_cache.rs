use crate::core::models::{CoreError, CoreSnapshotPayload, McpServerListPayload, SkillListPayload};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct BootstrapStatePayload {
    #[serde(default)]
    pub written_at: Option<i64>,
    #[serde(default)]
    pub snapshot_progressive: Option<CoreSnapshotPayload>,
    #[serde(default)]
    pub usage_analytics: Option<crate::core::analytics::UsageAnalyticsPayload>,
    #[serde(default)]
    pub mcp_servers: Option<McpServerListPayload>,
    #[serde(default)]
    pub installed_skills: Option<SkillListPayload>,
}

pub fn load(path: &Path) -> BootstrapStatePayload {
    std::fs::read_to_string(path)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default()
}

pub fn update<F>(path: &Path, mut apply: F) -> Result<(), CoreError>
where
    F: FnMut(&mut BootstrapStatePayload),
{
    let mut state = load(path);
    apply(&mut state);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(path, serde_json::to_string_pretty(&state)?)?;
    Ok(())
}
