# Evidence Paths — macos-1.0.9-relay

All paths relative to `<source-location>` = `<source-location>`

## Binary SOT
`<source-location>/source-binary/AiMaMi 1.0.9.app` — thin binary SHA: 985dae00be620b21164b4a8d35cc0379b750d5a6257b25897b0e813441e4d706

## IDB SOT
`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64` — IDB SHA: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482

## Raw Leaf Evidence (evidence.md only — dims2-5 from IDA decompile)
- `raw/aimami/1.0.9/macos/relay/load_relay_state/evidence.md`
- `raw/aimami/1.0.9/macos/relay/get_relay_active/evidence.md`
- `raw/aimami/1.0.9/macos/relay/get_relay_proxy_status/evidence.md`
- `raw/aimami/1.0.9/macos/relay/upsert_relay_provider/evidence.md`
- `raw/aimami/1.0.9/macos/relay/delete_relay_provider/evidence.md`
- `raw/aimami/1.0.9/macos/relay/set_relay_provider_network/evidence.md`

## Raw Leaf Evidence (manifest.json + pseudocode .c + call-tree .jsonl)
- `raw/aimami/1.0.9/macos/relay/activate_relay_provider/` — manifest.json, ida/pseudocode/0001_*.c, call-trees/*.jsonl
- `raw/aimami/1.0.9/macos/relay/deactivate_relay_provider/` — same structure
- `raw/aimami/1.0.9/macos/relay/set_codex_router_enabled/` — same structure
- `raw/aimami/1.0.9/macos/relay/test_relay_provider/` — 3x pseudocode .c files
- `raw/aimami/1.0.9/macos/relay/test_relay_draft/` — same structure
- `raw/aimami/1.0.9/macos/relay/fetch_relay_models_draft/` — same structure

## Raw Leaf Evidence (AI.md only)
- `raw/aimami/1.0.9/macos/relay/export_relay_config/AI.md`
- `raw/aimami/1.0.9/macos/relay/import_relay_config/AI.md`
- `raw/aimami/1.0.9/macos/relay/set_block_official_passthrough/AI.md`
- `raw/aimami/1.0.9/macos/relay/get_passthrough_audit_log/AI.md`
- `raw/aimami/1.0.9/macos/relay/run_codex_router_diagnostics/AI.md`
- `raw/aimami/1.0.9/macos/relay/fix_codex_router_issue/AI.md`

## source archive Implementation Reference (not raw evidence — for mapping only)
- source archive repo: `src-tauri/src/commands/relay.rs` — 18 #[tauri::command] handlers
- source archive repo: `src-tauri/src/core/relay/` — mod.rs, proxy.rs, config_inject.rs, diagnostics.rs, keychain.rs, migration.rs
- source archive repo: `src/components/relay/relay-page.test.tsx` — frontend Vitest tests
