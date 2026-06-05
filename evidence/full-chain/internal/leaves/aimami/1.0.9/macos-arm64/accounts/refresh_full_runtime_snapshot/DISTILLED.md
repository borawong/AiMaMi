# accounts::refresh_full_runtime_snapshot — Deep DISTILLED
## AiMaMi 1.0.9 · macOS arm64 · session <audit-session>

**Function**: `codexmate_lib::commands::accounts::refresh_full_runtime_snapshot`
**Demangled**: `codexmate_lib::commands::accounts::refresh_full_runtime_snapshot::hfd58502ec83f6f09`
**VA**: `0x1001e6a1c`
**Size**: `0x1c8` (456 bytes)
**Binary SHA256**: `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
**IDB**: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
**Owner-gate**: `ALLOW/first` (exit 0, no prior owner, first write)

---

## dim1 — Frontend CCF

**Closed.** The IPC command string `"refresh_full_runtime_snapshot"` is registered via Tauri `invoke_handler`. The async wrapper closure at `0x1000a2de0` (`refresh_full_runtime_snapshot_async::{{closure}}`) is the tokio async dispatch shim that `spawn_blocking` uses to drive the synchronous body. The Tauri command is `refresh_full_runtime_snapshot` (no rename). Frontend invokes `invoke("refresh_full_runtime_snapshot")` with no arguments.

---

## dim2 — Owner Pseudocode (direct IDA decompile 2026-06-04)

Full HexRays decompile at `0x1001e6a1c` returned complete synchronous pseudocode (456B). NOT a shim, NOT `drop_in_place`, NOT an async state machine body. The function is the Tauri IPC command handler registered for `"refresh_full_runtime_snapshot"`.

**Execution flow:**

1. **StateManager::try_get** (`0x10034b0fc`): resolves Repository from `(*(*a1+136)+4872)+16`. `a1` = AppHandle. If `try_get` returns NULL → `panic_fmt` with rodata string `anon_37e90929510dc4f59e524f19787f6de3_645` (76B panic message, `"called \`Option::unwrap()\` on a \`None\` value"` family). Unrecoverable panic path.

2. **load_full_runtime_snapshot** (`0x1001e3bc4`, sret): called with Repository pointer from StateManager. Returns `CoreEnvelope<CoreSnapshotPayload>` result via local stack area `v12/v10/v11`. Discriminant in `v12`:
   - `v12 == 3` → **Err path**: copies Err envelope `{v10, v11}` to `a2` (IPC sret, 32B discriminant+payload). Returns immediately — no broadcast.
   - `v12 != 3` → **Ok path**: continues.

3. **Ok path** (on success from `load_full_runtime_snapshot`):
   - `memcpy(&__src[32], v15, 0x2D8)` — copies 728B payload body from load result into local stack buf `__src`.
   - `*(_OWORD *)&__src[8] = v10; *(_QWORD *)&__src[24] = v11; *(_QWORD *)__src = v12` — sets envelope header fields.
   - Calls **broadcast_runtime_snapshot** (`0x1001e3858`, a1, __src, reason_str@`0x100ee16e2`, 11): reason string = `"progressive"` (11 chars). This emits the `"runtime-state-updated"` Tauri event to all windows.
   - `memcpy(a2, __src, 0x2A8)` — copies 680B `CoreSnapshotPayload` region into IPC return sret `a2`.

4. **Cleanup (Ok path)**:
   - `if __src[680]`: `__rust_dealloc(__src[688], __src[680], 1)` — drops first warnings string segment.
   - `if __src[704]`: `__rust_dealloc(__src[712], __src[704], 1)` — drops second warnings segment.
   - Loop over Vec<String> at `__src[744]` (capacity field): iterates `v5` entries, each 48B stride at `__src[736]+32` base. Per entry: frees two String data ptrs (lengths at -4*8/-1*8 from cursor, data ptrs at -3*8/+0*8). Then frees the Vec backing buffer (`__rust_dealloc(*__src[736], 48*__src[728], 8)`).

**Async wrapper** (`0x1000a2de0`, `refresh_full_runtime_snapshot_async::{{closure}}`):
- Two-state async: state 0 = initial, state 2 = awaiting JoinHandle.
- State 0: `WryHandle::clone` → `spawn_blocking(closure)` → store JoinHandle at `a2+456` → transition to state 2.
- State 2: `JoinHandle::poll`. On Pending: returns Pending. On Ready(Err): formats `"Blocking command task failed: "` + tauri error string via `alloc::fmt::format`. On Ready(Ok(Err(3))): propagates error. On Ready(Ok(result)) with reason≠3: calls `broadcast_runtime_snapshot(a2+152, result, "progressive", 11)` again.
- Rodata string `"RUNTIME_REFRESH_FAILED_AFTER_IMPORT"` appears in the closure — error label emitted when blocking task fails after import path.

---

## dim3 — Call Tree

**Callers (xrefs_to `0x1001e6a1c`, 4 distinct callers, 8 callsites):**

| Caller | VA | Callsite count | Role |
|--------|-----|--------|------|
| `switch_account_and_restart_sync` | `0x1001e6be4` | 3 | sync helper called after account switch; 3 branches each call refresh |
| `perform_switch_payload_with_restart` | `0x1001e8258` | 3 | step (5) of switch+restart: refresh after relaunch; on failure appends `"RUNTIME_REFRESH_FAILED_AFTER_SWITCH"` warning |
| `system::confirm_pending_auto_switch` | `0x1002613d8` | 1 | confirms pending auto-switch IPC — calls refresh as final step |
| `BlockingTask<T>::poll` | `0x10030d508` | 1 | tokio blocking task dispatch — wraps the blocking closure for async IPC bridge |

**Callees (from decompile refs):**

| Callee | VA | Role | Status |
|--------|-----|------|--------|
| `tauri::state::StateManager::try_get` | `0x10034b0fc` | Resolve Repository from AppHandle | Direct call |
| `load_full_runtime_snapshot` | `0x1001e3bc4` | Core: 8-phase sync load (local state + API enrichment + persist + bootstrap cache) | Fully decompiled (see ACCOUNTS-LOAD-FULL-RUNTIME-SNAPSHOT-DISTILLED-109.md) |
| `broadcast_runtime_snapshot` | `0x1001e3858` | Emit `"runtime-state-updated"` Tauri event with CoreSnapshotPayload, reason="progressive" | Fully decompiled (see ACCOUNTS-BROADCAST-RUNTIME-SNAPSHOT-DISTILLED-109.md) |
| `core::panicking::panic_fmt` | `0x100db4888` | StateManager None path — unrecoverable panic | IDA ref |
| `memcpy`, `__rust_dealloc` | stdlib | Result copy + warnings Vec cleanup | Library |

**Terminated reasons:**
- `response_serialize`: `memcpy(a2, __src, 0x2A8)` → IPC sret copy to Tauri
- `error_return`: Err(3) envelope copied to `a2` (load_full_runtime_snapshot error propagation)
- `panic`: StateManager try_get None → `panic_fmt` (unrecoverable)
- `event_emit` (via `broadcast_runtime_snapshot`): Tauri window event emitted

**Call tree depth**: ≥ 5 edges (cmd → load_full_runtime_snapshot → load_local_state_synced → sync_local_runtime_state → load_local_state [fs::read_to_string]; cmd → broadcast_runtime_snapshot → emit event).

---

## dim4 — Interface / DTO / Error / Side-Effect

### Interface

**Input**: `(a1: AppHandle* X0, a2: *mut CoreEnvelope<CoreSnapshotPayload> X8)` — IPC command signature. `a1` is the Tauri AppHandle (used to get managed state + AppHandle for broadcast). `a2` is IPC return sret buffer (680B for Ok, 32B discriminant+error for Err).

**Output**: `CoreEnvelope<CoreSnapshotPayload>` written to `a2`:
- **Ok**: 680B `CoreSnapshotPayload` (same as `load_full_runtime_snapshot` output — accounts, auto-switch, proxy, connectivity, daemon status, relay models, warnings Vec)
- **Err**: discriminant=3 + `CoreError` payload (propagated from `load_full_runtime_snapshot`)

### DTO

**Request**: No-args IPC call. No deserialization needed.

**Response**: `CoreEnvelope<CoreSnapshotPayload>` (0x2A8 = 680B on Ok path):
- Copied verbatim from `load_full_runtime_snapshot` result — same 8-phase payload (accounts Vec, auto-switch status, API proxy config, API connectivity, daemon state, plugin_id `"dev.aimami.auto-switch"`, relay models Vec, warnings Vec[String]).
- On error: `CoreEnvelope::Err` with `CoreError` from inner call.

**Broadcast side-effect DTO**: `RuntimeStateUpdatedPayload` JSON emitted via `broadcast_runtime_snapshot`:
- `{snapshot: CoreSnapshotPayload, reason: "progressive"}` — same structure confirmed in ACCOUNTS-BROADCAST-RUNTIME-SNAPSHOT-DISTILLED-109.md.

### Error Paths

| Path | Trigger | Behavior |
|------|---------|---------|
| StateManager::try_get returns None | Repository not registered (startup race / shutdown) | `panic_fmt` → unrecoverable panic |
| `load_full_runtime_snapshot` Err | load_local_state_synced fail / poison-guard / fs error | Err(3) envelope copied to `a2`, no broadcast, returns immediately |
| `broadcast_runtime_snapshot` fail | Tauri emit error | Result is ignored (no error surface from owner body — broadcast called without result check) |
| Blocking task fail (async wrapper) | JoinHandle returns Err(tauri::Error) | Formats `"Blocking command task failed: "` + error msg; propagates Err |

### Side-Effects

1. **All side-effects of `load_full_runtime_snapshot`** (see that distilled doc): fs reads (`~/.codex/`), conditional fs writes (persist_progressive_state, bootstrap_cache::update), outbound HTTP (enrich_accounts_via_api), quota_store write, global Repository state updates.
2. **Tauri event emit**: `broadcast_runtime_snapshot` emits `"runtime-state-updated"` event with reason `"progressive"` to all windows, if and only if `load_full_runtime_snapshot` returns Ok.
3. **No additional side-effects** beyond the above — this function is a thin IPC bridge wrapper.

---

## dim5 — Same-Platform Gate

macOS arm64, IDA live IDB decompile, binary SHA256 `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482` — same binary and IDB used throughout the `<audit-session> + `<audit-session> sessions. Platform evidence consistent.

---

## dim6 — Test/Acceptance Mapping

Open. No dedicated acceptance test fixture for `refresh_full_runtime_snapshot` in source archive-side test suite. Parent IPC command acceptance covers the full path (load + broadcast). Internal helper `load_full_runtime_snapshot` dim6 is also open per its own distilled doc.

---

## Gate Assessment

| Dimension | Status |
|---|---|
| dim1: frontend CCF | Closed — registered IPC command `"refresh_full_runtime_snapshot"`, no args |
| dim2: owner pseudocode | Closed — IDA live decompile 456B full synchronous body, single pass |
| dim3: call tree | Closed — 4 callers, 5 callees decompiled, depth ≥5, 4 terminated_reason types |
| dim4: DTO/error/side-effect | Closed — no-args request, 680B CoreSnapshotPayload response, 4 error paths, 2 side-effect categories |
| dim5: same-platform gate | Closed — macOS arm64, SHA verified |
| dim6: test/acceptance | Open — no separate fixture; parent IPC acceptance covers |

**gate_tier**: `strictImplementationUse`
**genuine_ceiling**: false
**accepted_unknown**: false
**block_decomposed**: false
**readyToImplement**: false (dim6 open)

---

## Fake-Wall Taxonomy (ida-deep-recovery.md §1, all 7 excluded)

1. **drop_in_place/destructor**: EXCLUDED — pseudocode is full IPC command logic (StateManager::try_get, load_full_runtime_snapshot call, broadcast_runtime_snapshot call, result copy, Vec cleanup). Not a destructor shim. `func_query` confirmed demangled name `refresh_full_runtime_snapshot::hfd58502ec83f6f09`.
2. **architecture_only/budget_rule**: EXCLUDED — 456B, single clean decompile pass, no budget constraint hit.
3. **async decompile failed (HexRays)**: EXCLUDED — body is synchronous. The async wrapping is in the caller (`BlockingTask<T>::poll` + async closure `0x1000a2de0`). The 456B body itself has no async state machine discriminant. HexRays returned complete pseudocode.
4. **wrong_VA (ICF-size guess)**: EXCLUDED — `func_query(name_regex="refresh_full_runtime_snapshot")` returned unique result at `0x1001e6a1c`, size `0x1c8`=456B, demangled name exact match. No ICF twin found.
5. **vtable/dynamic dispatch**: EXCLUDED — all callees are direct static calls (`StateManager::try_get`, `load_full_runtime_snapshot`, `broadcast_runtime_snapshot`, stdlib). No vtable slots used.
6. **HTTP-terminal**: N/A — this wrapper itself makes no HTTP calls. HTTP calls are inside `load_full_runtime_snapshot → enrich_accounts_via_api`, already fully documented in the inner distilled doc.
7. **body too large**: EXCLUDED — 456B. No chunking required.

**recovery_attempts**: not_needed_no_ceiling. Real synchronous IPC command body, full HexRays decompile on first call, direct demangled name match, no async state machine, no ICF. All 7 taxonomy items excluded without needing any recovery. `genuine_ceiling=false`.

---

## Call Tree Summary

| Symbol | VA | Role | Decompiled |
|--------|-----|------|-----------|
| `tauri::state::StateManager::try_get` | `0x10034b0fc` | Get Repository from managed state | IDA ref |
| `load_full_runtime_snapshot` | `0x1001e3bc4` | 8-phase sync load + API enrich + persist | Yes (full, 2072B) |
| `broadcast_runtime_snapshot` | `0x1001e3858` | Emit runtime-state-updated event, reason=progressive | Yes (full) |
| `core::panicking::panic_fmt` | `0x100db4888` | StateManager None panic | IDA ref |
| async wrapper `refresh_full_runtime_snapshot_async::{{closure}}` | `0x1000a2de0` | spawn_blocking + JoinHandle poll | Yes (full, 972B) |
| `switch_account_and_restart_sync` (caller) | `0x1001e6be4` | 3 callsites to refresh | Known from xrefs |
| `perform_switch_payload_with_restart` (caller) | `0x1001e8258` | 3 callsites to refresh | Distilled (REVERSE-STATUS) |
| `system::confirm_pending_auto_switch` (caller) | `0x1002613d8` | 1 callsite to refresh | Distilled (REVERSE-STATUS) |
| `BlockingTask<T>::poll` (caller) | `0x10030d508` | tokio async dispatch | Known from xrefs |

---

## Evidence References

- Owner `0x1001e6a1c`: IDA live IDB, session `<audit-session>, 2026-06-04, 456B synchronous body, full decompile.
- Async wrapper `0x1000a2de0`: IDA live IDB decompile, session `<audit-session>, 2026-06-04, full state machine.
- Core `load_full_runtime_snapshot` `0x1001e3bc4`: see `ACCOUNTS-LOAD-FULL-RUNTIME-SNAPSHOT-DISTILLED-109.md`.
- Broadcast `broadcast_runtime_snapshot` `0x1001e3858`: see `ACCOUNTS-BROADCAST-RUNTIME-SNAPSHOT-DISTILLED-109.md`.
- Callers `switch_account_and_restart_sync`, `perform_switch_payload_with_restart`, `confirm_pending_auto_switch`: see REVERSE-STATUS.md entries.
- xrefs_to `0x1001e6a1c`: 8 callsites across 4 callers — confirmed live IDB.
- Binary SHA256: `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`.

**Produced**: 2026-06-04 · <workstation> · session <audit-session>
**owner_gate**: ALLOW/first (exit 0)
