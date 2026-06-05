# Evidence Paths — windows-1.0.9-relay-core

All paths relative to <source-location>.

## relay_manager (13 leaves — pseudocode-manifest.jsonl + .c files)

raw/aimami/1.0.9/windows/relay-core/relay_manager/relay_keychain_get_api_key/
  ida/pseudocode-manifest.jsonl — status=decompiled, SHA=a5822387fa3f, conf=A
  ida/pseudocode/0001_relay_keychain_get_api_key_sys.c

raw/aimami/1.0.9/windows/relay-core/relay_manager/relay_keychain_set_api_key/
  ida/pseudocode-manifest.jsonl — status=decompiled, SHA=a5822387fa3f, conf=A
  ida/pseudocode/0001_relay_keychain_set_api_key_sys.c

raw/aimami/1.0.9/windows/relay-core/relay_manager/relay_manager_bootstrap/
  ida/pseudocode-manifest.jsonl — status=decompiled, SHA=a5822387fa3f, conf=A
  ida/pseudocode/0001_relay_manager_bootstrap_sys.c

raw/aimami/1.0.9/windows/relay-core/relay_manager/relay_manager_compose_proxy_status/
  ida/pseudocode-manifest.jsonl — status=decompiled, SHA=a5822387fa3f, conf=A
  ida/pseudocode/0001_relay_manager_compose_proxy_status_sys.c

raw/aimami/1.0.9/windows/relay-core/relay_manager/relay_manager_delete_core/
  ida/pseudocode-manifest.jsonl — status=decompiled, SHA=a5822387fa3f, conf=B
  ida/pseudocode/0001_relay_manager_delete_core_sys.c

raw/aimami/1.0.9/windows/relay-core/relay_manager/relay_manager_ensure_proxy_started/
  ida/pseudocode-manifest.jsonl — status=decompiled, SHA=a5822387fa3f, conf=A
  ida/pseudocode/0001_relay_manager_ensure_proxy_started_sys.c

raw/aimami/1.0.9/windows/relay-core/relay_manager/relay_manager_new/
  ida/pseudocode-manifest.jsonl — status=decompiled, SHA=a5822387fa3f, conf=A
  ida/pseudocode/0001_relay_manager_new_sys.c

raw/aimami/1.0.9/windows/relay-core/relay_manager/relay_manager_reset_codex_config_impl/
  ida/pseudocode-manifest.jsonl — status=decompiled, SHA=a5822387fa3f, conf=A
  ida/pseudocode/0001_relay_manager_reset_codex_config_impl_sys.c

raw/aimami/1.0.9/windows/relay-core/relay_manager/relay_manager_set_router_enabled_rollback/
  ida/pseudocode-manifest.jsonl — status=decompiled, SHA=a5822387fa3f, conf=B
  ida/pseudocode/0001_relay_manager_set_router_enabled_rollback_sys.c

raw/aimami/1.0.9/windows/relay-core/relay_manager/relay_manager_upsert_core/
  ida/pseudocode-manifest.jsonl — status=decompiled, SHA=a5822387fa3f, conf=B
  ida/pseudocode/0001_relay_manager_upsert_core_sys.c

raw/aimami/1.0.9/windows/relay-core/relay_manager/relay_state_persist_commit/
  ida/pseudocode-manifest.jsonl — status=decompiled, SHA=a5822387fa3f, conf=B
  ida/pseudocode/0001_relay_state_persist_commit_sys.c

raw/aimami/1.0.9/windows/relay-core/relay_manager/relay_storage_hydrate_secrets/
  ida/pseudocode-manifest.jsonl — status=decompiled, SHA=a5822387fa3f, conf=B
  ida/pseudocode/0001_relay_storage_hydrate_secrets_sys.c

raw/aimami/1.0.9/windows/relay-core/relay_manager/relay_storage_load/
  ida/pseudocode-manifest.jsonl — status=decompiled, SHA=a5822387fa3f, conf=A
  ida/pseudocode/0001_relay_storage_load_sys.c

