# relay_diagnostic / fix_codex_router_issue_owner_sys — raw leaf evidence

product: aimami
version: 1.0.9
platform: windows-x64
binary_sha256: a5822387fa3f56dc (12-char prefix)
idb: <local-path> 1.0.9 win64.exe.i64
session: win-diag-20260602
produced: 2026-06-02

## Confirmed

- VA: 0x140284970, size 0x4c1 (1217 bytes)
- Name: fix_codex_router_issue_owner_sys (A-level IPC owner)
- IPC command string: "fix_codex_router_issue" at 0x1412690c6
- Dispatcher xref from 0x1402663E0 (auto_switch_multiplex_dispatcher_sys)
- Extracts field "manager" (len=7) from IPC params at offset struct+16
- Extracts field "itemId" (len=6) as Option<String> from IPC params
- Calls get_usage_refresh_interval_core_impl(0x14045F6C0) to get RelayManager handle
- Calls fix_codex_router_issue_core_sys(0x14043E710) with (manager_handle, itemId_bytes, itemId_len)
- Calls tauri_ipc_resolve_sys(0x140062230) for both success and error paths
- Error path: calls sub_1411CE640 (IPC error serializer) on get_manager failure → early return
- Returns Result<Vec<String>, Error> (IPC envelope)
- Cleans up manager Arc (sub_1400CA020 × count)

## itemId dispatch (confirmed from fix_codex_router_issue_core_sys decompile)

itemId == "all" (len=3, bytes 0x61 0x6C 0x6C) → relay_fix_all_repair_core_sys(0x1403C9DE0)
itemId != "all" → relay_fix_config_strip_sys(0x1403CDA60) with raw itemId bytes

itemId values handled (from relay_fix_all_repair_core_sys switch + relay_fix_config_strip_sys switch):
- "config_stale"        (len=12, case 0xC)
- "auth_integrity"      (len=14, case 0xE)
- "config_third_party"  (len=18, case 0x12) — two variants with same len, SIMD compare
- "config_toml_syntax"  (len=18, case 0x12)
- "db_orphan_providers" (len=19, case 0x13)
- "catalog_path_validity" (len=21, case 0x15)
- "config_profile_conflict" (len=23, case 0x17)
- "all"                 (len=3) — top-level dispatch, runs full repair

## mac/win consolidation resolved

Mac had 7 separate IPC commands. Win has single "fix_codex_router_issue" + itemId param.
"diagnose_codex_router" is an additional lightweight command on win (health probe path).

## Inferred

- "manager" field corresponds to RelayManager state handle (Arc<Mutex<RelayManager>>)
- itemId is a Tauri command argument passed as String
- The fix_codex_router_issue_core_sys calls quit_codex_wait_fallback_kill_sys(8s timeout) before writing config changes when Codex is running

## Unknown

- Exact Rust type of itemId on IPC boundary (String vs enum re-serialized as string)
- Whether itemId validation / unknown-itemId error path exists before core dispatch
