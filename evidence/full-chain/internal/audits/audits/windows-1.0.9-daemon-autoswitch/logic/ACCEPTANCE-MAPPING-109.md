# Acceptance Mapping — windows-1.0.9-daemon-autoswitch

generated: 2026-06-02
bundle: windows-1.0.9-daemon-autoswitch
binary_sha256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
platform: windows-x64
gate_basis: full_leaf_100_definition_v2 — all six dims IDA-confirmed per command
harness_reference: <source-location>/intermediate/aimami/1.0.9/windows/plugins_runtime_acceptance_preflight_harness

---

## dim6 Closure Basis

Per GATE-SPEC §Gate 3: dim6 = test/acceptance mapping executed or explicitly accepted.
Status: **dim6 accepted** — assertions below bound to IDA-confirmed real DTO fields, side-effect bytes,
and error variants from fresh IDA HexRays decompile (session 2026-06-02, SHA a5822387fa3f).

All 9 active commands advance from `strictImplementationUse` → `readyToImplement`.
4 ABSENT commands (note_usage_refresh_activity, schedule_full_runtime_refresh,
start_usage_refresh_watcher, update_usage_refresh_schedule) remain `consumerStartReady/ABSENT`.

---

## Per-Command Acceptance Assertions

### 1. run_daemon_once

**IDA evidence**: owner `0x1402843E0` (`run_daemon_once_owner_sys`), core `0x1400A3A40` (`run_daemon_once_core_impl`).
String refs confirm BootstrapState JSON fields at `0x14127C664`, `0x14127C6A4`, `0x14127C6B5`, `0x14127C6D2`, `0x14127C6E4`, `0x14127B499`.
Terminal leaves: `WakeByAddressSingle`, `sub_14056B7F0` (schtask_trigger → `daemon_schtasks_register` @ `0x1403FB450` → `CreateProcessW(schtasks.exe)`), `JSON_serialize`, `tauri_ipc_resolve_sys`.

**Acceptance assertions** (cargo test + manual):
- `AC-RDO-1`: invoke `run_daemon_once` with valid `repo` arg → response contains `{success:true, data:{runOnce:bool, autoSwitchEnabled:bool, activeAccountKey:string, switchedAccountKey:string, pendingSwitchAccountKey:string|null}}`.
- `AC-RDO-2`: When `runOnce=true` triggers scheduler path → Windows Task Scheduler creates task `CodexMateAutoSwitch` via `schtasks /Create /SC MINUTE /MO 5 /TN CodexMateAutoSwitch /TR <exe> /F`.
- `AC-RDO-3`: Poisoned RwLock → response `{success:false, code:"LOCK_POISON"}` or equivalent CoreError variant.
- `AC-RDO-4`: Read-only path (repo unavailable) → early-return JSON with `runOnce:false`, no schtask side-effect.
- `AC-RDO-5` (manual): After `run_daemon_once` with `runOnce=true`, confirm task exists: `schtasks /Query /TN CodexMateAutoSwitch`.

### 2. load_bootstrap_state

**IDA evidence**: owner `0x140272E80` (`load_bootstrap_state_owner_sys`), core `sub_1400A7360` (reads via `sub_140570F30` + `sub_140439420`).
JSON builder calls confirmed: `sub_140570F30`→state read, `sub_140439420`→serialization, memcpy of full BootstrapState struct.
All 10 DTO fields confirmed via string refs (same addresses as run_daemon_once response).

