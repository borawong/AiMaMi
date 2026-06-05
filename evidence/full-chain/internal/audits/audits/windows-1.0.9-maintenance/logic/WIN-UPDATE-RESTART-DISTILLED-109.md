# WIN Update-Restart Cluster — AiMaMi 1.0.9 Windows x64 — Distilled

**Session**: <audit-session>
**Machine**: <workstation>
**Date**: 2026-06-03  
**SHA12**: a5822387fa3f  
**Gate**: strictImplementationUse (dim1-5 closed; dim6 missing; ceiling = strictImplementationUse)  
**is_upstream**: false (both leaves are source archive-extra, not in upstream codex-cli)

---

## Leaf 1: `graceful_restart_for_update`

### dim1 — Frontend CCF
- File: `assets\index-CL22l5v8.js:86:114912`  
- Wrapper: none (anonymous async closure)  
- Invoke: `await P("graceful_restart_for_update")` — no args  
- Context: OTA update installation completion path — inside `Finished` event handler after download progress tracking; sets state `"installing"`, calls `graceful_restart_for_update`, catches errors and sets `"error"` state.  
- Retained in both 1.0.8 and 1.0.9 Win CCF (not a 1.0.9 addition).  
- Source: `windows-1.0.9-frontend-ccf-bootstrap`

### dim2 — Owner / IDA Decompile
- **Owner**: `auto_switch_multiplex_dispatcher_sys@0x1402663e0` (case 27, len=0x1B)  
- **Dispatcher branch**: `loc_140268A0B` — dispatcher-inline (no separate owner function)  
- The `graceful_restart_for_update` string at `0x141268dcf` is referenced at `0x140268a83` in case 27  
- Dispatch field binding at `0x140268a91`: len=0x1B=27 for `"graceful_restart_for_update"`  
- Managed-state field: `"app"` (AppHandle, 3 chars; not `"repo"`)  
- IDA comment set at `0x140268a0b`

### dim3 — Callees / Call-Tree
```
loc_140268A0B (graceful_restart_for_update dispatcher branch)
  → state_extractor@0x1402dcbc0 (generic managed-state AppHandle resolver)
  → tauri_ipc_resolve_sys@0x140062230 (IPC result dispatch)
     → [ICF-folded] Tauri AppHandle::restart_in_place (inside Tauri runtime, not visible in Win PE)
```
- Depth = 2 visible; Tauri restart leaf is ICF-folded / opaque: **accepted_unknown**  
- The actual process restart semantics are inside Tauri's wry/tao runtime, not decompilable at this layer.

### dim4 — Interface / DTO / Error / Side-Effect
- **Params**: none  
- **Return**: void (IPC result tag=1, built via `tauri_ipc_resolve_sys`)  
- **Error path**: none visible at dispatcher layer (no error branch before resolve)  
- **Side-effect**: Tauri process restart-in-place (app re-launched via OS exec/CreateProcess semantics, Tauri internal)  
- **No source archive custom error message** — errors would be Tauri-level exceptions

### dim5 — Same-Platform Gate
- Windows x64, IDA Pro, IDB `AiMaM 1.0.9 win64.exe.i64`, SHA a5822387fa3f, saved 2026-06-03

---

## Leaf 2: `restart_codex`

### dim1 — Frontend CCF
- File: `assets\index-CL22l5v8.js:86:30953`  
- Wrapper 1: `restartCodex:()=>G("restart_codex")` — no args  
- Wrapper 2: `restartCodexApp` (second wrapper, retained in both 1.0.8 and 1.0.9 Win CCF)  
- Both wrappers invoke `"restart_codex"` with no args.  
- Retained wrapper multiplicity — not a 1.0.9 addition.  
- Source: `windows-1.0.9-frontend-ccf-bootstrap`

### dim2 — Owner / IDA Decompile
- **Owner function**: `restart_codex_cmd_wrapper_sys@0x14026f140`  
- **Range**: `[0x14026F140, +551)` = `[0x14026F140, 0x14026F367)`  
- **Dispatcher**: `restart_codex_cmd_wrapper_sys` is the Tauri command wrapper (dispatcher case 13, len=13 for `"restart_codex"`)  
- Calls `restart_codex_async_wrapper_sys@0x1400a2de0` — decompile complete (A-level)  
- Comment already set at 0x14026f140 and 0x1400a2de0 from prior session (ida-pro-mcp-win 2026-06-02); updated this session.

