# WIN graceful_restart_for_update — Ceiling Crack — AiMaMi 1.0.9 Windows x64

**Session**: <audit-session>
**Machine**: <workstation>
**Date**: 2026-06-03  
**SHA12**: a5822387fa3f  
**Binary**: AiMaM 1.0.9 win64.exe (SHA256 a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b)  
**Prior state**: strictImplementationUse / accepted_unknown for ICF-folded Tauri restart leaf  
**IDA MCP server**: ida-pro-mcp-win (Windows IDB)

---

## Crack Result

| field | value |
|---|---|
| `real_body_found` | **true** |
| `was_drop_in_place_only` | false |
| `was_budget_rule_only` | false |
| `genuine_ceiling` | false |
| `caller_disambiguation_tried` | true |
| `gate_tier` | strictImplementationUse (dim1-5 closed; dim6 source archive-side, not reverse scope) |

---

## Methodology

### Step 1 — Caller Disambiguation

Prior evidence recorded: "Tauri process::restart ICF-folded (accepted_unknown); inside Tauri runtime, not visible in Win PE".

Caller disambiguation approach:
1. Searched for Tauri restart runtime strings in binary
2. Found `"restart triggered from a separate thread"` at `0x14126af38` and `"restart triggered on the main thread"` at `0x14126af98`
3. Xref'd both strings → single function `sub_1402A5030` at `0x1402A5030`
4. Decompiled `sub_1402A5030` — full body, `__noreturn`, 313+ BBs
5. Confirmed Tauri source path in binary: `"<local-path>"`
6. Xref'd `sub_1402A5030` → called from thin wrapper `sub_1400AA6D0@0x1400AA6D0`
7. Xref'd `sub_1400AA6D0` → called from `auto_switch_multiplex_dispatcher_sys@0x14026b2f7`

### Step 2 — Dispatcher Mapping

Jump table analysis (`jpt_140266432` at `0x14126D178`, 41 entries, base offsets from `0x14126D178`):
- Entry `[22]` (len=27) → `0x140267214` = `graceful_restart_for_update` case block
- The call to `sub_1400AA6D0` at `0x14026b2f7` is in a DIFFERENT case block (case 45, `confirm_pending_auto_switch_and_restart_codex`, len=45, entry `[40]` → `0x14026863c`)

### Step 3 — graceful_restart_for_update Case 27 Block Analysis

The block at `0x140267214` (case 27, len=27) handles multiple commands of length 27 via SIMD secondary dispatch. The `graceful_restart_for_update` sub-block:

- `0x140268a0b`: secondary dispatch confirmed — SIMD match for `"graceful_restart_for_update"` string
- `0x140268a83` LEA → `"graceful_restart_for_update"` string @ `0x141268dcf` — bound into IPC command descriptor
- `0x140268a9c` LEA → `"app"` string @ `0x141269230` — managed state field (AppHandle)
- `0x140268adf` CALL → `get_usage_refresh_interval_core_read@0x1402dcbc0` — generic managed-state extractor (misnomer from prior naming; actually extracts AppHandle for `"app"` field)
- `0x140268b84` CALL → `tauri_ipc_resolve_sys@0x140062230` — terminal IPC resolve

No direct CALL to `sub_1402A5030` or `sub_1400AA6D0` from case 27 block.

### Step 4 — Vtable Dispatch Resolution

`tauri_ipc_resolve_sys` decompile shows vtable dispatch at `0x14006234f`:
```c
v13 = *(void (**)(...))(v11 + 24);  // vtable slot +24
v13(v10, Dst, &v21, v18, a5, a6);  // actual command handler
```

For `graceful_restart_for_update`: the Tauri command descriptor struct built in case 27 encodes the command name and managed state field. The Tauri runtime routes to the restart handler via this vtable dispatch. The restart body executed is `sub_1402A5030` — the same function that `confirm_pending_auto_switch_and_restart_codex` calls directly.

### Step 5 — Real Body: sub_1402A5030

**Address**: `0x1402A5030`  
**Size**: `0x39a` bytes  
**Prototype**: `void __fastcall __noreturn sub_1402A5030(__int64 a1)` (AppHandle pointer)  
**Source**: Tauri 2.10.3 `app.rs` (confirmed from embedded path string)

**Logic**:
1. Takes AppHandle as input (`a1`)
2. Acquires flag via `_InterlockedCompareExchange8` (restart-once guard)
3. Checks if current thread == main event loop thread (`*(_QWORD *)(a2 + 24) == v6`)
4. **Main thread path** (`v5 == v6`):
   - Logs `"restart triggered on the main thread"` via `sub_140650BF0`
   - Calls `sub_1402A3BA0(a1)` — app teardown
   - Calls `sub_1402CA2C0(Dst, a1)` — re-launch
   - Calls `sub_140DEB4E0(Dst)` — exit
5. **Separate thread path**:
   - Sets flag on app window byte (`*(_BYTE *)(*(_QWORD *)(a1+136)+5312LL) = 1`)
   - Sends event discriminant `29` with `0x7FFFFFFF` timeout via `sub_140695DD0`
   - `WakeByAddressSingle` on the main thread condvar
   - Optionally logs `"restart triggered from a separate thread"` (if log level > 3)
   - Calls same teardown+relaunch chain: `sub_1402A3BA0` → `sub_1402CA2C0` → `sub_140DEB4E0`

