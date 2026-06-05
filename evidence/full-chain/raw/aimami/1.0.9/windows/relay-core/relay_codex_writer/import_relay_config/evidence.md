# import_relay_config_owner_sys — Windows x64 Raw Evidence

**product**: aimami  **version**: 1.0.9  **platform**: windows-x64
**binary SHA**: a5822387fa3f  **session**: win-relay_codex_writer-20260602
**IPC command string**: `"import_relay_config"` (19 bytes, confirmed @ `0x141269126`)

## Confirmed

- **Owner**: `import_relay_config_owner_sys` @ `0x140270420` (1550 bytes, IDA-named)
- **IPC args extracted**:
  - `"app"` (3 bytes) — app handle
  - `"manager"` (7 bytes) — relay manager lock
  - `"filePath"` (8 bytes) — input file path
- **Relay state read** (non-manager path): `get_usage_refresh_interval_core_read @ 0x1402DCBC0` (misnamed, actual = relay state reader) — if `Srca[0]==3` (read error discriminant), returns early error via `tauri_ipc_resolve_sys`
- **Manager lock**: `sub_1400DA320(Dst[64]+16)` — acquires MutexGuard; on failure returns early error
- **File path extraction**: `get_usage_refresh_interval_core_impl` extracts `"filePath"` string arg
- **Parse**: `relay_config_import_parse_sys @ 0x14043C2C0` — parses import file (JSON/TOML); writes parsed data into `v32[0..152]` buffer
- **Apply**: `sub_14006AA80(Srca)` — applies imported state (corresponds to `apply_import_to_state`; writes to manager state)
- **IPC resolve**: `tauri_ipc_resolve_sys @ 0x140062230` on all paths (success and error)
- **Cleanup**: `sub_1400550D0(v32)` — drops parsed state on error paths; provider Vec drop loop (96-byte stride)
- **Call tree edges**: 15 direct callees, depth ≥ 5 via parse+apply chain

## Inferred

- `sub_14006AA80` = `apply_import_to_state` — updates relay manager from parsed import
- `relay_config_import_parse_sys` reads file at path and deserializes `RelayExportFile` format
- Error discriminant 3 on relay state read = `Err(RelayStateError::NotFound)` or similar

## Unknown

- Whether `apply_import_to_state` / `sub_14006AA80` triggers a managed block migration or only updates in-memory state
- Exact validation performed in `relay_config_import_parse_sys` (schema validation vs. raw parse)
- Whether import overwrites all providers or merges
