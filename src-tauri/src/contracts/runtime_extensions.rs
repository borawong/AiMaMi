use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};
use serde_json::Number;
use std::collections::BTreeMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(untagged)]
pub(crate) enum RuntimeExtensionSettingsValue {
    Null,
    Bool(bool),
    Number(Number),
    String(String),
    Array(Vec<RuntimeExtensionSettingsValue>),
    Object(BTreeMap<String, RuntimeExtensionSettingsValue>),
}

impl Default for RuntimeExtensionSettingsValue {
    fn default() -> Self {
        Self::Object(BTreeMap::new())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RuntimeExtensionPluginPayload {
    pub id: String,
    pub name: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub path: Option<String>,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RuntimeExtensionListPayload {
    pub backend_status: BackendSkeletonStatus,
    pub items: Vec<RuntimeExtensionPluginPayload>,
    pub total: usize,
    pub source_path: String,
    pub last_scan_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RuntimeExtensionTogglePayload {
    pub backend_status: BackendSkeletonStatus,
    pub plugin: RuntimeExtensionPluginPayload,
    pub items: Vec<RuntimeExtensionPluginPayload>,
    pub total: usize,
    pub source_path: String,
    pub last_scan_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RuntimeExtensionConfigPayload {
    pub backend_status: BackendSkeletonStatus,
    pub id: String,
    pub settings: RuntimeExtensionSettingsValue,
    pub source_path: String,
    pub updated: bool,
}
