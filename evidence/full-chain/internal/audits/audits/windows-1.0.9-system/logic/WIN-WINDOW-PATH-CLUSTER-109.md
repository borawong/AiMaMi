# WIN-WINDOW-PATH-CLUSTER-109.md
## windows-1.0.9-system | focus_main_window + open_path | Session <audit-session> | 2026-06-03

SHA: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
Machine: <workstation>

---

## Gate Summary

| leaf | platform | gate_tier | is_upstream | dims_done | ceiling |
|---|---|---|---|---|---|
| focus_main_window | windows-x64 | **strictImplementationUse** | false | dim1-5 closed | dim6 missing |
| open_path | windows-x64 | **strictImplementationUse** | false | dim1-5 closed | dim6 missing |

---

## focus_main_window

### dim1 — Frontend CCF
- Native-bootstrap-spawn substitute accepted (is_upstream=false, no UI trigger in upstream CCF)
- Dispatched via `auto_switch_multiplex_dispatcher_sys@0x1402663e0` (command string confirmed at `0x140270db0`)
- IPC: `invoke("focus_main_window")` — no input params

### dim2 — Owner (A-level)
- **focus_main_window_owner_sys@0x140270D30** (renamed; 847B, 32 BB, cyclomatic 9)
- Caller: `auto_switch_multiplex_dispatcher_sys` xref at `0x14026a16b`

### dim3 — Call-Tree (depth ≥ 5)
```
focus_main_window_owner_sys@0x140270D30 (A)
  ├─ get_usage_refresh_interval_core_read@0x1402DCBC0 (A — reads settings refresh discriminant)
  │   └─ get_usage_refresh_interval_repo_snapshot@0x1400F61A0 (B — AppState read)
  ├─ focus_main_window_core_sys@0x140162EB0 (A — extracts AppHandle + dispatches)
  │   ├─ sub_1402D3C90@0x1402D3C90 (B — managed state extract)
  │   ├─ focus_main_window_dispatch_sys@0x140638240 (A — window ID check + focus)
  │   │   ├─ sub_141047E80@0x141047E80 (B — current window handle)
  │   │   └─ sub_140638F20@0x140638F20 (A — Tauri AppHandle window event dispatch)
  │   └─ sub_140176BB0@0x140176BB0 (B — error emitter)
  └─ tauri_ipc_resolve_sys@0x140062230 (terminal — IPC response)
```

### dim4 — Interface / DTO / Error / Side-Effect
- **Input**: none (no args extracted)
- **Output**: opaque sensitive-field via tauri_ipc_resolve_sys (not structured JSON)
- **Settings read**: `get_usage_refresh_interval_core_read` reads discriminant from AppState
  - discriminant == 3: direct IPC resolve path (cached)
  - discriminant != 3: focus_main_window_core_sys path
- **Focus mechanism**: clones AppHandle Arc (InterlockedIncrement64 on ref-count fields), dispatches Tauri window focus event via `sub_140638F20`
- **Ok discriminant**: *a1 = 18 (set in focus_main_window_dispatch_sys on success)
- **Error paths**: tag 6 (settings error), tag 3 (dispatch error via sub_140068830)
- **Side effects**: reads AppState mutex, clones AppHandle Arc, dispatches Tauri window focus/show event. No file IO, no network, no process spawn.

### dim5 — Platform Gate (Windows x64)
- All VAs from Windows PE binary only
- Uses Tauri AppHandle window system (sub_140638F20, managed_state_register_sys)
- No macOS inference

---

## open_path

### dim1 — Frontend CCF
- Native-bootstrap-spawn substitute accepted (is_upstream=false)
- Dispatcher case `loc_140268E60` in `auto_switch_multiplex_dispatcher_sys@0x1402663e0`
- String "open_path" at `0x141268e79`, xref at `0x140268ed8`
- IPC: `invoke("open_path", {path: String})` — one required String param

### dim2 — Owner (A-level)
- Dispatcher case inline + **open_path_core_sys@0x1400AEA60** (renamed; dedicated core)
- Dispatcher case range: `0x140268E60–0x140268FAD`

### dim3 — Call-Tree (depth ≥ 5)
```
auto_switch_multiplex_dispatcher_sys (dispatcher)
  └─ [case loc_140268E60 — inline]
      ├─ import_remote_device_secret_result_adapter_sys@0x14045F6C0 (A — extracts path String)
      └─ open_path_core_sys@0x1400AEA60 (A — launches explorer)
          ├─ sub_14103D7A0@0x14103D7A0 (B — OsString init "explorer")
          ├─ sub_14103D680@0x14103D680 (B — OsString append path bytes)
          ├─ sub_141042700@0x141042700 (B — process launch wrapper)
          │   └─ sub_141037A60@0x141037A60 (B — CreateProcess, GetEnvironmentStringsW, GetLastError)
          │       └─ GetEnvironmentStringsW (Win32 terminal leaf)
          │       └─ GetLastError (Win32 terminal leaf)
          ├─ sub_141051920 (B — result assembly from process handle)
          ├─ sub_1400source archive610 (B — OsString drop)
          └─ CloseHandle×5 (Win32 terminal — on error path, closes process+thread handles)
```

### dim4 — Interface / DTO / Error / Side-Effect
- **Input param field**: `"path"` (4 chars), type: String (UTF-8, ptr+len via arg extractor)
- **Output**: no structured JSON; success = process handle info; error = sentinel `0x8000000000000000`
- **Process launch**: OsString "explorer " + path → CreateProcess (sub_141037A60)
  - Environment: GetEnvironmentStringsW (inherits current process env)
  - Launch result: discriminant v16 == 2 = success
- **Error paths**:
  - arg extraction fails (discriminant != 6): goto error_path `0x140269C98`
  - open_path_core_sys result CC8 == 0: goto error `0x14026A4D1`
  - Core error: CloseHandle on up to 5 Win32 handles; sets error sentinel
- **Side effects**: spawns Windows `explorer.exe` process with path argument. No settings IO, no network, no Tauri AppHandle.

### dim5 — Platform Gate (Windows x64)
- Windows-specific: `explorer.exe`, `GetEnvironmentStringsW`, `CloseHandle`
- macOS equivalent uses `open` command / NSWorkspace — NOT the same implementation
- All evidence from Windows PE binary only

---

## Evidence Paths
```
raw: <source-location>/raw/aimami/1.0.9/windows-x64/system/focus_main_window/evidence.md
raw: <source-location>/raw/aimami/1.0.9/windows-x64/system/open_path/evidence.md
IDB: <source-location>/source-binary/AiMaM 1.0.9 win64.exe.i64 (saved 2026-06-03)
```

---

## Upstream Status
Both leaves are **source archive-extra** (is_upstream=false). Neither `focus_main_window` nor `open_path` appears in upstream codex-cli. These are source archiveGame-added IPC commands.

## Notes
- `focus_main_window` ceiling is strictImplementationUse due to opaque sensitive-field output (not structured JSON DTO) and no dim6 test mapping
- `open_path` ceiling is strictImplementationUse — Windows-only `explorer.exe` launch; macOS counterpart not analyzed this session
- dim6 (test/acceptance mapping) not assessed for either leaf
