# Evidence Paths — relay 1.0.9 Windows x64

All raw evidence lives at `<source-location>`.
Do not copy raw artifacts here — only pointer references.

---

## Binary SOT
`<source-location>/source-binary/AiMaM 1.0.9 win64.exe`
`<source-location>/source-binary/AiMaM 1.0.9 win64.exe.i64`
sha256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b

---

## IDB (live, idb_save confirmed 2026-06-02)
`<source-location>/source-binary/AiMaM 1.0.9 win64.exe.i64`

IDA rename/comment audit trail embedded in IDB:
- load_relay_state_owner_sys @ 0x14027D660 (A-level, session 2026-06-02-relay-A-state-crud)
- get_relay_active_owner_sys @ 0x140280810 (A-level)
- get_relay_proxy_status_owner_sys @ 0x14027DBF0 (A-level)
- upsert_relay_provider_owner_sys @ 0x14026FB40 (A-level)
- delete_relay_provider_owner_sys @ 0x140274710 (A-level)
- set_relay_provider_network_owner_sys @ 0x1402813A0 (A-level)
- activate_relay_provider_owner_sys @ 0x14027B060 (A-level, session B-router-test-http)
- deactivate_relay_provider_owner_sys @ 0x140275030 (A-level)
- set_codex_router_enabled_owner_sys @ 0x140894BE0 (A-level)
- test_relay_provider_owner_sys @ 0x1408AF110 (A-level)
- test_relay_draft_owner_sys @ 0x140913E40 (A-level)
- fetch_relay_models_draft_owner_sys @ 0x1408E0870 (A-level)
- export_relay_config_owner_sys @ 0x14027A740 (A-level, session C-config-passthrough-diag-20260602)
- import_relay_config_owner_sys @ 0x140270420 (A-level)
- fix_codex_router_issue_owner_sys @ 0x140284970 (A-level)
- get_passthrough_audit_log_owner_sys @ 0x14026E440 (A-level)
- auto_switch_multiplex_dispatcher_sys @ 0x1402663E0 (inline: set_block_official_passthrough, run_codex_router_diagnostics)
- relay_manager_reset_codex_config_impl_sys @ 0x14014DF10 (IDA named symbol)

---

## Raw Leaf Evidence Bundles
`<source-location>/raw/aimami/1.0.9/windows/relay/`
├── load_relay_state/AI.md           (session A)
├── get_relay_active/AI.md           (session A)
├── get_relay_proxy_status/AI.md     (session A)
├── upsert_relay_provider/AI.md      (session A)
├── delete_relay_provider/AI.md      (session A)
├── set_relay_provider_network/AI.md (session A)
├── activate_relay_provider/evidence.md + manifest.json     (session B)
├── deactivate_relay_provider/evidence.md + manifest.json   (session B)
├── set_codex_router_enabled/evidence.md + manifest.json    (session B)
├── test_relay_provider/evidence.md + manifest.json         (session B)
├── test_relay_draft/evidence.md + manifest.json            (session B)
├── fetch_relay_models_draft/evidence.md + manifest.json    (session B)
├── export_relay_config/evidence.md + manifest.json         (session C)
├── import_relay_config/evidence.md + manifest.json         (session C)
├── set_block_official_passthrough/evidence.md + manifest.json (session C)
├── get_passthrough_audit_log/evidence.md + manifest.json   (session C)
├── run_codex_router_diagnostics/evidence.md + manifest.json (session C)
└── fix_codex_router_issue/evidence.md + manifest.json      (session C)

---

## source archive Implementation Reference
`src-tauri/src/commands/relay.rs`
`src-tauri/src/core/relay/mod.rs`
`src/lib/api.test.ts`
  → describe block: "api contract — Intelligent Routing (Relay)" (lines 628–763)

---

## Named Symbols in IDB (relay module)
relay_manager_reset_codex_config_impl_sys @ 0x14014DF10
relay_atomic_write_file_sys @ 0x140332540
relay_config_export_serialize_sanitize_sys @ 0x14043BE40
relay_config_export_json_write_sys @ 0x14042E840
relay_config_import_parse_sys @ 0x14043C2C0
passthrough_audit_log_read_sys @ 0x14043FC40
passthrough_audit_log_filter_sys @ 0x14042E190
run_codex_router_diagnostics_core_sys @ 0x140440130
fix_codex_router_issue_core_sys @ 0x14043E710
set_block_official_passthrough_write_sys @ 0x140440370
image_compat_build_response_ok_bool_sys @ 0x1404391D0
tauri_ipc_resolve_sys @ 0x140062230
auto_switch_multiplex_dispatcher_sys @ 0x1402663E0
codex_paths_build_from_env_sys @ 0x140476200
codex_paths_join_all_subpaths @ 0x140476350
quit_codex_wait_fallback_kill_sys @ 0x140254140
get_usage_refresh_interval_core_read @ 0x1402DCBC0
get_usage_refresh_interval_core_impl @ 0x14045F6C0

---

## field Strings (addr → value, confirmed by IDA find)
0x141268feb → "load_relay_state"
0x14126906f → "get_relay_active"
0x14126907f → "get_relay_proxy_status"
0x141268ffb → "upsert_relay_provider"
0x141269010 → "delete_relay_provider"
0x141269055 → "set_relay_provider_network"
0x141269025 → "activate_relay_provider"
0x14126903C → "deactivate_relay_provider"
0x14129C883 → "set_codex_router_enabled"
0x14129C939 → "test_relay_provider"
0x14129C98A → "test_relay_draft"
0x14129C99F → "fetch_relay_models_draft"
0x141269113 → "export_relay_config"
0x141269126 → "import_relay_config"
0x1412690dc → "set_block_official_passthrough"
0x1412690FA → "get_passthrough_audit_log"
0x1412690AA → "run_codex_router_diagnostics"
0x1412690C6 → "fix_codex_router_issue"
0x141269224 → "manager"
0x141269230 → "app"
0x14126923e → "input"
0x14126926f → "providerId"
0x1412692fa → "network"
0x1412692b5 → "blocked"
0x14127c2e2 → "RelayNetworkMode"
0x14127c328 → (enum variant table ptr for RelayNetworkMode errors)
0x14125d976 → "codexmate_lib::core::relay::manager"
0x14125d823 → "relay state poisoned"
0x14127B306 → "src\core\relay\passthrough_audit.rs"
0x141269F09 → "struct PassthroughAuditEntry with 7 elements"
0x14127D042 → "router_enabled"
0x14127C082 → "codexRouterEnabled"
0x14125DA28 → "[AiMaMi] rolling back codex_router_enabled to false"
0x14127ACEB → "write codex config.toml failed"
0x14125B684 → "x-api-field"
0x14125B68D → "anthropic-version"
0x14129CB5A → "/v1/messages"
0x14129CA20 → "usted/v1/models" (partial, = ...trusted/v1/models or base+/v1/models)
0x14127B2EB → "passthrough-audit.jsonl"
