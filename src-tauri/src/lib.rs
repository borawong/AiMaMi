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
            commands::accounts::begin_add_account_attach_monitor,
            commands::accounts::export_accounts_to_file,
            commands::accounts::import_accounts_from_file,
            commands::accounts::logout,
            commands::accounts::preview_account_import,
            commands::accounts::remove_accounts,
            commands::accounts::switch_account,
            commands::accounts::switch_account_and_restart_codex,
            commands::sessions::load_sessions,
            commands::sessions::delete_sessions,
            commands::sessions::import_chatgpt_session_account,
            commands::sessions::load_session_analytics,
            commands::analytics::load_usage_analytics,
            commands::analytics::load_quota_history,
            commands::analytics::load_token_analytics,
            commands::analytics::load_tool_analytics,
            commands::analytics::load_change_analytics,
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
            commands::relay::activate_relay_provider,
            commands::relay::deactivate_relay_provider,
            commands::relay::delete_relay_provider,
            commands::relay::diagnose_codex_router,
            commands::relay::export_relay_config,
            commands::relay::fetch_relay_models_draft,
            commands::relay::fix_codex_router_issue,
            commands::relay::get_relay_active,
            commands::relay::get_relay_proxy_status,
            commands::relay::import_relay_config,
            commands::relay::load_relay_state,
            commands::relay::run_codex_router_diagnostics,
            commands::relay::set_codex_router_enabled,
            commands::relay::set_block_official_passthrough,
            commands::relay::get_passthrough_audit_log,
            commands::relay::set_relay_provider_network,
            commands::relay::test_relay_draft,
            commands::relay::test_relay_provider,
            commands::relay::upsert_relay_provider,
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
