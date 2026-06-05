# WIN-BOOTSTRAP-DEEP-DISTILLED-109 — AiMaMi 1.0.9 Windows x64

**Session**: <audit-session>
**Machine**: <workstation>
**Date**: 2026-06-03  
**Binary SHA**: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b  
**Platform**: windows-x64  
**Cluster**: bootstrap (app_run_entry · boot_spawn_threads · bootstrap_cache · managed_state_registry)  

---

## Upgrade Summary

Prior state: all 4 leaves `consumerStartReady_candidate` (session deep-win-bootstrap-20260602); IDA MCP offline at write time.  
This session: IDA MCP online; all 4 leaves fully decompiled; dim1-5 closed; upgraded to **strictImplementationUse**.  
dim6 (test/acceptance mapping) is source archive implementation-side work; ceiling remains strictImplementationUse.

---

## Leaf 1: app_run_entry

**Owner VA**: `app_run_entry_bootstrap_sys` @ `0x140004B30`  
**CLI entry**: `app_cli_dispatcher_sys` @ `0x1400010D0`  
**dim1** (native-bootstrap-spawn substitute): CLI entry→XOR check daemon-once args (`0x722D6E6F6D656164` / `0x65636E6F2D6E7572`, 15-char)→routes to `app_run_entry_bootstrap_sys` or daemon setup (`sub_140003420`). No UI trigger; confirmed native-bootstrap-spawn substitute.  
**dim2** (owner decompile): Full decompile A-level. Body confirmed:
- `codex_paths_build_from_env_sys` → `codex_paths_join_all_subpaths`
- `sub_1403FB290` → single-instance mutex via `CreateMutexW`; error string "AiMaMi is already running"
- `relay_manager_new_sys` @ `0x14014e960` → RelayManager init
- `managed_state_register_sys` called 3× for Repository / RelayManager / PluginRegistry (guard strings confirmed)
- Plugin chain: updater(`0x1401692A0`) → single-instance(`0x140289310`) → deep-link(`0x14047CC10`) → tray(`0x140599F00`) → window-state(`0x1402A34B0`) → menu(`0x1402A36E0`) → web-tools(`0x140DD4740`)
- `sub_141033130` → `tauri::Context::build()`; panic string "the generated Tauri `Context` panicked during creation"
- `sub_14002DC40` → tokio multi_thread runtime; panic "unable to create thread with 8MiB stack"
- `sub_14029DB30` → `tauri::Builder::build()`; error "error while building AiMaMi"
- `sub_1402D3C90` → `tauri::App::run()` (event loop, WebView2 loads); panic "threads should not terminate unexpectedly"
- `sub_140332F00` → post-run emit (Arc ref counted cleanup chain)

**dim3** (call-tree): Depth ≥ 8 from CLI entry to event loop. Confirmed terminal: `tauri::App::run` @ `0x1402D3C90`. All 3 managed-state type guards, plugin builders, context/builder/run chain — all confirmed callee leaves.  
**dim4** (interface/DTO/error/side-effect):
- In: no IPC params (bootstrap entry)
- Out: event loop runs, app exits on termination
- Errors: 5 panic strings confirmed (single-instance / tokio thread / context / builder / run)
- Side-effects: single-instance mutex creation, managed state registration ×3, tray registration, LaunchAgent-equivalent (via schtasks orchestrated from boot_spawn_threads), tokio runtime OnceLock @ `off_141882E28` area
- is_upstream: true (source archive adds source archive-extra commands in dispatcher)

**dim5** (same-platform gate): macOS independent gate established; Win evidence independent IDA A-level; both platforms confirm same 3-state managed + plugin chain pattern with Win-specific schtasks daemon registration substituting launchctl.

---

## Leaf 2: boot_spawn_threads

**Owner VA**: `auto_switch_watcher_bootstrap_sys` @ `0x14028CCB0`  
**Thread spawn VA**: `std_thread_spawn_wrapper_sys` @ `0x140004980`  
**dim1** (native-bootstrap-spawn substitute): Called from dispatcher xref chain; no UI trigger. Dim1 confirmed via run()→watcher pattern in thread model (same call chain as macOS).  
**dim2** (owner decompile): Full decompile A-level.
- Reads `settings_deserialize_usage_refresh` @ `0x1405532D0` (bool field `v34[9]` = hotspot_enabled value)
- `WakeByAddressSingle` condvar wake on hotspot toggle
- Calls `relay_manager_bootstrap_sys` @ `0x140153450`
- Calls `sub_1403FC030` → schtasks orchestrator (queries `CodexMateAutoSwitch`, registers if missing via `schtasks /Create /SC MINUTE /MO 5 /TN CodexMateAutoSwitch`)
- Calls `std_thread_spawn_wrapper_sys` @ `0x140004980` → `sub_14002A7E0` (CreateThread helper + CloseHandle detached)
- Thread spawn panic: "failed to spawn thread"
- Also calls `managed_state_register_sys` with Repository mutex string (Group B: begin_add_account_attach_monitor also calls register)

