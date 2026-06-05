# apply_codex_state — Windows x64 Raw Evidence

**product**: aimami  **version**: 1.0.9  **platform**: windows-x64
**binary SHA**: a5822387fa3f  **session**: win-relay_codex_writer-20260602

## Confirmed

- **IPC entry owner**: `apply_codex_state_ipc_handler_sys` @ `0x140277E50` (3372 bytes)
  - Dispatched from `auto_switch_multiplex_dispatcher_sys` @ `0x1402663E0` via call at `0x140269058`
  - Contains relay command string table (multi-command handler on Windows)
- **Core impl owner**: `apply_codex_state_impl_sys` @ `0x140160FB0` (2949 bytes)
  - Called from IPC entry
  - Begins with `_InterlockedCompareExchange8` Mutex lock on `Address[0]`
  - Checks `off_141882E30` OnceLock (watcher init guard)
  - Reads `Address[1]` (`v13`) as poison flag — if set, returns poisoned lock error via `sub_14106D750`
- **Provider kind dispatch**: reads `v80[2]` (length) + `v80[1]` (ptr) to classify provider type
  - len=3 + `"sse"` → v25=2
  - len=4 + `"http"` (0x70747468 = `http`) → v25=1
  - len=5 + `"stdio"` (0x6F647473 + `o`) → v25=0
  - else → v25=3 (unknown/error)
- **Core write path**: calls `managed_block_migration_core_sys` @ `0x1401D6FE0` then `toml_block_renderer_core_sys` @ `0x1401D37B0`
- **Error path**: on migration failure, calls `sub_140464400` (Result::unwrap error path) and sets Dst discriminant=0x8000000000000000 (Err)
- **Success path**: calls `sub_140438D60` (Result::Ok builder), `memcpy` into Dst, returns Ok
- **Mutex unlock**: `WakeByAddressSingle` on `Addressa` (original address ptr), `*v40 = 0`
- **Input DTO fields** (from `Address` struct at offsets):
  - `+80` (offset 10*8): `config_path` ptr  
  - `+88` (offset 11*8): `config_content` or `watcher_state` ptr
  - `+40..+48`: provider_kind string slice (ptr+len from `v80`)
  - `+0..+8`: source_slice ptr for migration content (from `v85`)
- **Call tree edges**: 16 direct callees confirmed (see callees output); depth ≥ 5 via managed_block_migration chain

## Inferred

- `apply_codex_state` on Windows is not an independent Tauri IPC command string — embedded in multi-command relay handler
- The `Address[1]` poison byte matches Rust `Mutex` poisoned state pattern
- `sub_141050240` = `Result<T,E>::is_err()` check pattern
- `sub_14017DEC0` / `sub_14017F880` = Vec/String drop helpers

## Unknown

- Exact struct layout of input type at `Address` base — field names inferred from string xrefs and call patterns, not verified from type info
- Whether `sub_140438D60` is the canonical Ok-builder or a more generic Result constructor
- Full OnceLock watcher state type behind `off_141882E30`
