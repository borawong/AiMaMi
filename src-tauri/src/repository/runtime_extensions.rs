use crate::contracts::RuntimeExtensionPluginPayload;
use crate::core::error::CoreError;
use crate::repository::adapter::FileSystemAdapter;
use crate::repository::paths::{RepositoryPath, RepositoryPathContext};
use serde_json::Value;
use std::sync::Arc;

#[derive(Clone)]
pub(crate) struct RuntimeExtensionsRepository {
    fs: Arc<dyn FileSystemAdapter>,
    paths: RepositoryPathContext,
}

impl RuntimeExtensionsRepository {
    pub(crate) fn new(fs: Arc<dyn FileSystemAdapter>, paths: RepositoryPathContext) -> Self {
        Self { fs, paths }
    }

    pub(crate) fn source_path(&self) -> String {
        self.paths
            .contract_string(RepositoryPath::RuntimeExtensionsSource)
    }

    pub(crate) fn list_plugins(&self) -> Result<Vec<RuntimeExtensionPluginPayload>, CoreError> {
        let path = self.paths.resolve(RepositoryPath::RuntimeExtensionsSource);
        if !self.fs.exists(&path) {
            return Ok(Vec::new());
        }

        let content = self.fs.read_to_string(&path)?;
        parse_plugin_records(&content)
    }
}

fn parse_plugin_records(content: &str) -> Result<Vec<RuntimeExtensionPluginPayload>, CoreError> {
    let value = serde_json::from_str::<Value>(content).map_err(json_parse_error)?;
    if value.is_array() {
        return serde_json::from_value(value).map_err(json_parse_error);
    }

    if let Some(items) = value.get("items") {
        return serde_json::from_value(items.clone()).map_err(json_parse_error);
    }

    Err(CoreError::repository(
        "runtime_extensions_parse_failed",
        "运行时扩展插件列表格式不正确。",
    )
    .with_diagnostic("runtime extensions payload missing items array"))
}

fn json_parse_error(error: serde_json::Error) -> CoreError {
    CoreError::repository(
        "runtime_extensions_parse_failed",
        "运行时扩展插件列表解析失败。",
    )
    .with_diagnostic(error.to_string())
}
