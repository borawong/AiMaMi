use crate::contracts::{BackendSkeletonStatus, CoreEnvelope, RuntimeExtensionPayload};
use crate::core::error::CoreError;
use crate::repository::RepositoryBundle;
use serde_json::{json, Value};

/// 中文职责说明：运行时扩展事务 owner，插件发现、启停和配置写入后续在本边界内补齐。
pub(crate) struct RuntimeExtensionsUseCase<'a> {
    repositories: &'a RepositoryBundle,
}

impl<'a> RuntimeExtensionsUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle) -> Self {
        Self { repositories }
    }

    pub(crate) fn list_plugins(&self) -> Result<CoreEnvelope<RuntimeExtensionPayload>, CoreError> {
        let _source_path = self.repositories.runtime_extensions().source_path();
        Ok(CoreEnvelope::pending(
            self.payload("list_plugins", None, None, json!({})),
            "list_plugins",
        ))
    }

    pub(crate) fn toggle_plugin(
        &self,
        id: String,
        enabled: bool,
    ) -> Result<CoreEnvelope<RuntimeExtensionPayload>, CoreError> {
        Ok(CoreEnvelope::no_op(
            self.payload("toggle_plugin", Some(id), Some(enabled), json!({})),
            "toggle_plugin",
        ))
    }

    pub(crate) fn get_plugin_config(
        &self,
        id: String,
    ) -> Result<CoreEnvelope<RuntimeExtensionPayload>, CoreError> {
        Ok(CoreEnvelope::no_op(
            self.payload("get_plugin_config", Some(id), None, json!({})),
            "get_plugin_config",
        ))
    }

    pub(crate) fn update_plugin_config(
        &self,
        id: String,
        settings: Option<Value>,
    ) -> Result<CoreEnvelope<RuntimeExtensionPayload>, CoreError> {
        Ok(CoreEnvelope::no_op(
            self.payload(
                "update_plugin_config",
                Some(id),
                None,
                settings.unwrap_or_else(|| json!({})),
            ),
            "update_plugin_config",
        ))
    }

    fn payload(
        &self,
        command: &'static str,
        id: Option<String>,
        enabled: Option<bool>,
        settings: Value,
    ) -> RuntimeExtensionPayload {
        RuntimeExtensionPayload {
            status: BackendSkeletonStatus::for_command("runtime_extensions", command),
            id,
            enabled,
            settings,
            ..Default::default()
        }
    }
}