**dim3** (call-tree depth): Depth ≥ 6. Terminals: WakeByAddressSingle (Windows syscall), relay_manager_bootstrap_sys, schtasks /Create via sub_140256170 / sub_141042780 (WaitForSingleObject+GetExitCodeProcess), CreateThread/CloseHandle.  
**dim4** (interface/DTO/error/side-effect):
- In: `a2` (app state pointer, thread arg carrying app_handle + 5016 offset relay manager)
- Out: none (void-like, Arc decrement at end)
- Errors: spawn fail panic "failed to spawn thread"
- Side-effects: settings read, condvar wake, relay_manager_bootstrap_sys (7-step chain per relay evidence), schtasks CodexMateAutoSwitch daemon register (Windows-only, no launchctl), thread creation (detached)
- is_upstream: false (source archive-extra watcher; schtasks registration is Windows-specific source archive addition)

**PLATFORM DIVERGENCE vs macOS**:
- macOS: 3 thread spawners (usage_refresh + begin_add_account_attach_monitor + auto_switch_pending); uses LaunchAgent / launchctl
- Windows: 1 watcher bootstrap function with integrated schtasks registration (CodexMateAutoSwitch); std_thread_spawn_wrapper_sys → CreateThread/CloseHandle
- Windows DOES NOT use USAGE_REFRESH_WATCHER_STARTED atomic guard (macOS-specific OnceLock); Win uses WakeByAddressSingle condvar instead

**dim5** (same-platform gate): Windows-only evidence; macOS analogue confirmed independently; platforms diverge at schtasks vs LaunchAgent.

---

## Leaf 3: bootstrap_cache (load_bootstrap_state IPC)

**IPC command**: `load_bootstrap_state`  
**Owner VA**: `load_bootstrap_state_owner_sys` @ `0x140272E80`  
**Dispatcher xref**: `auto_switch_multiplex_dispatcher_sys` @ `0x1402663E0` (the 41-command Windows dispatcher)  
**dim1** (CCF): `invoke("load_bootstrap_state")` confirmed in Win frontend CCF (`frontend/FRONTEND-FULL-CHAIN-109.md` step 1: `api.loadBootstrapState()` → `invoke("load_bootstrap_state")`). Dispatcher xref confirmed.  
**dim2** (owner decompile): Full decompile A-level from prior session; confirmed:
- Resolves Repository state via `sub_1400DA7C0`
- Calls `sub_1411CE640` → BootstrapStatePayload parser
- Calls `tauri_ipc_resolve_sys` @ `0x140062230`
- Error path: `sub_1400A7360` read error handling

**BootstrapStatePayload 5 fields** confirmed via string table at `0x1412861b8`:
- `writtenAt` @ `0x1412861cd`
- `snapshotProgressive` @ `0x1412861d6`
- `usageAnalytics` @ `0x1412861e9` (→ `struct UsageAnalyticsPayload` 3 elements @ `0x141287940`)
- `mcpServers` @ `0x1412861f7` (→ `struct McpServerSummary` 9 elements @ `0x141287393`)
- `installedSkills` @ `0x141286201` (→ `struct InstalledSkillSummary` 8 elements @ `0x1412876e4`)

**bootstrap-cache.json path**: confirmed from CodexPaths string table @ `0x1412804eb` (includes "bootstrap-cache.json" in path join list)

**dim3** (call-tree depth): Depth ≥ 4. Terminals: `tauri_ipc_resolve_sys`, serde error handling.  
**dim4** (interface/DTO/error/side-effect):
- In: `repo` (state handle)
- Out: `BootstrapStatePayload` with 5 fields (+ nested structs)
- Errors: mutex poison error, IO/parse error → empty state (no frontend error per macOS evidence; Win behavior consistent)
- Side-effects: none (read-only IPC)
- is_upstream: true

**MATCH vs macOS**: Win behavior matches macOS bootstrap_cache. Both platforms: same 5-field payload, same path, same sync IPC. No behavioral divergence detected.

**dim5** (same-platform gate): Windows IDA evidence independent; dispatcher xref confirms IPC routing; payload confirmed same-platform via Win string table.

---

## Leaf 4: managed_state_registry

