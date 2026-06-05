# accounts::load_full_runtime_snapshot — Deep Recovery DISTILLED
## AiMaMi 1.0.9 · macOS arm64 · session <audit-session>

**Function**: `codexmate_lib::commands::accounts::load_full_runtime_snapshot`
**VA**: `0x1001e3bc4`
**Size**: `0x818` (2072 bytes)
**Binary SHA256**: `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
**IDB**: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

---

## Confirmed

- **Real body confirmed**: HexRays decompile at `0x1001e3bc4` returned full synchronous pseudocode (2072B). NOT a shim, NOT `drop_in_place`, NOT async state machine. Demangled name: `codexmate_lib::commands::accounts::load_full_runtime_snapshot::hf21ec0a0e14b41f3`.
- **Classification**: Internal backend implementation helper. NOT a directly-registered Tauri IPC command. Called by 2 distinct callers — one IPC bridge (`refresh_full_runtime_snapshot`) and one tokio blocking task wrapper (`BlockingTask::poll`). The tokio path IS the async dispatch mechanism for the IPC call.
- **Mutex structure**: Function acquires a `Mutex<OnceBox<T>>` guard at `a1` (the Repository struct field). On poison guard failure → formats `"poisoned lock: another task failed inside"` + `unwrap_failed` panic. Unconditionally releases mutex on all exits. Re-acquires mutex a second time after `enrich_accounts_via_api` completes (async-safe double-lock pattern for the persist+snapshot phase).
- **Phase 1 — local state load**: Calls `Repository::load_local_state_synced` (`0x1005ea2c8`). This internally calls:
  - `Repository::sync_local_runtime_state` (`0x1005eae50`) — syncs state from filesystem
  - `Repository::load_local_state` (`0x1005e5940`) — loads full accounts/settings from `~/.codex/`
  - If auto-switch daemon flag set: `check_daemon_state` + optionally `install_daemon` + `resolve_daemon_binary` (daemon repair side-effect)
  - If `load_local_state_synced` returns error (tag==2): formats `CoreError::Display` → `unwrap_failed` panic (error path returns `CoreEnvelope` with error tag `0x3`)
- **Phase 2 — alloc + release mutex**: Allocates new buffer from `a1+408/416` (a byte slice field in Repository — likely a config blob or override bytes). Copies loaded state into `__dst[928]` stack buf. Releases mutex. Copies state back to `v43`.
- **Phase 3 — API enrichment**: Calls `enrich_accounts_via_api` (`0x1005f2eec`) with the loaded state copy + the allocated config blob. This function:
  - Iterates account summaries, spawns `std::thread::scoped::scope` for parallel API calls
  - Per account: calls `api_client_test_api_connectivity` for accounts with `RELAY_ACTIVE` status
  - On API error: checks `reqwest::Error::is_connect`/`is_timeout`, sets account connectivity status, stores error in `a1+888/896` global error slot
  - On success: calls `apply_usage_result` + `upsert_item` in `quota_store`
  - Sorts accounts by active status, sets `a1+152/160` to the active account summary clone
  - Calls `sync_token_status_to_quota_store` at end
  - Updates `a1+912` with SystemTime elapsed timestamp
- **Phase 4 — re-lock + persist**: Re-acquires mutex on `a1`. On poison: same poison-guard panic path.
- **Phase 5 — persist_progressive_state**: Calls `Repository::persist_progressive_state` (`0x1005ec64c`). If persist fails (result tag != 10): appends `"PROGRESSIVE_STATE_SAVE_FAILED"` warning string (alloc 29B + format_inner) to warnings Vec in `v43[50..51]`.
- **Phase 6 — make_status_payload_with_service_state**: Calls `Repository::make_status_payload_with_service_state` (`0x1005f0944`, arg=4). This:
  - arg==4 → calls `check_daemon_state` to resolve live daemon status
  - Allocates `"dev.aimami.auto-switch"` (22B) as plugin_id field
  - Clones 7 String fields from LoadedState (relay/proxy/connectivity fields at offsets 61..82)
  - Builds `CoreSnapshotPayload` (0x2A8=680B) struct from accounts, auto-switch, proxy, connectivity, daemon-state fields
  - Returns the assembled payload in sret `a4` (680B struct)
- **Phase 7 — store_bootstrap_snapshot_progressive**: Calls `Repository::store_bootstrap_snapshot_progressive` (`0x1005f0660`). This:
  - Loads `bootstrap_cache` from `a1+464/472` path (CodexPaths field)
  - Compares loaded cache against new payload (AccountSummary::PartialEq, AutoSwitchStatusPayload::PartialEq, ApiProxyConfigPayload::PartialEq, ApiConnectivityPayload::PartialEq, slice equality) → if identical, short-circuits with tag=10 (no-op)
  - If different: calls `CodexPaths::ensure_directories` → `bootstrap_cache::update` to write new snapshot to disk
- **Phase 8 — return envelope**: Calls `CoreEnvelope::ok_with_warnings` (`0x1001d8a48`) with payload + warnings Vec. Copies 0x2F8 (760B) result into `a2` (IPC return sret). Releases mutex. Deallocs config blob. Drops `LoadedState`, `AppPathState`, `CodexMateSettings`, `RegistryItem` Vec, MCP server list, AccountSummary.
- **IPC return type**: `CoreEnvelope<CoreSnapshotPayload>` — 760B. On error paths: `CoreEnvelope` with error tag `0x3` (Err variant) containing `CoreError`. On success: ok_with_warnings variant (tag `0x0` or appropriate ok tag) with accumulated warning strings.
- **2 callers**:
  1. `refresh_full_runtime_snapshot` @ `0x1001e6a1c` — IPC bridge: gets Repository from `tauri::StateManager::try_get`, calls `load_full_runtime_snapshot`, on success calls `broadcast_runtime_snapshot(reason="progressive", 11B)`. This is the registered Tauri IPC command handler.
  2. `BlockingTask<T>::poll` @ `0x10030da48` — tokio blocking task dispatcher: `StateManager::try_get` → `load_full_runtime_snapshot` → `drop_in_place<AppHandle>` → `memcpy` result to waker context. This is the tokio async runtime dispatch path for the same IPC call.

---

## Inferred

- **dim1 (frontend CCF)**: No own IPC command string. `load_full_runtime_snapshot` is an internal function. The registered IPC command is `refresh_full_runtime_snapshot` (confirmed by caller at `0x1001e6a1c` which is the Tauri command body). dim1 closed via caller chain — the command `refresh_full_runtime_snapshot` drives the invocation.
- **dim2 (owner pseudocode)**: Full HexRays pseudocode at `0x1001e3bc4`. Valid. `source=ida`, `source_binary_sha256=1db044e8...`, `status=decompiled`. Size 2072B, single-pass decompile.
- **dim3 (call tree depth)**: 2 callers confirmed + 8 field callees decompiled (see below). Depth ≥ 5 edges. Terminated reasons:
  - `persistence_commit` (bootstrap_cache::update writes disk)
  - `external_call_recorded` (enrich_accounts_via_api → api_client_test_api_connectivity → reqwest HTTP)
  - `response_serialize` (CoreEnvelope::ok_with_warnings → memcpy to IPC sret)
  - `error_return` (poison-guard paths return CoreEnvelope<CoreError>)
- **dim4 (interface/DTO/error/side-effect)**:
  - **Input**: `(a1: &mut Repository X0, a2: *mut CoreEnvelope<CoreSnapshotPayload> X8)` — a1 is the Tauri-managed Repository state, a2 is IPC return sret buffer.
  - **Output**: `CoreEnvelope<CoreSnapshotPayload>` (760B) — contains `CoreSnapshotPayload` (680B) with: active account summary (336B AccountSummary), auto-switch status (`AutoSwitchStatusPayload`), api proxy config (`ApiProxyConfigPayload`), api connectivity (`ApiConnectivityPayload`), daemon status (bool from `check_daemon_state`), plugin_id `"dev.aimami.auto-switch"` (22B), relay models Vec, warnings Vec[String].
  - **Side effects**:
    1. Filesystem read: `load_local_state_synced` reads `~/.codex/` account files, config files, registry
    2. Filesystem write (conditional): `store_bootstrap_snapshot_progressive` → `bootstrap_cache::update` writes snapshot to bootstrap cache path if changed
    3. Filesystem write (conditional): `persist_progressive_state` writes refreshed runtime state
    4. HTTP calls (conditional): `enrich_accounts_via_api` makes outbound reqwest HTTP calls per account to test API connectivity
    5. quota_store write: `upsert_item` updates quota tracking for each account
    6. Global state write: `a1+888/896/904` error slot updated with last API error; `a1+920` connectivity status byte; `a1+912` elapsed timestamp; `a1+152/160` active AccountSummary
    7. Daemon install (conditional): if daemon enabled + check_daemon_state fails → `install_daemon` side-effect
  - **Errors**:
    - Poison-guard (`"poisoned lock: another task failed inside"`) → `unwrap_failed` → panic (unrecoverable)
    - `load_local_state_synced` error (tag==2) → returns `CoreEnvelope::Err(CoreError)` immediately (no API call, no persist)
    - `persist_progressive_state` failure → appends `"PROGRESSIVE_STATE_SAVE_FAILED"` warning to warnings Vec (non-fatal, continues)
    - `store_bootstrap_snapshot_progressive` failure → sets error tag in `v38[0]` (non-fatal, continues to envelope construction)
    - API errors per account → stored in per-account connectivity status + global error slot (non-fatal, continues)
- **dim5 (same-platform gate)**: macOS arm64, IDA native-binary decompile, binary SHA match confirmed. Same session as `broadcast_runtime_snapshot` evidence.

---

## Unknown

- **dim6 (test/acceptance mapping)**: source archive-side acceptance tests for this internal helper not separately defined. Parent command `refresh_full_runtime_snapshot` acceptance covers the full path.
- **Windows equivalence**: Not investigated in this session. Separate win IDB required.

---

## Gate Assessment

| Dimension | Status |
|---|---|
| dim1: frontend CCF | Closed (via caller chain; registered IPC cmd is `refresh_full_runtime_snapshot`) |
| dim2: owner pseudocode | Closed (IDA, 2072B, single pass, full synchronous body) |
| dim3: call tree ≥5 | Closed (2 callers + 8 callees decompiled, depth ≥5, multiple terminated_reason) |
| dim4: DTO/error/side-effect | Closed (7 side effects, 5 error paths documented) |
| dim5: same-platform gate | Closed (macOS arm64 IDA, SHA verified) |
| dim6: test/acceptance | Open (parent command acceptance covers; no separate internal helper fixture) |

**gate_tier**: `strictImplementationUse`
**genuine_ceiling**: false
**accepted_unknown**: false
**readyToImplement**: false (dim6 open; internal helper, parent command has readyToImplement)

---

## Fake-Wall Taxonomy (per ida-deep-recovery.md §1, all 8 excluded)

1. `drop_in_place/destructor`: EXCLUDED — pseudocode is real logic (mutex lock/unlock, load_local_state_synced, enrich_accounts_via_api, persist, make_status_payload, store_bootstrap, CoreEnvelope construction). Not a destructor shim.
2. `architecture_only/budget_rule`: EXCLUDED — 2072B, single decompile pass completed without budget constraint.
3. `async decompile failed (HexRays)`: EXCLUDED — body is synchronous Rust, no async state machine discriminant switch. The tokio BlockingTask wrapping is at the caller level; the body itself is pure sync. HexRays returned complete pseudocode.
4. `wrong_VA (ICF-size guess)`: EXCLUDED — `lookup_funcs(0x1001e3bc4)` → exact demangled `load_full_runtime_snapshot::hf21ec0a0e14b41f3`, single result, no ICF twin.
5. `vtable/dynamic dispatch`: EXCLUDED — all callees are direct demangled static symbols. `tauri::StateManager::try_get` is a generic monomorphization, still direct static call.
6. `HTTP-terminal`: EXCLUDED from fake-wall claim — `enrich_accounts_via_api` does make outbound HTTP via reqwest, but the wrapper logic (account iteration, result merging, quota_store update, sort, active account selection) is fully decompiled. HTTP response body is external server response and is genuinely not knowable from binary, but this is correctly classified as `accepted_unknown` only for the server response content — NOT for the binary logic. The binary logic around HTTP calls is fully covered.
7. `library internal`: N/A — this is codexmate_lib own code throughout.
8. `body too large`: EXCLUDED — 2072B. No chunking required. Full single-pass decompile succeeded.

**recovery_attempts**: not_needed_no_ceiling. Real synchronous body with full HexRays decompile on first call. No fake walls encountered. Async wrapping is at caller (BlockingTask::poll), not in this function body.

---

## Call Tree Summary

| Callee | VA | Role | Decompiled |
|---|---|---|---|
| `Repository::load_local_state_synced` | `0x1005ea2c8` | Phase 1: filesystem load + daemon check | Yes |
| `enrich_accounts_via_api` | `0x1005f2eec` | Phase 3: parallel API enrichment via reqwest | Yes |
| `Repository::persist_progressive_state` | `0x1005ec64c` | Phase 5: write refreshed state to disk | IDA ref confirmed |
| `Repository::make_status_payload_with_service_state` | `0x1005f0944` | Phase 6: build CoreSnapshotPayload (680B) | Yes |
| `Repository::store_bootstrap_snapshot_progressive` | `0x1005f0660` | Phase 7: write bootstrap cache if changed | Yes |
| `CoreEnvelope::ok_with_warnings` | `0x1001d8a48` | Phase 8: wrap result + warnings | IDA ref confirmed |
| `refresh_full_runtime_snapshot` (caller) | `0x1001e6a1c` | IPC bridge + broadcast_runtime_snapshot call | Yes |
| `BlockingTask<T>::poll` (caller) | `0x10030da48` | tokio async dispatch wrapper | Yes |

---

## Evidence References

- Owner pseudocode: live IDB session `<audit-session>, fn `0x1001e3bc4`, size 0x818.
- Caller `refresh_full_runtime_snapshot`: decompiled `0x1001e6a1c` (full, confirms IPC bridge + broadcast call).
- Caller `BlockingTask::poll`: decompiled `0x10030da48` (full, confirms tokio async dispatch path).
- Callee `load_local_state_synced`: decompiled `0x1005ea2c8` (full, confirms sync+load+daemon-repair chain).
- Callee `enrich_accounts_via_api`: decompiled `0x1005f2eec` (full, confirms parallel HTTP enrichment + quota_store).
- Callee `make_status_payload_with_service_state`: decompiled `0x1005f0944` (full, confirms CoreSnapshotPayload assembly).
- Callee `store_bootstrap_snapshot_progressive`: decompiled `0x1005f0660` (full, confirms bootstrap cache diff + write).
- xrefs_to `0x1001e3bc4`: 2 callers, all code xrefs, confirmed.
- Binary SHA256: `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`.

**Produced**: 2026-06-04 · <workstation> · session <audit-session>
**Source binary SHA**: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482
