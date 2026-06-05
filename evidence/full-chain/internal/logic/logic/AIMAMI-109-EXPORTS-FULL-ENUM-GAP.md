# AiMaMi 1.0.9 Exports Full Enum Gap

scope=upstream_frontend_ipc_exports_vs_current_source archive_api_and_tauri_handlers
mode=additive_review_no_gate_promotion
source_upstream_frontend=`<source-location>/data/aimami-1.0.9-frontend-command-classification.json`
source_current_source archive=`src/lib/api.ts` + `src-tauri/src/lib.rs`

## Counts

- upstream AiMaMi 1.0.9 frontend IPC commands: 127
- current source archive `src/lib/api.ts` invoke exports: 104
- current source archive registered Tauri handlers: 104
- current source archive API/handler mismatch: 0
- upstream commands missing from current source archive handlers/API: 42
- current source archive handlers not in upstream AiMaMi 1.0.9 frontend IPC: 19

## Missing From Current source archive By Category

### Accounts

Implementation gap, but reverse gate is already closed in both account packages:

- `import_chatgpt_session_account`

### Plugins

Implementation gap. Both macOS and Windows plugin reverse packages are closed
at 13/13, but current source archive has no live plugin registry command surface:

- `list_plugins`
- `toggle_plugin`
- `get_plugin_config`
- `update_plugin_config`

### System / Shell

Implementation/API gap or current-source archive capability substitution:

- `get_image_compat`: upstream IPC exists and both platform system packages
  record it as ready.
- `set_image_compat`: upstream IPC exists and both platform system packages
  record it as ready.
- `open_path`: current source archive uses `@tauri-apps/plugin-opener` through
  `api.openPath`, not a Tauri command handler.

### Voice

Product-decision gap, not a reverse blocker. Both voice packages record the
same-platform accepted backend absence/orphan substitute. Current source archive has
residual voice components but no live route/API/adapter chain.

- `load_voice_workspace`
- `load_voice_runtime_status`
- `load_voice_llm_config`
- `save_voice_llm_config`
- `test_voice_llm_config`
- `load_voice_asr_config`
- `save_voice_asr_config`
- `test_voice_asr_config`
- `upsert_voice_template`
- `remove_voice_template`
- `upsert_voice_vocabulary`
- `remove_voice_vocabulary`
- `replace_voice_vocabulary_kind`
- `upsert_voice_vocabulary_app_scope`
- `remove_voice_vocabulary_app_scope`
- `resolve_voice_vocabulary_app_info`
- `generate_voice_prompt`
- `remove_voice_history_entry`
- `request_voice_permissions`
- `request_accessibility_permission`
- `set_voice_global_shortcut`
- `capture_voice_trigger_key`
- `cancel_voice_trigger_capture`
- `set_voice_trigger_listener_suppressed`
- `set_voice_trigger_key`
- `set_voice_trigger_bindings`
- `update_voice_runtime_settings`
- `set_voice_processing_mode_id`
- `start_voice_capture`
- `stop_voice_capture`
- `inject_voice_text`
- `show_voice_search_overlay`
- `set_voice_mode_shortcut`
- `remove_voice_mode_shortcut`

## Current source archive Extra Handlers Not In Upstream Frontend IPC

These are source archive product surfaces or local integration helpers; do not place them
into upstream reverse queues unless a same-version AiMaMi backend command string
is independently confirmed.

- `bind_project_codeup_origin`
- `check_project_health`
- `handle_tray_menu_event`
- `init_project`
- `inspect_onboarding_status`
- `inspect_project_config`
- `install_limix_cli`
- `list_accounts`
- `list_projects`
- `preview_project_config_init`
- `recover_unindexed_sessions`
- `refresh_full_runtime_snapshot`
- `repair_global_limix_hook`
- `repair_project_config`
- `rollback_project_config_init`
- `save_limix_token`
- `save_sourcebot_token`
- `set_tray_locale`
- `sync_marketplace_mirror`

## Module Status Crosswalk

- accounts: upstream missing current source archive implementation = 1; reverse status =
  closed full leaf on macOS and Windows.
- plugins: upstream missing current source archive implementation = 4; reverse status =
  closed full leaf on macOS and Windows.
- relay: upstream/current source archive export count matches for the 19 relay frontend
  commands; remaining strict ceilings are HTTP-terminal behavior, not export
  enumeration gaps.
- sessions/analytics: 8/8 upstream commands exist in current source archive exports.
- mcp: 4/4 upstream commands exist in current source archive exports.
- skills: 6/6 upstream commands exist in current source archive exports.
- custom-instructions: 5/5 upstream commands exist in current source archive exports.
- system: `get_image_compat` and `set_image_compat` are missing current source archive
  command/API exports; `open_path` is substituted by plugin-opener.
- voice: 34/34 upstream voice frontend IPC commands are absent from current source archive
  exports by product boundary.

## Direct Next Gaps

1. Implement current source archive surfaces for `import_chatgpt_session_account`.
2. Implement current source archive plugin registry surfaces for the four upstream plugin
   commands, or explicitly record a product decision to keep them absent.
3. Implement `get_image_compat` / `set_image_compat` current source archive API and Tauri
   handlers if image compatibility parity is required.
4. Keep voice absent unless product explicitly reopens the voice module.
5. Treat the 19 source archive-only handlers as product/local, not upstream gaps.