## relay_proxy_server (9 leaves — intermediate evidence root)

raw/aimami/1.0.9/windows/relay-core/relay_proxy_server/
  AI.md  README.md  manifest.json
intermediate/aimami/1.0.9/windows/relay-core/relay_proxy_server-recon/
  [pseudocode and call-tree detail — intermediate area]

## relay_codex_writer (8 leaves — evidence.md)

raw/aimami/1.0.9/windows/relay-core/relay_codex_writer/apply_codex_state/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_codex_writer/catalog_encode_write/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_codex_writer/export_relay_config/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_codex_writer/import_relay_config/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_codex_writer/managed_block_helper_split/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_codex_writer/managed_block_migration/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_codex_writer/toml_block_renderer/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_codex_writer/toml_section_writer_atomic/evidence.md

## relay_diagnostic (6 leaves — evidence.md)

raw/aimami/1.0.9/windows/relay-core/relay_diagnostic/fix_codex_router_issue_owner_sys/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_diagnostic/relay_diagnostic_engine_core_sys/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_diagnostic/relay_fix_all_repair_core_sys/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_diagnostic/relay_health_check_core_sys/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_diagnostic/relay_preflight_strip_provider_profile/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_diagnostic/relay_startup_cleanup_orphan_provider/evidence.md

## relay_health_audit (11 leaves — evidence.md, recon-seed only)

raw/aimami/1.0.9/windows/relay-core/relay_health_audit/append_entry_write_core_sys/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_health_audit/apply_extra_headers_candidate_sys/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_health_audit/build_openai_headers_candidate_sys/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_health_audit/build_test_request_anthropic_sys/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_health_audit/build_test_request_shared_sys/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_health_audit/get_passthrough_audit_log_owner_sys/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_health_audit/health_check_test_provider_async_core_sys/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_health_audit/interpret_response_async_candidate_sys/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_health_audit/passthrough_audit_log_filter_sys/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_health_audit/passthrough_audit_log_read_sys/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_health_audit/record_passthrough_dispatcher_sys/evidence.md

## relay_thread_migration (5 leaves — evidence.md)

raw/aimami/1.0.9/windows/relay-core/relay_thread_migration/migrate_threads_for_router_with_scope/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_thread_migration/normalize_thread_providers_before_migration/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_thread_migration/replace_first_session_meta_line/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_thread_migration/rollback_rollouts_in_parallel/evidence.md
raw/aimami/1.0.9/windows/relay-core/relay_thread_migration/rollback_threads_for_router/evidence.md

## bootstrap (4 structural leaves — AI.md + manifest.json)

raw/aimami/1.0.9/windows/bootstrap/app_run_entry/AI.md
raw/aimami/1.0.9/windows/bootstrap/app_run_entry/README.md
raw/aimami/1.0.9/windows/bootstrap/app_run_entry/manifest.json

raw/aimami/1.0.9/windows/bootstrap/boot_spawn_threads/AI.md
raw/aimami/1.0.9/windows/bootstrap/boot_spawn_threads/README.md
raw/aimami/1.0.9/windows/bootstrap/boot_spawn_threads/manifest.json

raw/aimami/1.0.9/windows/bootstrap/managed_state_registry/AI.md
raw/aimami/1.0.9/windows/bootstrap/managed_state_registry/README.md
raw/aimami/1.0.9/windows/bootstrap/managed_state_registry/manifest.json

raw/aimami/1.0.9/windows/bootstrap/bootstrap_cache/AI.md
raw/aimami/1.0.9/windows/bootstrap/bootstrap_cache/README.md
raw/aimami/1.0.9/windows/bootstrap/bootstrap_cache/manifest.json
  canonical_ipc_leaf → raw/aimami/1.0.9/windows/daemon/load_bootstrap_state/

## THREAD-MODEL (source for bootstrap evidence)

intermediate/aimami/1.0.9/windows-x64/_threadmodel/THREAD-MODEL.md
