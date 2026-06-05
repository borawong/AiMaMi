# Evidence Paths — macos-1.0.9-relay-core

所有路径使用环境变量相对路径。`<source-location>` = source archive 共享根。

## relay_codex_writer

- **intermediate (实际证据)**: `<source-location>/intermediate/aimami/1.0.9/macos/relay-core/relay_codex_writer/`
  - `evidence.md` — 24 function evidence (fully documented)
  - `ida/pseudocode-manifest.jsonl` — 24 entries, all status=decompiled, sha=1db044e8efab
  - `ida/` — pseudocode files
  - `interfaces/` — interface map
  - Sub-leaf dirs: apply_codex_state/, io/, catalog/, etc.
- **raw (空框架，不含实际证据)**: `<source-location>/raw/aimami/1.0.9/macos/relay-core/relay_codex_writer/`
  - 注: 此处为空目录框架，canonical 问题待修正

## relay_diagnostic

- **raw**: `<source-location>/raw/aimami/1.0.9/macos/relay-core/relay_diagnostic/`
  - `manifest.json` — cluster manifest, gate_status=consumerStartReady
  - `implementation-targets.txt`
  - `interfaces/closed-source-interface-map.md` — DiagnosticsItem, FixResult DTOs
  - `interfaces/closed-source-interfaces.json`
  - `call-trees/fix_codex_router_issue.jsonl`
  - `call-trees/run_codex_router_diagnostics.jsonl`
  - Sub-leaf `<sub>/evidence.md` for 10 sub-leaves

## relay_health_audit

- **raw**: `<source-location>/raw/aimami/1.0.9/macos/relay-core/relay_health_audit/`
  - `AI.md` — cluster AI handoff with full gate summary
  - `health_check/` — 6 functions, ida/pseudocode-manifest.jsonl (6 entries)
  - `health_check/call-trees/test_relay_provider.jsonl`
  - `passthrough_audit/` — 4 functions, ida/pseudocode-manifest.jsonl (4 entries)
  - `passthrough_audit/call-trees/` (2 jsonl)

## relay_manager

- **raw**: `<source-location>/raw/aimami/1.0.9/macos/relay-core/relay_manager/`
  - 17 sub-leaf dirs, each with `ida/pseudocode-manifest.jsonl` + `ida/pseudocode/`
  - Sub-leaves: new/, persist/, storage_load/, storage_hydrate_secrets/, activate/, deactivate/, bootstrap/, compose_proxy_status/, delete/, ensure_proxy_started/, keychain_get_api_key/, rollback_router_enabled/, set_codex_router_enabled/, snapshot/, sync_codex_config_with_outcome/, upsert/, (+ additional)

## relay_proxy_server

- **raw (evidence.md per sub-leaf)**: `<source-location>/raw/aimami/1.0.9/macos/relay-core/relay_proxy_server/`
  - Sub-leaf `<sub>/evidence.md` for 9 sub-leaves
  - `handle_codex_active_ws/call-tree.jsonl`
  - `handle_codex_router_ws/call-tree.jsonl`
- **intermediate (IDA pseudocode)**: `<source-location>/intermediate/aimami/1.0.9/macos/relay-core/relay_proxy_server/`
  - `ida/pseudocode-manifest.jsonl` — 16 entries, all status=decompiled
  - `ida/` — pseudocode files
  - `interfaces/`

## relay_thread_migration

- **raw**: `<source-location>/raw/aimami/1.0.9/macos/relay-core/relay_thread_migration/`
  - `manifest.json` — cluster manifest with 7 function VAs, SQL operations, struct names
  - `VERSION-BASELINE.md`
  - Sub-leaf `<sub>/evidence.md` + `<sub>/call-tree.jsonl` for 7 sub-leaves

## relay_translator

- **raw (evidence.md per sub-leaf)**: `<source-location>/raw/aimami/1.0.9/macos/relay-core/relay_translator/`
  - Sub-leaf `<sub>/evidence.md` for 14 sub-leaves
- **intermediate (IDA pseudocode)**: `<source-location>/intermediate/aimami/1.0.9/macos/relay-core/relay_translator/`
  - `ida/pseudocode-manifest.jsonl` — 14 entries, all status=decompiled
  - `interfaces/`

## Binary SOT

- `<source-location>/source-binary/AiMaMi 1.0.9.app/` (macOS universal)
  - Binary SHA-256: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482
  - IDB: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
