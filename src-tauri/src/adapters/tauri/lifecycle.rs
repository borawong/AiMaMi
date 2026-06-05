//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: adapters::tauri::lifecycle
//! Current role: Tauri command adapter
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::adapters::tauri::{commands, tray, window};
use crate::application::BackendServices;
use tauri::Manager;

pub(crate) fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(BackendServices::default())
        .setup(|app| {
            window::install_close_to_hide(app);
            tray::install(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::system::load_snapshot,
            commands::mcp::load_mcp_servers,
            commands::mcp::upsert_mcp_server,
            commands::mcp::set_mcp_server_enabled,
            commands::mcp::remove_mcp_server,
            commands::skills::load_installed_skills,
            commands::skills::load_skill_backups,
            commands::skills::import_skill,
            commands::skills::remove_skill,
            commands::skills::restore_skill_backup,
            commands::skills::delete_skill_backup,
            commands::custom_instructions::load_custom_instruction_state,
            commands::custom_instructions::preview_custom_instruction_apply,
            commands::custom_instructions::apply_custom_instruction,
            commands::custom_instructions::clear_custom_instruction_block,
            commands::custom_instructions::rollback_custom_instruction,
            commands::system::clean,
            commands::system::rebuild_registry,
            commands::system::set_auto_switch,
            commands::system::configure_auto_switch,
            commands::system::set_api_proxy_config,
            commands::system::test_api_proxy_config,
            commands::system::detect_api_proxy_config,
            commands::system::get_usage_refresh_interval,
            commands::system::set_usage_refresh_interval,
            commands::system::run_daemon_once,
            commands::system::diagnose,
            commands::system::restart_codex,
            commands::system::graceful_restart_for_update,
            commands::system::check_update_installability,
            commands::system::load_bootstrap_state,
            commands::system::open_path,
            commands::system::get_system_info,
            commands::hotspot::has_notch,
            commands::hotspot::get_hotspot_enabled,
            commands::hotspot::set_hotspot_enabled,
            commands::hotspot::focus_main_window,
            commands::hotspot::hotspot_ready,
        ])
        .build(tauri::generate_context!())
        .expect("error while building AiMaMi");

    app.run(|app_handle, event| {
        #[cfg(target_os = "macos")]
        if let tauri::RunEvent::Reopen { .. } = event {
            let _ = window::focus_main_window(app_handle);
        }
    });
}
