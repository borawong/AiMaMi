# macOS 1.0.9 Frontend CCF With Found App

Batch: lane-60 macos-109-frontend-ccf-rerun-with-found-app

## Verdict

- App identity: confirmed AiMaMi 1.0.9, binary SHA 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482.
- Raw extraction: <source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app
- CCF rows: 97
- IPC rows: 128
- Unique command coverage: 79/127
- accepted_frontend_ccf: false

## Why Not Promoted

The rerun fixes the previous missing-app blocker and produces valid non-empty minified frontend CCF rows, but it does not close full frontend CCF acceptance for the whole IPC universe. 50 unique IPC commands still have no recovered frontend CCF row in this bounded minified pass. This reducer does not evaluate backend owner, pseudocode, call-tree, interface/error/side-effect, same-platform gate, or test/acceptance mapping.

No readyToImplement, implementation_use, gate_accepted, or full_leaf_100 promotion is made.

## Missing Unique IPC Commands

- apply_custom_instruction
- begin_add_account_attach_monitor
- cancel_voice_trigger_capture
- capture_voice_trigger_key
- clean
- clear_custom_instruction_block
- diagnose
- generate_voice_prompt
- get_passthrough_audit_log
- get_plugin_config
- get_relay_active
- get_relay_proxy_status
- inject_voice_text
- load_custom_instruction_state
- load_voice_asr_config
- load_voice_llm_config
- load_voice_runtime_status
- load_voice_workspace
- logout
- preview_custom_instruction_apply
- rebuild_registry
- remove_voice_history_entry
- remove_voice_mode_shortcut
- remove_voice_template
- remove_voice_vocabulary
- remove_voice_vocabulary_app_scope
- replace_voice_vocabulary_kind
- request_accessibility_permission
- request_voice_permissions
- resolve_voice_vocabulary_app_info
- rollback_custom_instruction
- run_daemon_once
- save_voice_asr_config
- save_voice_llm_config
- set_voice_global_shortcut
- set_voice_mode_shortcut
- set_voice_processing_mode_id
- set_voice_trigger_bindings
- set_voice_trigger_key
- set_voice_trigger_listener_suppressed
- show_voice_search_overlay
- start_voice_capture
- stop_voice_capture
- test_voice_asr_config
- test_voice_llm_config
- update_plugin_config
- update_voice_runtime_settings
- upsert_voice_template
- upsert_voice_vocabulary
- upsert_voice_vocabulary_app_scope

## Pointers

- frontend-control-flow: <source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/frontend-control-flow.jsonl
- ipc-contracts: <source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ipc-contracts.jsonl
- coverage summary: <source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ccf-coverage-summary.json
- raw manifest: <source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/manifest.json
