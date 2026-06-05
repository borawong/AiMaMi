//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: adapters::tauri::commands::system
//! Current role: Tauri command adapter
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::application::BackendServices;
use crate::contracts::{
    ApiModePayload, ApiProxyDetectPayload, ApiProxyMode, ApiProxyTestPayload,
    AutoSwitchConfigPayload, BootstrapStatePayload, CleanPayload, CoreEnvelope,
    CoreSnapshotPayload, DaemonRunPayload, DiagnosePayload, RebuildRegistryPayload, SystemInfo,
    UpdateInstallabilityPayload,
};
use tauri::State;

#[tauri::command]
pub(crate) fn load_snapshot(
    services: State<'_, BackendServices>,
    local_only: Option<bool>,
) -> Result<CoreEnvelope<CoreSnapshotPayload>, String> {
    Ok(services
        .snapshot()
        .load_snapshot(local_only.unwrap_or(false)))
}

#[tauri::command]
pub(crate) fn clean(
    services: State<'_, BackendServices>,
) -> Result<CoreEnvelope<CleanPayload>, String> {
    Ok(services.system().clean())
}

#[tauri::command]
pub(crate) fn rebuild_registry(
    services: State<'_, BackendServices>,
) -> Result<CoreEnvelope<RebuildRegistryPayload>, String> {
    Ok(services.system().rebuild_registry())
}

#[tauri::command]
pub(crate) fn set_auto_switch(
    services: State<'_, BackendServices>,
    enabled: bool,
) -> Result<CoreEnvelope<AutoSwitchConfigPayload>, String> {
    Ok(services.system().set_auto_switch(enabled))
}

#[tauri::command]
pub(crate) fn configure_auto_switch(
    services: State<'_, BackendServices>,
    threshold_5h_percent: Option<i32>,
    threshold_weekly_percent: Option<i32>,
) -> Result<CoreEnvelope<AutoSwitchConfigPayload>, String> {
    Ok(services
        .system()
        .configure_auto_switch(threshold_5h_percent, threshold_weekly_percent))
}

#[tauri::command]
pub(crate) fn set_api_proxy_config(
    services: State<'_, BackendServices>,
    mode: ApiProxyMode,
    url: Option<String>,
) -> Result<CoreEnvelope<ApiModePayload>, String> {
    Ok(services.system().set_api_proxy_config(mode, url))
}

#[tauri::command]
pub(crate) fn test_api_proxy_config(
    services: State<'_, BackendServices>,
    mode: ApiProxyMode,
    url: Option<String>,
) -> Result<CoreEnvelope<ApiProxyTestPayload>, String> {
    Ok(services.system().test_api_proxy_config(mode, url))
}

#[tauri::command]
pub(crate) fn detect_api_proxy_config(
    services: State<'_, BackendServices>,
) -> Result<CoreEnvelope<ApiProxyDetectPayload>, String> {
    Ok(services.system().detect_api_proxy_config())
}

#[tauri::command]
pub(crate) fn get_usage_refresh_interval(
    services: State<'_, BackendServices>,
) -> Result<String, String> {
    Ok(services.system().get_usage_refresh_interval())
}

#[tauri::command]
pub(crate) fn set_usage_refresh_interval(
    services: State<'_, BackendServices>,
    interval: String,
) -> Result<String, String> {
    Ok(services.system().set_usage_refresh_interval(interval))
}

#[tauri::command]
pub(crate) fn run_daemon_once(
    services: State<'_, BackendServices>,
) -> Result<CoreEnvelope<DaemonRunPayload>, String> {
    Ok(services.system().run_daemon_once())
}

#[tauri::command]
pub(crate) fn diagnose(
    services: State<'_, BackendServices>,
) -> Result<CoreEnvelope<DiagnosePayload>, String> {
    Ok(services.system().diagnose())
}

#[tauri::command]
pub(crate) fn restart_codex() -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub(crate) fn graceful_restart_for_update() -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub(crate) fn check_update_installability(
    services: State<'_, BackendServices>,
) -> Result<UpdateInstallabilityPayload, String> {
    Ok(services.system().check_update_installability())
}

#[tauri::command]
pub(crate) fn load_bootstrap_state(
    services: State<'_, BackendServices>,
) -> Result<CoreEnvelope<BootstrapStatePayload>, String> {
    Ok(services.system().load_bootstrap_state())
}

#[tauri::command]
pub(crate) fn open_path(_path: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub(crate) fn get_system_info(services: State<'_, BackendServices>) -> Result<SystemInfo, String> {
    Ok(services.system().get_system_info())
}