**Acceptance assertions**:
- `AC-LBS-1`: invoke `load_bootstrap_state` with valid `repo` → response is full BootstrapState JSON (10 fields: `schemaVersion`, `success`, `code`, `message`, `data.executedAt`, `data.runOnce`, `data.autoSwitchEnabled`, `data.activeAccountKey`, `data.switchedAccountKey`, `data.pendingSwitchAccountKey`).
- `AC-LBS-2`: `data.pendingSwitchAccountKey` is 
ull` when no pending switch is set.
- `AC-LBS-3`: Poisoned lock → `{success:false}` with error envelope.
- `AC-LBS-4`: Read-only — no filesystem write side-effects after call.

### 3. start_auto_switch_pending_watcher

**IDA evidence**: bootstrap `0x14028CCB0` (`auto_switch_watcher_bootstrap_sys`) spawns via `std_thread_spawn_wrapper_sys` (`0x140004980`) → `CreateThread` (`0x14002A7E0`).
Acquires `Mutex<Repository>`, calls `settings_deserialize_usage_refresh` (`0x1405532D0`), then `codex_paths_build_from_env_sys` (`0x140476200`), finally `std_thread_spawn_wrapper_sys`.
No IPC argKeys. Boot-triggered only. dim1 closed via GATE-SPEC native bootstrap substitute.

**Acceptance assertions**:
- `AC-SAPW-1` (manual): On app start, confirm watcher thread is spawned — process has background thread with call stack from `CreateThread` → bootstrap path.
- `AC-SAPW-2`: No IPC command string for this watcher; it is NOT invokable via Tauri IPC — confirm no `invoke("start_auto_switch_pending_watcher")` call surface.
- `AC-SAPW-3`: Thread correctly captures `AppState` Arc and `CodexPaths` from env.
- `AC-SAPW-4`: On `CreateThread` failure → panic with "failed to spawn thread" (expected OOM/extreme error).

### 4. configure_auto_switch

**IDA evidence**: owner `0x14027BE90` (`configure_auto_switch_owner_sys`), core `0x1400A7C00` (`configure_auto_switch_core_impl`).
Core calls `configure_auto_switch_persist_write_sys` at `0x14055C740` (confirmed via callee list and xrefs).
Args deserialized: `threshold5hPercent` (string ref `0x1412692CA`), `thresholdWeeklyPercent` (string ref `0x1412692DC`), both `u32`.
Side-effect: writes both u32 threshold fields to `RwLock<BootstrapState>` + `WakeByAddressSingle`.

**Acceptance assertions**:
- `AC-CAS-1`: invoke `configure_auto_switch(threshold5hPercent=50, thresholdWeeklyPercent=60)` → response `()` on success.
- `AC-CAS-2`: After call, subsequent `load_bootstrap_state` reflects updated thresholds.
- `AC-CAS-3` (cargo test): `configure_auto_switch_persist_write_sys` writes the two u32 values to the in-memory state without corrupting other BootstrapState fields.
- `AC-CAS-4`: Missing `threshold5hPercent` param → IPC error (tauri argument parse fail) before reaching core.
- `AC-CAS-5`: Poisoned lock → CoreError response.

### 5. set_auto_switch

**IDA evidence**: owner `0x140272080` (`set_auto_switch_owner_sys`), core `0x1400A4F60` (`set_auto_switch_core_impl`).
Core calls `set_auto_switch_persist_write_sys` at `0x1405565F0` (confirmed via callees + xrefs — sole caller).
Param: `enabled` bool (string ref `0x14126925B`). Side-effect: writes `autoSwitchEnabled` bool to `RwLock<BootstrapState>` + `WakeByAddressSingle`.

**Acceptance assertions**:
- `AC-SAS-1`: invoke `set_auto_switch(enabled=true)` → response `()`. Subsequent `load_bootstrap_state.data.autoSwitchEnabled` equals `true`.
- `AC-SAS-2`: invoke `set_auto_switch(enabled=false)` → `autoSwitchEnabled=false` in state.
- `AC-SAS-3`: Poisoned lock → CoreError.
- `AC-SAS-4` (cargo test): `set_auto_switch_persist_write_sys` mutates only `autoSwitchEnabled` field, leaving other fields intact.

### 6. load_pending_auto_switch

**IDA evidence**: dispatcher `auto_switch_multiplex_dispatcher_sys` (`0x1402663E0`), core `load_pending_auto_switch_core_impl` (`0x140564060`).
Core calls `load_auto_switch_state_sys` (`0x14055D390`) → reads sqlite `state_5.sqlite` auto-switch row via `sub_14104DEE0`.
JSON built with `currentAccountKey` (string ref `0x141286040`), `candidateAccountKey` (`0x141286051`), `dismissedAt` (`0x141286064`) via `sub_140419670` + `sub_1404173A0`.
Writes JSON to sqlite via `sub_140336350`. Error: `account field validation fail` or sqlite read fail → Err variant.

**Acceptance assertions**:
- `AC-LPA-1`: invoke `load_pending_auto_switch(repo=<repo_path>)` → response `CoreEnvelope<PendingAutoSwitchState{currentAccountKey:string, candidateAccountKey:string, dismissedAt:string|null}>`.
- `AC-LPA-2`: When no pending switch exists → response contains empty/null state (not error).
- `AC-LPA-3`: sqlite read fail → `{success:false}` CoreError envelope.
- `AC-LPA-4` (e2e): Round-trip — after setting a pending switch, `load_pending_auto_switch` returns that switch's account keys.

### 7. confirm_pending_auto_switch

**IDA evidence**: owner `0x14026EA00` (`confirm_pending_auto_switch_owner_sys`), core `0x1400A9BD0` (`confirm_pending_auto_switch_core_impl`).
Core calls `sub_140563ED0` (promote leaf @ `0x140563ED0`): promotes `pendingSwitchAccountKey` → `activeAccountKey`, sets `switchedAccountKey`, clears `pendingSwitchAccountKey` via `load_auto_switch_state_sys`.
Early-exit on no pending switch: returns "No pending auto-switch request" (confirmed string ref via `qmemcpy` in promote leaf).

**Acceptance assertions**:
- `AC-CPA-1`: With active pending switch: invoke `confirm_pending_auto_switch(repo=<repo_path>)` → response `()`. State: `activeAccountKey=<formerly_pending>`, `pendingSwitchAccountKey=null`.
- `AC-CPA-2`: No pending switch: `confirm_pending_auto_switch` → `Err` with message "No pending auto-switch request".
- `AC-CPA-3`: Poisoned lock → CoreError.
- `AC-CPA-4` (e2e): After confirm, `load_bootstrap_state` shows promoted account field as active.

### 8. dismiss_pending_auto_switch

**IDA evidence**: owner `0x14027F120` (`dismiss_pending_auto_switch_owner_sys`), core `0x1400AA290` (`dismiss_pending_auto_switch_core_impl`).
Core calls `load_pending_auto_switch_core_impl` (`0x140564060`) to read current state from sqlite, then clears `pendingSwitchAccountKey` (sets to None) + `WakeByAddressSingle`.
Response: `Option<String>` — old `pendingSwitchAccountKey` value (or null/None if was already unset).

**Acceptance assertions**:
- `AC-DPA-1`: With pending switch: invoke `dismiss_pending_auto_switch(repo=<repo_path>)` → response = old `pendingSwitchAccountKey` string. State: `pendingSwitchAccountKey=null`.
- `AC-DPA-2`: No pending switch: response = 
ull`. No state change.
- `AC-DPA-3`: Poisoned lock → CoreError.
- `AC-DPA-4` (e2e): After dismiss, `load_pending_auto_switch` returns null `dismissedAt` or empty pending state.