### dim3 — Callees / Call-Tree
```
restart_codex_cmd_wrapper_sys@0x14026f140
  → restart_codex_async_wrapper_sys@0x1400a2de0
      → signal_codex_quit_wake@0x140254510
          → WakeByAddressSingle(&byte_14187C368) [condvar wake for quit signal]
          → ymmword_14187C370 updated (process name state)
      → quit_codex_wait_fallback_kill_sys@0x140254140
          → force_kill_codex_by_imagename_sys@0x1402507b0 (initial kill attempt)
          → [poll loop: sleep 50ms × timeout_ms/50ms]
          → kill_process_by_name_taskkill@0x1402502e0 (fallback if still running after timeout)
          → timeout=8s (a2=8), mode=0
      → check_update_installability_core_sys@0x140250b80 (scans for update-ready installer)
          → searches LOCALAPPDATA/PROGRAMFILES/PROGRAMFILES(X86) for Codex.exe
          → queries HKCU+HKLM App Paths and Uninstall registry
          → runs powershell/reg commands for installer location
```
- Depth = 4 (cmd_wrapper → async_wrapper → signal+quit+check)  
- Leaves: WakeByAddressSingle (OS condvar), kill_process_by_name_taskkill (taskkill.exe), registry reads  
- All leaves are fs/process/registry — terminates at implementation leaves

### dim4 — Interface / DTO / Error / Side-Effect
- **Params**: none  
- **Return**: void (on success) — the process is killed+restarted, so the IPC response may not be delivered  
- **Error path**:
  - `err=0x8000000000000000` (high bit set) if quit fails or check_update_installability fails
  - Error string: `"CODEX_APP_QUIT_TIMEOUT: Codex did not quit in time; please quit Codex manually and try again"` (92 chars, err code=9)
  - discriminant=10 = success/quit-completed
- **Side-effects**:
  - Sets atomic byte_14187C368 via InterlockedCompareExchange8 (quit signal flag)
  - WakeByAddressSingle on byte_14187C368 (wakes any waiters)
  - Kills Codex process by image name (force_kill_codex_by_imagename_sys)
  - If timeout: kills via taskkill.exe
  - Scans registry and known paths for update-ready installer (check_update_installability_core_sys)

### dim5 — Same-Platform Gate
- Windows x64, IDA Pro, IDB `AiMaM 1.0.9 win64.exe.i64`, SHA a5822387fa3f, saved 2026-06-03

---

## Platform Divergence Note

Both `graceful_restart_for_update` and `restart_codex` were previously closed on macOS arm64 in session <audit-session> (bundle: `audits/macos-1.0.9-maintenance`, leaves: clean/rebuild_registry/load_snapshot — different leaf set).

**Note**: macOS maintenance bundle covers `clean`, `rebuild_registry`, `load_snapshot` — NOT `graceful_restart_for_update` or `restart_codex`. The Windows update-restart cluster is a **new Windows-only closure** for 2 leaves not in the macOS bundle.

Cross-platform comparison for `graceful_restart_for_update` and `restart_codex` macOS:
- macOS has not been separately closed for these two specific leaves in any audit bundle.
- macOS evidence must not be used to prove Windows behavior; Windows evidence must not prove macOS behavior.

---

## Summary Table

| leaf | platform | dim1 | dim2 | dim3 | dim4 | dim5 | dim6 | gate_tier | is_upstream |
|---|---|---|---|---|---|---|---|---|---|
| graceful_restart_for_update | Windows x64 | pass | pass | pass (ICF accepted_unknown) | pass | pass | missing | strictImplementationUse | false |
| restart_codex | Windows x64 | pass | pass | pass (depth≥4) | pass | pass | missing | strictImplementationUse | false |

**ceiling**: strictImplementationUse — dim6 is source archive implementation side, not reverse-pipeline scope.

---

## Evidence Paths
- IDA IDB: `<source-location>/source-binary/AiMaM 1.0.9 win64.exe.i64`  
- Win CCF: `<source-location>/intermediate/aimami/frontend-ccf/windows-1.0.9-frontend-ccf-bootstrap/`  
- Frontend delta: `<source-location>/upstream/aimami/1.0.9/comparison-windows-x64.md`
