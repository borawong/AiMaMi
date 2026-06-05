# WIN-SYSTEM-SHELL-INIT-DISTILLED-109 — AiMaMi 1.0.9 Windows x64

**Session**: <audit-session>
**Machine**: <workstation>
**Date**: 2026-06-03
**Binary SHA**: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
**Platform**: windows-x64
**Cluster**: system-shell-init — 启动后初始化闭环（app 壳打开后前端渲染时的全部默认初始化命令/线程/缓存预热）

---

## Cluster Definition

The system-shell-init cluster is the closed initialization loop that executes automatically after the Tauri app shell opens and the frontend begins rendering. It is NOT a single command — it is the complete sequence of IPC calls + backend side-effects that must all fire for the frontend to reach a usable state.

Canonical source: `src/main-app.tsx` → `useCoreSnapshot()` React hook:

1. `api.loadBootstrapState()` → `invoke("load_bootstrap_state")`
2. Seed query cache slices from bootstrap payload
3. `api.loadSnapshot(true)` → `invoke("load_snapshot", { localOnly: true })`
4. Register event listeners: `runtime-state-updated`, `usage:refreshed`, `tray:navigate`, `auto-switch-pending`

---

## Cluster Leaf Inventory

### Leaf A: load_bootstrap_state (already closed)

**Status**: `strictImplementationUse` — closed in prior session (<audit-session> bootstrap deep).
See: `WIN-BOOTSTRAP-DEEP-DISTILLED-109.md` Leaf 3.

- **Owner VA**: `load_bootstrap_state_owner_sys` @ `0x140272E80`
- **Dispatcher xref**: `auto_switch_multiplex_dispatcher_sys` @ `0x1402663E0`
- **dim1**: `invoke("load_bootstrap_state")` confirmed in Win frontend CCF
- **dim2**: Full decompile A-level; BootstrapStatePayload 5 fields confirmed
- **dim3**: Depth ≥ 4; terminal `tauri_ipc_resolve_sys`
- **dim4**: In=repo handle; Out=BootstrapStatePayload{writtenAt,snapshotProgressive,usageAnalytics,mcpServers,installedSkills}; read-only; error→empty state
- **dim5**: Windows IDA evidence independent; dispatcher xref confirmed
- **ceiling**: `strictImplementationUse` (dim6 is source archive impl-side)
- **is_upstream**: true

---

### Leaf B: load_snapshot (NEW — this session)

**Status**: `strictImplementationUse` (dim1-5 closed this session)

- **Owner VA**: `load_snapshot_coroutine_sys` @ `0x1408c2e10`
- **Tokio task wrapper**: `sub_1409BBD40` @ `0x1409BBD40`
- **Tokio vtable refs**: `0x1416bb4ec`, `0x1418f6ed0`
- **Dispatcher**: not in `auto_switch_multiplex_dispatcher_sys` directly; routed via Tauri command table (`0x1416bb4d0` area)

**dim1 — frontend CCF**:
Frontend startup step 3: `api.loadSnapshot(true)` → `invoke("load_snapshot", { localOnly: true })`.
Parameter field `"localOnly"` confirmed at `0x14129c87a`; command string `"load_snapshot"` at `0x14129c86d`; window label `"app"` at `0x14129c7cd`.
`load_snapshot_coroutine_sys` uses: `v65[0]=aLoadSnapshot`, `v65[2]=aApp_3`, `aLocalonly` — all confirmed from decompile.

**dim2 — owner decompile (A-level)**:
Full decompile at `0x1408c2e10`. Size: 0xef9 (3833 bytes). Async coroutine pattern (state-machine switch on discriminant byte at `a1[5360]`, initial case=0).

Core flow:
1. Reads usage refresh state: `get_usage_refresh_interval_core_read` @ `0x1402DCBC0` → reads interval field from `AppState` via `get_usage_refresh_interval_repo_snapshot`
2. `localOnly=false` path (non-startup): calls `sub_1404632D0` @ `0x1404632D0` (state check helper, calls `get_usage_refresh_interval_state_check`) → then calls `build_runtime_snapshot_and_emit_sys` @ `0x14084DF80`
3. `localOnly=true` path (startup step 3): builds snapshot from local state only; calls `sub_140609A70` (async executor) → `build_runtime_snapshot_and_emit_sys`
4. Resolves IPC via `tauri_ipc_resolve_sys` @ `0x140062230`