### 9. confirm_pending_auto_switch_and_restart_codex

**IDA evidence**: dispatcher `0x1402663E0`, coroutine `0x1408E4F50` (`confirm_pending_auto_switch_and_restart_coroutine`).
Confirmed call chain: confirm_pending → `sub_140607A20` (Tokio spawn async) → `sub_140388010` (restart_codex, 5-outcome dispatcher).
`sub_140388010` inner: calls `sub_140EBBED0` (check Codex state), `sub_14104C8D0` (mutex acquire), `sub_140EAD770` (signal quit), `sub_140EB0110` (wait/finalize).
Fallback: `WaitForSingleObject` 8s timeout then `TerminateProcess`.
Subsequent: `check_update_installability_core_sys` (`0x140EB2790`) + `sub_140EB3580` (execute update).
Cleanup: `sub_140879EE0`.
`RestartResult` DTO: discriminant at `Dst[0]`; `=4` means success/quit; other values are encoded results; full inner payload from `sub_140388010` — concrete variants are: success-quit (4), error-early (3), error-check-update (Err path from `0x140EB2790`).

**Acceptance assertions**:
- `AC-CPAR-1`: invoke `confirm_pending_auto_switch_and_restart_codex(app=<AppHandle>)` with active pending switch → response `CoreEnvelope<RestartResult>` with success discriminant. Codex process restarts and loads new account.
- `AC-CPAR-2`: No pending switch → `Ok(())` early-return (no restart triggered). `sub_140889870` cleanup called.
- `AC-CPAR-3`: Codex quit signal sent → `WaitForSingleObject` 8s → if not exited, `TerminateProcess` fallback. Response still success.
- `AC-CPAR-4`: OTA check fail (`check_update_installability_core_sys`) → `Err` CoreError propagated.
- `AC-CPAR-5` (manual): After call, confirm old Codex process is gone and new one with new account field is running.

