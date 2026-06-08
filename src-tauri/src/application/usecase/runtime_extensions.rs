use crate::application::service::{current_timestamp, pending_status};
use crate::contracts::{
    RuntimeExtensionConfigPayload, RuntimeExtensionListPayload, RuntimeExtensionPluginPayload,
    RuntimeExtensionSettingsValue, RuntimeExtensionTogglePayload,
};
use crate::repository::Repository;

pub fn list(repo: &Repository) -> RuntimeExtensionListPayload {
    RuntimeExtensionListPayload {
        backend_status: pending_status(
            "runtime-extensions",
            "list_plugins",
            "插件运行时公开后端只保留空列表合同。",
        ),
        items: Vec::new(),
        total: 0,
        source_path: repo.paths().app_data_dir.display().to_string(),
        last_scan_at: current_timestamp(),
    }
}

pub fn toggle(repo: &Repository, id: String, enabled: bool) -> RuntimeExtensionTogglePayload {
    let plugin = RuntimeExtensionPluginPayload {
        id: id.clone(),
        name: id,
        title: None,
        description: None,
        path: None,
        enabled,
    };
    RuntimeExtensionTogglePayload {
        backend_status: pending_status(
            "runtime-extensions",
            "toggle_plugin",
            "插件运行时启停未在当前公开后端范围内恢复。",
        ),
        plugin,
        items: Vec::new(),
        total: 0,
        source_path: repo.paths().app_data_dir.display().to_string(),
        last_scan_at: current_timestamp(),
    }
}

pub fn config(
    repo: &Repository,
    id: String,
    settings: Option<RuntimeExtensionSettingsValue>,
) -> RuntimeExtensionConfigPayload {
    let updated = settings.is_some();
    RuntimeExtensionConfigPayload {
        backend_status: pending_status(
            "runtime-extensions",
            "plugin_config",
            "插件配置命令仅保留合同，不提升为真实 UI owner。",
        ),
        id,
        settings: settings.unwrap_or(serde_json::Value::Null),
        source_path: repo.paths().app_data_dir.display().to_string(),
        updated,
    }
}
