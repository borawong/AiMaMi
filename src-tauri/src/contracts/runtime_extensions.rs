use crate::contracts::BackendSkeletonStatus;
use serde::Serialize;

pub type RuntimeExtensionSettingsValue = serde_json::Value;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeExtensionPluginPayload {
    pub id: String,
    pub name: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub path: Option<String>,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeExtensionListPayload {
    pub backend_status: BackendSkeletonStatus,
    pub items: Vec<RuntimeExtensionPluginPayload>,
    pub total: i32,
    pub source_path: String,
    pub last_scan_at: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeExtensionTogglePayload {
    pub backend_status: BackendSkeletonStatus,
    pub plugin: RuntimeExtensionPluginPayload,
    pub items: Vec<RuntimeExtensionPluginPayload>,
    pub total: i32,
    pub source_path: String,
    pub last_scan_at: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeExtensionConfigPayload {
    pub backend_status: BackendSkeletonStatus,
    pub id: String,
    pub settings: RuntimeExtensionSettingsValue,
    pub source_path: String,
    pub updated: bool,
}
