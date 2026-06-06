use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub(crate) enum McpTransport {
    Stdio,
    Http,
    Sse,
    #[default]
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct McpServerSummary {
    pub name: String,
    pub transport: McpTransport,
    pub enabled: bool,
    pub source_path: String,
    pub command: Option<String>,
    pub args: Vec<String>,
    pub url: Option<String>,
    pub headers: HashMap<String, String>,
    pub environment: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct McpServerListPayload {
    pub status: BackendSkeletonStatus,
    pub items: Vec<McpServerSummary>,
    pub total: i32,
    pub source_path: String,
    pub last_scan_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct McpServerMutationPayload {
    pub status: BackendSkeletonStatus,
    pub server: McpServerSummary,
    pub total: i32,
    pub source_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "camelCase")]
pub(crate) struct McpServerRemovePayload {
    pub status: BackendSkeletonStatus,
    pub removed_name: String,
    pub total: i32,
    pub source_path: String,
}