**dim3 — call-tree (depth ≥ 5)**:

```
load_snapshot_coroutine_sys @ 0x1408c2e10
  → get_usage_refresh_interval_core_read @ 0x1402DCBC0
    → get_usage_refresh_interval_repo_snapshot (reads interval field from Mutex<AppState>)
  → build_runtime_snapshot_and_emit_sys @ 0x14084DF80    [A-level]
    → sub_1402D3C90 (async executor setup)
    → sub_1406085E0 @ 0x1406085E0 (snapshot 896-byte alloc, copies 0x98 usage state, atomic Arc inc)
    → sub_140387680 @ 0x140387680 (refresh await/poll; calls sub_1407CB820 coroutine)
    → runtime_state_updated_emit_and_tray_refresh_sys @ 0x1400AF970    [A-level]
      → sub_1402C8AE0 @ 0x1402C8AE0 (WebView emit "runtime-state-updated"; "poisoned webview manager" panic)
      → tray_refresh_menu_from_snapshot @ 0x14000F3E0 (tray menu refresh)
      → WakeByAddressSingle (condvar wake on completion)
    → tauri_ipc_resolve_sys @ 0x140062230 (terminal: IPC response)
```

Depth = 5 from coroutine root to `tauri_ipc_resolve_sys`. Additional terminals: `get_usage_refresh_interval_repo_snapshot` (fs/state read), `WakeByAddressSingle` (Windows syscall), `tray_refresh_menu_from_snapshot` (side-effect).

**dim4 — interface / DTO / error / side-effect**:

- **In**: `localOnly: bool` (true at startup, false for refresh)
- **Out**: runtime snapshot payload (opaque struct, serialized via `tauri_ipc_resolve_sys`; contains usage refresh state including interval + hotspot fields from `get_usage_refresh_interval_core_read`)
- **Side-effects**:
  - Emits `"runtime-state-updated"` event to all WebView listeners (via `sub_1402C8AE0`)
  - Calls `tray_refresh_menu_from_snapshot` → refreshes Windows tray menu state
  - `WakeByAddressSingle` condvar wake signals watcher thread on snapshot completion
  - When `localOnly=false`: also triggers full runtime refresh path via async `sub_140609A70`
- **Errors**:
  - `"poisoned webview manager"` panic (from `sub_1402C8AE0` @ `0x1402c8ae0`, tauri-2.10.3 webview.rs)
  - `"a Display implementation returned an error unexpectedly"` via `sub_1412085B0` on serialize failure
  - Snapshot build failure → returns error discriminant `4` (early exit without `tauri_ipc_resolve_sys`)
- **is_upstream**: true (upstream codex-cli command `load_snapshot`)

**dim5 — same-platform gate**:
All evidence is Windows-only IDA A-level decompile from `AiMaM 1.0.9 win64.exe.i64`. macOS evidence for this command exists independently in `macos-1.0.9-bootstrap` (macOS VA `0x10032XXXX` range). No macOS inference used here. IDB saved `<source-location>\raw\binary\AiMaM 1.0.9 win64.exe.i64` this session.

**dim6**: missing (source archive implementation-side; ceiling = `strictImplementationUse`)

---

### Leaf C: runtime_state_updated_emit_and_tray_refresh_sys (support leaf)

**VA**: `0x1400AF970` (renamed this session from `sub_1400AF970`)
**Role**: B-level support leaf — shared side-effect helper; not an IPC command entry point
**String evidence**: `"runtime-state-updated"` @ `0x141258738`; `"PROGRESSIVE_STATE_SAVE_FAILED"`, `"Failed to persist refreshed runtime state: "` confirmed in body
**Callers**: `build_runtime_snapshot_and_emit_sys` (startup path), `sub_1408BE4C0` (import_accounts path), `sub_1408CDB20` (refresh_usage_snapshot), and others — all non-startup refresh paths also share this leaf
**field callees**:
  - `sub_1402C8AE0` — WebView emit (`runtime-state-updated` JSON payload)
  - `tray_refresh_menu_from_snapshot` @ `0x14000F3E0` — tray update
  - `sub_1400F92F0` — reads runtime state struct from `dword_14187C030` global
  - `WakeByAddressSingle` — condvar wake
  - `sub_1400CA4E0` — cleanup/free prior state list