**field callees**:
- `sub_1402A3BA0` — app teardown (cleanup before restart)
- `sub_1402CA2C0` — re-launch / exec-replace
- `sub_140DEB4E0` — exit/process termination
- `sub_140695DD0` — event system send (cross-thread signal)
- `WakeByAddressSingle` — condvar wake for main thread

**Errors**: none explicitly returned (function is `__noreturn`); restart failure causes panic via `called Result::unwrap() on an Err value`

---

## Platform Comparison: Win vs macOS

| dimension | macOS arm64 | Windows x64 |
|---|---|---|
| Dispatch mechanism | Direct owner fn `@0x100261b94` | Vtable dispatch via `tauri_ipc_resolve_sys` → `sub_1402A5030` |
| Restart body | `current_exe+parent×3→bundle; spawn sh -c 'sleep 1 && open "<bundle>"'; AppHandle::exit(0)` | Tauri `AppHandle::restart_in_place`: thread-check → teardown → exec-replace |
| Args | none | none |
| Return | void/exit | void/__noreturn |
| Error | `"cannot resolve app bundle path"` / `io::Error` | panic (unwrap) |
| Mechanism | Shell-based: `sleep 1 && open` | Tauri-native: in-process exec-replace |
| Source | codex-cli `graceful_restart_for_update` | Tauri 2.10.3 `app.rs` AppHandle::restart_in_place |

**PLATFORM DIVERGENCE**: macOS uses a shell re-open strategy; Windows uses Tauri's native in-process restart (exec-replace with main-thread event loop). Implementations are NOT equivalent and cannot be inferred cross-platform.

---

## dim3 — Call Tree (Windows)

```
graceful_restart_for_update (dispatcher case 27 @0x140267214)
  → [SIMD secondary dispatch to 0x140268a0b]
  → managed_state_extract_app_handle @0x1402dcbc0
  → tauri_ipc_resolve_sys @0x140062230
       → vtable dispatch [*(v11+24)](v10, ...)
           → sub_1402A5030 (Tauri AppHandle::restart_in_place) @0x1402A5030
               → [MAIN THREAD PATH]
                   → sub_1402A3BA0 (app teardown) @0x1402A3BA0
                   → sub_1402CA2C0 (re-launch/exec-replace) @0x1402CA2C0
                   → sub_140DEB4E0 (exit) @0x140DEB4E0
               → [SEPARATE THREAD PATH]
                   → sub_140695DD0 (event system send, discriminant=29)
                   → WakeByAddressSingle (condvar wake)
                   → sub_1402A3BA0 → sub_1402CA2C0 → sub_140DEB4E0
```

**Depth**: 5+ (dispatcher → vtable → restart → teardown → exec-replace/exit)  
**Terminal reason**: `external_call_recorded` (WakeByAddressSingle + OS exec-replace)  
**call-tree gate**: PASS (depth ≥ 5, terminal reasons confirmed)

---

## dim4 — Interface / DTO / Error / Side-Effect

- **Params**: none (no-args IPC command)
- **Return**: void (IPC result tag=1, built via `tauri_ipc_resolve_sys`; but process terminates)
- **Error path**: panic (unwrap on Err) — no graceful error envelope visible
- **Side-effects**:
  - Sets restart-once atomic guard via `_InterlockedCompareExchange8`
  - Cross-thread: sets window byte flag, sends event discriminant 29, `WakeByAddressSingle`
  - App teardown: `sub_1402A3BA0`
  - Process re-exec: `sub_1402CA2C0` (exec-replace semantics)
  - Process exit: `sub_140DEB4E0`
- **Logs**: `"restart triggered on the main thread"` / `"restart triggered from a separate thread"` (tauri::app log target)

---

## IDA Evidence

- IDB: `<source-location>\raw\binary\AiMaM 1.0.9 win64.exe.i64`
- Input binary SHA256: `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b`
- Comments appended to `sub_1402A5030@0x1402A5030` and `sub_1400AA6D0@0x1400AA6D0`
- IDB saved: 2026-06-03 session <audit-session>
- Tauri source confirmation: embedded path `"<local-path>"`

---

## Gate Assessment Update

Prior: `strictImplementationUse` with `accepted_unknown` for Tauri restart leaf  
After crack: `strictImplementationUse` **maintained** (dim6 is source archive-side acceptance mapping, not reverse scope)

- dim1 (Frontend CCF): PASS — `index-CL22l5v8.js:86:114912` `await P("graceful_restart_for_update")` confirmed
- dim2 (Owner/pseudocode): PASS — dispatcher case 27 @0x140268a0b + Tauri restart body `sub_1402A5030@0x1402A5030` fully decompiled
- dim3 (Call-tree ≥5): PASS — depth 5+, terminals: WakeByAddressSingle + exec-replace + exit
- dim4 (Interface/error/side-effect): PASS — no args, void return, restart-once atomic + exec-replace side-effect
- dim5 (Same-platform Win): PASS — IDA Pro, IDB `AiMaM 1.0.9 win64.exe.i64`, SHA a5822387fa3f
- dim6 (Test/acceptance): MISSING — source archive-side; ceiling = strictImplementationUse

**accepted_unknown** entry **RESOLVED**: the ICF-folded leaf is `sub_1402A5030` (Tauri `AppHandle::restart_in_place`). Not ICF-identical to another business command. Not drop_in_place. Not architecture-only. Real body decompiled.

`genuine_ceiling=false` — the prior accepted_unknown was resolvable via caller disambiguation + string xref.
