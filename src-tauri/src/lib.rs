pub mod adapters;
pub mod application;
pub mod commands;
pub mod contracts;
pub mod core;
pub mod platform;
pub mod repository;

use repository::Repository;
use std::sync::Mutex;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(Mutex::new(Repository::new()))
        .invoke_handler(tauri::generate_handler![
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
            commands::runtime_extensions::list_plugins,
            commands::runtime_extensions::toggle_plugin,
            commands::runtime_extensions::get_plugin_config,
            commands::runtime_extensions::update_plugin_config,
            commands::relay::set_block_official_passthrough,
            commands::relay::get_passthrough_audit_log,
            commands::system::load_snapshot,
            commands::system::refresh_usage_snapshot,
            commands::system::load_bootstrap_state,
            commands::system::clean,
            commands::system::rebuild_registry,
            commands::system::diagnose,
            commands::system::set_auto_switch,
            commands::system::configure_auto_switch,
            commands::system::set_api_proxy_config,
            commands::system::test_api_proxy_config,
            commands::system::detect_api_proxy_config,
            commands::system::run_daemon_once,
            commands::system::get_usage_refresh_interval,
            commands::system::set_usage_refresh_interval,
            commands::system::check_update_installability,
            commands::system::graceful_restart_for_update,
            commands::system::restart_codex,
            commands::system::force_kill_codex,
            commands::system::reset_codex_config,
            commands::system::open_path,
            commands::system::get_system_info,
            commands::system::focus_main_window,
            commands::system::get_device_id,
            commands::system::get_notification_client_state,
            commands::system::get_mystery_unlock_grants,
            commands::system::merge_mystery_unlock_grants,
            commands::system::get_or_create_remote_device_secret,
            commands::system::import_remote_device_secret_if_empty,
            commands::system::load_pending_auto_switch,
            commands::system::dismiss_pending_auto_switch,
            commands::system::confirm_pending_auto_switch,
            commands::system::confirm_pending_auto_switch_and_restart_codex,
            commands::system::has_notch,
            commands::system::get_hotspot_enabled,
            commands::system::set_hotspot_enabled,
            commands::system::hotspot_ready,
            commands::system::get_image_compat,
            commands::system::set_image_compat,
        ])
        .run(tauri::generate_context!())
        .expect("AiMaMi 后端启动失败");
}