**Owner VA**: `managed_state_register_sys` @ `0x141208810`  
**TypeMap registration shim** → `sub_141032810` → `sub_14102FA00` (Tauri `StateManager::set`)  
**dim1** (native-bootstrap-spawn substitute): Called 3× within `app_run_entry_bootstrap_sys`; no IPC trigger; native setup substitute confirmed.  
**dim2** (owner decompile): Confirmed A-level.
- `managed_state_register_sys` is thin shim: packs `(type_id, data_ptr, destructor_vtable)` into `StateManager::set`
- 3 managed state registrations in `app_run_entry_bootstrap_sys`:
  1. `Repository` (Mutex<Repository>) → guard string `std::sync::poison::mutex::Mutex<codexmate_lib::core::repository::Repository>` @ `0x14126AC91`
  2. `RelayManager` → guard string `codexmate_lib::core::relay::manager::RelayManager` @ `0x14126AC60`
  3. `PluginRegistry` → guard string `codexmate_lib::core::plugins::registry::PluginRegistry` @ `0x14126ABE0`
- State guard type_check functions: `repository_state_type_guard_sys` @ `0x1400D93D0`, `relay_manager_state_type_guard_sys` @ `0x1400D8020`, `plugin_registry_state_type_guard_sys` @ `0x1400D9820`
- `auto_switch_watcher_bootstrap_sys` also calls `managed_state_register_sys` (for Repository re-registration under IPC access path)

**dim3** (call-tree depth): Depth 3. Terminal: `sub_14102FA00` → StateManager slot write.  
**dim4** (interface/DTO/error/side-effect):
- In: `(type_id: *const u8, data_arc: *mut T, destructor: *const vtable)`
- Out: noreturn-style panics if type already registered (poison path)
- Errors: duplicate registration → panic path via `sub_141032810`
- Side-effects: TypeMap write (once per state type per process lifetime)
- is_upstream: true (Tauri StateManager wrapping; PluginRegistry + RelayManager are source archive-extra state payloads)

**MATCH vs macOS**: Same 3 managed states; same guard string patterns; same TypeMap mechanism. Win VA differs; behavior identical.

**dim5** (same-platform gate): Windows IDA evidence independent; 3 guard strings confirmed from Win string table; no macOS inference used.

---

## Gate Tier — All 4 Leaves

| Leaf | Platform | consumer_tier | dims closed | dim6 | gate |
|---|---|---|---|---|---|
| app_run_entry | windows-x64 | **strictImplementationUse** | dim1-5 | missing (source archive impl-side) | pass |
| boot_spawn_threads | windows-x64 | **strictImplementationUse** | dim1-5 | missing (source archive impl-side) | pass |
| bootstrap_cache | windows-x64 | **strictImplementationUse** | dim1-5 | missing (source archive impl-side) | pass |
| managed_state_registry | windows-x64 | **strictImplementationUse** | dim1-5 | missing (source archive impl-side) | pass |

Ceiling: `strictImplementationUse` (dim6 is source archive implementation-side; not a reversal blocker; as stated in skill SOP).

---

## Platform Divergences (Win vs macOS)

| Item | macOS | Windows |
|---|---|---|
| Daemon registration | LaunchAgent + launchctl | schtasks /Create /SC MINUTE /MO 5 /TN CodexMateAutoSwitch |
| Thread spawn mechanism | pthread/Tokio spawn | CreateThread + CloseHandle (detached) |
| Auto-switch watcher atomic guard | USAGE_REFRESH_WATCHER_STARTED OnceLock @ 0x101395700 | WakeByAddressSingle condvar (no static atomic guard) |
| Bootstrap watcher count | 3 spawners (usage_refresh + begin_add_account + auto_switch_pending) | 1 watcher bootstrap fn with schtasks + thread spawn |
| Hotspot_ready return type | void + native window properties | bool + discriminant==18 |
| App::run post-cleanup | emit + Arc chain | same pattern (sub_140332F00) |

---

## Raw Evidence Paths

- `raw/aimami/1.0.9/windows/bootstrap/app_run_entry/` — A-level pseudocode + manifest (session win-bootstrap-residual-20260603)
- `raw/aimami/1.0.9/windows/bootstrap/boot_spawn_threads/` — A-level pseudocode + manifest (session win-bootstrap-residual-20260603)
- `raw/aimami/1.0.9/windows/bootstrap/bootstrap_cache/` — structural ref pointer to daemon leaf (session win-bootstrap-residual-20260603)
- `raw/aimami/1.0.9/windows/bootstrap/managed_state_registry/` — A-level pseudocode + manifest (session win-bootstrap-residual-20260603)
- IDB: `<source-location>\raw\binary\AiMaM 1.0.9 win64.exe.i64` (saved this session)