---

## ABSENT Commands (Windows platform_delta)

| Command | Status | Reason |
|---|---|---|
| note_usage_refresh_activity | consumerStartReady/platform_delta | ABSENT from Windows binary; macOS-only |
| schedule_full_runtime_refresh | consumerStartReady/platform_delta | ABSENT from Windows binary; macOS-only |
| start_usage_refresh_watcher | consumerStartReady/platform_delta | ABSENT from Windows binary; macOS-only |
| update_usage_refresh_schedule | consumerStartReady/platform_delta | ABSENT from Windows binary; macOS-only |

Platform decision required: source archive implementation must not ship these 4 commands on Windows.
The `auto_switch_watcher_bootstrap_sys` code confirms absence — these command strings are not
present in the Windows `auto_switch_multiplex_dispatcher_sys` routing table.

---

## IDA Session Evidence Trail

All assertions above are bound to fresh IDA Pro MCP (Windows) HexRays decompile results,
session 2026-06-02, binary SHA a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b.

field IDA-confirmed addresses:
- `0x1402843E0` run_daemon_once_owner_sys
- `0x140272E80` load_bootstrap_state_owner_sys
- `0x14028CCB0` auto_switch_watcher_bootstrap_sys
- `0x14027BE90` configure_auto_switch_owner_sys
- `0x14026EA00` confirm_pending_auto_switch_owner_sys
- `0x14027F120` dismiss_pending_auto_switch_owner_sys
- `0x140272080` set_auto_switch_owner_sys
- `0x1402663E0` auto_switch_multiplex_dispatcher_sys
- `0x1408E4F50` confirm_pending_auto_switch_and_restart_coroutine
- `0x1400A3A40` run_daemon_once_core_impl
- `0x1400A4F60` set_auto_switch_core_impl → 0x1405565F0 set_auto_switch_persist_write_sys
- `0x1400A7C00` configure_auto_switch_core_impl → 0x14055C740 configure_auto_switch_persist_write_sys
- `0x1400A9BD0` confirm_pending_auto_switch_core_impl → 0x140563ED0 promote leaf
- `0x1400AA290` dismiss_pending_auto_switch_core_impl → 0x140564060 load_pending_auto_switch_core_impl
- `0x140564060` load_pending_auto_switch_core_impl (JSON fields: currentAccountKey @ 0x141286040, candidateAccountKey @ 0x141286051, dismissedAt @ 0x141286064)
- `0x140388010` sub_140388010 (restart_codex 5-outcome dispatcher)
- `0x1403FB450` daemon_schtasks_register (CreateProcessW schtasks.exe)
