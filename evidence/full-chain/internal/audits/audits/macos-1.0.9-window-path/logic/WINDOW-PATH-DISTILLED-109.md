# window-path Cluster — macOS arm64 / AiMaMi 1.0.9 — DISTILLED

Produced: 2026-06-03  
Session: <audit-session>
Machine: <workstation>
SHA (first 12): 1db044e8efab  
Gate: strictImplementationUse (dim1-5 closed; dim6 not assessed)  
Authoritative: true  

---

## Cluster Summary

Two IPC commands in the `window-path` cluster:
- `focus_main_window` — focuses the main AiMaMi application window via Wry event loop
- `open_path` — opens a file system path or URL using macOS `/usr/bin/open`

Both are **upstream** (present in upstream codex-cli codebase).

---

## Leaf 1: focus_main_window

**VA**: `0x10032e820`  
**Module**: `codexmate_lib::commands::hotspot`  
**is_upstream**: true  

### dim1 (CCF / IPC trigger)
- IPC command: `"focus_main_window"` (no parameters)
- IPC dispatcher closure: `0x10032159c` (run::{{closure}}::{{closure}})
- **Second path**: Tray event handler `handle_tray_menu_event@0x1003317e4` calls `focus_main_window` directly when tray menu event matches `"tray_open_main"` (len=14) or `"tray_active_title"` (len=17) or `"tray_active_subtitle"`/`"tray_boot_strap..."` (len=20/23)
- dim1 status: **closed**

### dim2 (owner decompile)
Body: Clones AppHandle, builds a 160-byte `WryUserEvent` payload with discriminant **28** and `focused=true` (byte-8 of field[9] = `0x01`), posts via `tauri_runtime_wry::send_user_message@0x1003eaf88`. Vtable: `anon_3229ff4e18cd66813633fef5ae3b16b2_1026@0x1012ce868`.

Variant family:
| Function | VA | focus byte |
|---|---|---|
| `focus_main_window` | 0x10032e820 | 0x01 (true) |
| `reveal_main_window` | 0x10032e988 | 0x00 (false) |
| `force_reveal_main_window` | 0x10032f898 | 0x00 (false) |

### dim3 (call-tree)
`WryHandle::clone → atomic_fetch_add ×2 → __rust_alloc(160,8) → anon_1026 vtable ref → send_user_message → [Wry event loop, terminates]`  
Terminated: async fire-and-forget via Wry event loop.

### dim4 (interface / DTO / error / side-effect)
- **Input**: `invoke("focus_main_window")` — no args
- **Output**: `Result<(), tauri::Error>` → resolves `undefined` on Ok
- **Side effects**: Posts WryUserEvent(28, focused=true) → macOS NSApp window focus
- **No file I/O, no network, no persistence**
- **Error path**: atomic ref-count overflow → `__break(1)` abort; send failure → tauri::Error returned

### dim5 (same-platform gate)
All evidence from macOS arm64 IDA decompile. SHA 1db044e8efab. IDB saved.

**gate_tier**: `strictImplementationUse`  
**ceiling**: `strictImplementationUse`

---

## Leaf 2: open_path

**VA**: `0x1002644c0`  
**Module**: `codexmate_lib::commands::system`  
**is_upstream**: true  

### dim1 (CCF / IPC trigger)
- IPC command: `"open_path"` (9 chars, at position 0 in packed table `0x100f2ecf6`)
- IPC dispatcher closure: `0x1003262b8` (run::{{closure}}::{{closure}})
- Parameter: `path: String` (4-char param name `"path"`, confirmed in dispatcher DTO-deserialization at `0x100326338-0x10032633c`)
- dim1 status: **closed**

### dim2 (owner decompile)
Body: Creates `std::process::Command::new("open", 4)` (macOS `/usr/bin/open`), appends `path` arg, calls `Command::spawn`. Returns `Result<_, _>` based on spawn outcome. On failure, closes up to 3 file descriptors (stdin/stdout/stderr) before returning Err.

### dim3 (call-tree)
`Command::new("open") → Command::arg(path) → Command::spawn → [fork/exec /usr/bin/open <path>, terminates]`  
Error branch: `close(fd) ×3 → drop_Command → return Err`  
Terminated: OS-level fork/exec.

### dim4 (interface / DTO / error / side-effect)
- **Input**: `invoke("open_path", { path: String })` — one string arg
- **Output**: `Result<String, String>` (Ok = child handle info; Err = spawn error message)
- **Side effects**: Spawns `/usr/bin/open <path>` → OS opens path with associated application
- **No direct file I/O, no network, no persistence**
- **Security note**: No path validation/canonicalization visible in this function — relies on upstream codex-cli context for allowlist enforcement

### dim5 (same-platform gate)
All evidence from macOS arm64 IDA decompile. SHA 1db044e8efab. IDB saved.

**gate_tier**: `strictImplementationUse`  
**ceiling**: `strictImplementationUse`

---

## Raw evidence paths
- `<source-location>/raw/aimami/1.0.9/macos-arm64/window-path/focus_main_window/leaf.md`
- `<source-location>/raw/aimami/1.0.9/macos-arm64/window-path/open_path/leaf.md`
