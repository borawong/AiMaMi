use crate::contracts::{
    BackendSkeletonStatus, CoreEnvelope, RuntimeExtensionConfigPayload,
    RuntimeExtensionListPayload, RuntimeExtensionPluginPayload, RuntimeExtensionSettingsValue,
    RuntimeExtensionTogglePayload,
};
use crate::core::dto::{BackendBoundaryProbe, BackendOperationPlan};
use crate::core::error::CoreError;
use crate::repository::RepositoryBundle;

const MODULE: &str = "runtime_extensions";

pub(crate) struct RuntimeExtensionsUseCase<'a> {
    repositories: &'a RepositoryBundle,
}

impl<'a> RuntimeExtensionsUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle) -> Self {
        Self { repositories }
    }

    pub(crate) fn list_plugins(
        &self,
    ) -> Result<CoreEnvelope<RuntimeExtensionListPayload>, CoreError> {
        let plan = self.pending_plan("list_plugins");
        Ok(CoreEnvelope::from_backend_plan(
            self.list_payload(&plan),
            &plan,
        ))
    }

    pub(crate) fn toggle_plugin(
        &self,
        id: String,
        enabled: bool,
    ) -> Result<CoreEnvelope<RuntimeExtensionTogglePayload>, CoreError> {
        let id = required_text(id, "empty_runtime_extension_id", "运行时扩展标识不能为空。")?;
        let plan = self.no_op_plan("toggle_plugin");
        let plugin = RuntimeExtensionPluginPayload {
            id: id.clone(),
            name: id,
            title: None,
            description: None,
            path: None,
            enabled,
        };
        Ok(CoreEnvelope::from_backend_plan(
            RuntimeExtensionTogglePayload {
                backend_status: BackendSkeletonStatus::from_plan(&plan),
                plugin: plugin.clone(),
                items: vec![plugin],
                total: 1,
                source_path: self.source_path(),
                last_scan_at: 0,
            },
            &plan,
        ))
    }

    pub(crate) fn get_plugin_config(
        &self,
        id: String,
    ) -> Result<CoreEnvelope<RuntimeExtensionConfigPayload>, CoreError> {
        let id = required_text(id, "empty_runtime_extension_id", "运行时扩展标识不能为空。")?;
        let plan = self.no_op_plan("get_plugin_config");
        Ok(CoreEnvelope::from_backend_plan(
            self.config_payload(&plan, id, RuntimeExtensionSettingsValue::default(), false),
            &plan,
        ))
    }

    pub(crate) fn update_plugin_config(
        &self,
        id: String,
        settings: Option<RuntimeExtensionSettingsValue>,
    ) -> Result<CoreEnvelope<RuntimeExtensionConfigPayload>, CoreError> {
        let id = required_text(id, "empty_runtime_extension_id", "运行时扩展标识不能为空。")?;
        let settings = optional_settings(settings, "empty_runtime_extension_settings")?;
        let plan = self.no_op_plan("update_plugin_config");
        Ok(CoreEnvelope::from_backend_plan(
            self.config_payload(&plan, id, settings, false),
            &plan,
        ))
    }

    fn list_payload(&self, plan: &BackendOperationPlan) -> RuntimeExtensionListPayload {
        RuntimeExtensionListPayload {
            backend_status: BackendSkeletonStatus::from_plan(plan),
            items: Vec::new(),
            total: 0,
            source_path: self.source_path(),
            last_scan_at: 0,
        }
    }

    fn config_payload(
        &self,
        plan: &BackendOperationPlan,
        id: String,
        settings: RuntimeExtensionSettingsValue,
        updated: bool,
    ) -> RuntimeExtensionConfigPayload {
        RuntimeExtensionConfigPayload {
            backend_status: BackendSkeletonStatus::from_plan(plan),
            id,
            settings,
            source_path: self.source_path(),
            updated,
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

    fn source_path(&self) -> String {
        self.repositories.runtime_extensions().source_path()
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

fn optional_settings(
    value: Option<RuntimeExtensionSettingsValue>,
    code: &'static str,
) -> Result<RuntimeExtensionSettingsValue, CoreError> {
    match value {
        Some(RuntimeExtensionSettingsValue::Null) => {
            Err(CoreError::domain(code, "运行时扩展配置不能为空。"))
        }
        Some(value) => Ok(value),
        None => Ok(RuntimeExtensionSettingsValue::default()),
    }
}