**PLATFORM NOTE**: `WakeByAddressSingle` replaces macOS OnceLock/atomic guard pattern. No LaunchAgent/launchctl here.
**Gate**: consumerStartReady (shared helper; not independently gated; gate derives from load_snapshot leaf B)

---

### Leaf D: boot_spawn_threads thread bodies (already closed)

Already covered in prior bootstrap session. See `WIN-BOOTSTRAP-DEEP-DISTILLED-109.md` Leaf 2.

Background threads spawned at boot that are part of the init loop:
- `auto_switch_watcher_bootstrap_sys` @ `0x14028CCB0` → spawns via `std_thread_spawn_wrapper_sys` @ `0x140004980`; calls `relay_manager_bootstrap_sys` + schtasks registration
- Thread body for auto-switch watcher: `sub_1407D0610` @ `0x1407D0610` → runs indefinitely; calls `load_auto_switch_state_sys` + emits `"auto-switch-pending"` events
- Frontend step 4 listener for `auto-switch-pending` receives events from this background thread

---

## Cluster Gate Summary

| Leaf | Platform | consumer_tier | dims closed | dim6 | is_upstream |
|---|---|---|---|---|---|
| load_bootstrap_state | windows-x64 | **strictImplementationUse** | dim1-5 | missing | true |
| load_snapshot | windows-x64 | **strictImplementationUse** | dim1-5 | missing | true |
| runtime_state_updated_emit_and_tray_refresh_sys | windows-x64 | **consumerStartReady** (support leaf) | dim1-4 | missing | true (shared) |
| boot_spawn_threads + watcher bodies | windows-x64 | **strictImplementationUse** | dim1-5 | missing | false (source archive-extra) |

**Cluster ceiling**: `strictImplementationUse` (all leaves dim1-5 closed; dim6 is source archive implementation-side acceptance mapping)

**is_upstream audit**:
- `load_bootstrap_state`: upstream codex-cli command
- `load_snapshot`: upstream codex-cli command
- `runtime_state_updated_emit_and_tray_refresh_sys`: upstream codex-cli shared helper (source archive adds tray refresh path)
- `boot_spawn_threads` watcher: `is_upstream=false` (source archive-extra schtasks/watcher; macOS uses LaunchAgent)

---

## Platform Divergences (Windows vs macOS system-shell-init)

| Item | macOS | Windows x64 |
|---|---|---|
| Event condvar on snapshot complete | OnceLock atomic guard | `WakeByAddressSingle` |
| `runtime-state-updated` emit | Tauri emit via tao | Tauri emit via WebView2 (`sub_1402C8AE0`) |
| Tray refresh | `tray_refresh_menu_from_snapshot` (same symbol) | `tray_refresh_menu_from_snapshot` @ `0x14000F3E0` |
| Auto-switch daemon registration | LaunchAgent + launchctl | schtasks `CodexMateAutoSwitch /SC MINUTE /MO 5` |
| `load_snapshot` param | `localOnly:bool` (same API) | `localOnly:bool` (same API) — confirmed from Win string table |

---

## Raw Evidence Paths

- `raw/aimami/1.0.9/windows/bootstrap/` — prior session raw evidence (win-bootstrap-residual-20260603)
- IDB: `<source-location>\raw\binary\AiMaM 1.0.9 win64.exe.i64` (saved this session)
- IDA renames: `load_snapshot_coroutine_sys` (confirmed existing name), `runtime_state_updated_emit_and_tray_refresh_sys` (new), `build_runtime_snapshot_and_emit_sys` (new)
- IDA comments set at: `0x1408c2e10`, `0x1400AF970`, `0x14084DF80`

---

## Accepted Unknowns

| Item | Classification |
|---|---|
| Exact serialized bytes of load_snapshot response payload | `accepted_unknown` — async coroutine body confirms `tauri_ipc_resolve_sys` terminal; exact JSON schema is frontend-side |
| `sub_1406085E0` snapshot struct layout (896 bytes) | `accepted_unknown` — struct alloc confirmed; field layout not fully traced; does not block source archive implementation |
| Full call-tree of `runtime_state_updated_emit_and_tray_refresh_sys` inner `sub_1400F92F0` | `accepted_unknown` — reads from `dword_14187C030` global; runtime state store; ICF-like complexity |
| dim6 test/acceptance mapping | `accepted_unknown` (source archive implementation-side; not a reversal blocker) |
