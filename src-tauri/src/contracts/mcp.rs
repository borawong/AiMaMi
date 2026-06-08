use crate::contracts::BackendSkeletonStatus;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum McpTransport {
    Stdio,
    Http,
    Sse,
    #[default]
    Unknown,
}

impl McpTransport {
    pub fn from_input(value: &str) -> Self {
        match value {
            "stdio" => Self::Stdio,
            "http" => Self::Http,
            "sse" => Self::Sse,
            _ => Self::Unknown,
        }
    }

    pub fn as_toml_value(&self) -> &'static str {
        match self {
            Self::Stdio => "stdio",
            Self::Http => "http",
            Self::Sse => "sse",
            Self::Unknown => "stdio",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct McpServerSummary {
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

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpServerConfigInput {
    pub name: Option<String>,
    pub transport: Option<String>,
    pub enabled: Option<bool>,
    pub command: Option<String>,
    #[serde(default)]
    pub args: Vec<String>,
    pub url: Option<String>,
    #[serde(default)]
    pub headers: HashMap<String, String>,
    #[serde(default)]
    pub environment: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct McpServerListPayload {
    pub status: BackendSkeletonStatus,
    pub items: Vec<McpServerSummary>,
    pub total: i32,
    pub source_path: String,
    pub last_scan_at: i64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct McpServerMutationPayload {
    pub status: BackendSkeletonStatus,
    pub server: McpServerSummary,
    pub total: i32,
    pub source_path: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct McpServerRemovePayload {
    pub status: BackendSkeletonStatus,
    pub removed_name: String,
    pub total: i32,
    pub source_path: String,
}
