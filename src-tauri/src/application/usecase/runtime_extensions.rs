use crate::contracts::{BackendSkeletonStatus, CoreEnvelope, RuntimeExtensionPayload};
use crate::core::dto::{BackendBoundaryProbe, BackendOperationPlan};
use crate::core::error::CoreError;
use crate::repository::RepositoryBundle;
use serde_json::{json, Value};

const MODULE: &str = "runtime_extensions";

/// 中文职责说明：运行时扩展事务 owner，插件发现、启停和配置写入后续在本边界内补齐。
pub(crate) struct RuntimeExtensionsUseCase<'a> {
    repositories: &'a RepositoryBundle,
}

impl<'a> RuntimeExtensionsUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle) -> Self {
        Self { repositories }
    }

    pub(crate) fn list_plugins(&self) -> Result<CoreEnvelope<RuntimeExtensionPayload>, CoreError> {
        let plan = self.pending_plan("list_plugins");
        Ok(CoreEnvelope::from_backend_plan(
            self.payload(&plan, None, None, json!({})),
            &plan,
        ))
    }

    pub(crate) fn toggle_plugin(
        &self,
        id: String,
        enabled: bool,
    ) -> Result<CoreEnvelope<RuntimeExtensionPayload>, CoreError> {
        let id = required_text(id, "empty_runtime_extension_id", "运行时扩展标识不能为空。")?;
        let plan = self.no_op_plan("toggle_plugin");
        Ok(CoreEnvelope::from_backend_plan(
            self.payload(&plan, Some(id), Some(enabled), json!({})),
            &plan,
        ))
    }

    pub(crate) fn get_plugin_config(
        &self,
        id: String,
    ) -> Result<CoreEnvelope<RuntimeExtensionPayload>, CoreError> {
        let id = required_text(id, "empty_runtime_extension_id", "运行时扩展标识不能为空。")?;
        let plan = self.no_op_plan("get_plugin_config");
        Ok(CoreEnvelope::from_backend_plan(
            self.payload(&plan, Some(id), None, json!({})),
            &plan,
        ))
    }

    pub(crate) fn update_plugin_config(
        &self,
        id: String,
        settings: Option<Value>,
    ) -> Result<CoreEnvelope<RuntimeExtensionPayload>, CoreError> {
        let id = required_text(id, "empty_runtime_extension_id", "运行时扩展标识不能为空。")?;
        let settings = optional_json_value(settings, "empty_runtime_extension_settings")?;
        let plan = self.no_op_plan("update_plugin_config");
        Ok(CoreEnvelope::from_backend_plan(
            self.payload(&plan, Some(id), None, settings),
            &plan,
        ))
    }

    fn payload(
        &self,
        plan: &BackendOperationPlan,
        id: Option<String>,
        enabled: Option<bool>,
        settings: Value,
    ) -> RuntimeExtensionPayload {
        RuntimeExtensionPayload {
            status: BackendSkeletonStatus::from_plan(plan),
            id,
            enabled,
            settings,
            ..Default::default()
        }
    }

    fn pending_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::pending(MODULE, command, self.repository_boundary())
    }

    fn no_op_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::no_op(MODULE, command, self.repository_boundary())
    }

    fn repository_boundary(&self) -> BackendBoundaryProbe {
        BackendBoundaryProbe::from_repository_source(
            self.repositories.runtime_extensions().source_path(),
        )
    }
}

fn required_text(
    value: String,
    code: &'static str,
    public_message: &'static str,
) -> Result<String, CoreError> {
    let value = value.trim().to_owned();
    if value.is_empty() {
        Err(CoreError::domain(code, public_message))
    } else {
        Ok(value)
    }
}

fn optional_json_value(value: Option<Value>, code: &'static str) -> Result<Value, CoreError> {
    match value {
        Some(Value::Null) => Err(CoreError::domain(code, "运行时扩展配置不能为空。")),
        Some(value) => Ok(value),
        None => Ok(json!({})),
    }
}
