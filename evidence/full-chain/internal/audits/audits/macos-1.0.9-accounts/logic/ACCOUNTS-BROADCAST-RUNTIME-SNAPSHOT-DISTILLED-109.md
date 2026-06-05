# accounts::broadcast_runtime_snapshot — Deep Recovery DISTILLED
## AiMaMi 1.0.9 · macOS arm64 · session <audit-session>

**Function**: `codexmate_lib::commands::accounts::broadcast_runtime_snapshot`
**VA**: `0x1001e3858`
**Size**: `0x318` (792 bytes)
**Binary SHA256**: `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
**IDB**: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

---

## Confirmed

- **Real body confirmed**: HexRays decompile at `0x1001e3858` returned full synchronous pseudocode. NOT a shim, NOT `drop_in_place`, NOT async state machine.
- **Classification**: Canonical runtime-state-updated event emitter. Shared internal helper, NOT a directly-registered Tauri IPC command. Called by 7 distinct callers.
- **Event name**: `"runtime-state-updated"` (UTF-8 literal at `0x100ee16ed`, length 0x15=21). Verified via `get_string`.
- **Tauri emit path**: `tauri::Emitter::emit::h11205d2efbb959cb` (`0x10034b310`) → `event_name_valid` → `EmitArgs::new` → `Listeners::emit_js_filter` → `Listeners::emit`.
- **DISPLAY_SNAPSHOT_CACHE update**: Mutex-guarded OnceLock at `0x101390058`. On cache init (first call) → `OnceLock::initialize`. Cache present → clone payload from `a2` arg → `memcpy` into global `0x101390070` (680B snapshot struct). Drop old `AppStatusPayload` + `Vec<AccountSummary>` elements before overwrite.
- **Tray menu side-effect**: `refresh_tray_menu_with_snapshot::hcd6a1bc140eadb53` (`0x1003348b4`) called unconditionally after cache update. Rebuilds tray via `create_tray_menu_from_snapshot` → `TrayManager::tray_by_id("mainAiMaMi")` → `TrayIcon::set_menu`.
- **Usage activity side-effect** (conditional): `a4==11 && a3[0..8]=="progressi"[bytes]` → `SystemTime::now` → `SystemTime::duration_since` → 
ote_usage_refresh_activity::h9e2c839aec099000` (`0x100262428`). Updates `qword_101390370` timestamp + condvar 
otify_all` on usage_refresh_watcher_state.
- **Payload type**: `CoreSnapshotPayload` clone; type is `CoreSnapshotPayload` (0x2A8/680B) wrapped in `CoreEnvelope` by callers. Dealloc strides match `AccountSummary` 336B.
- **7 callers** (all verified via `xrefs_to`):
  1. `refresh_full_runtime_snapshot_async::closure` @ `0x1000a3108` (fn `0x1000a2de0`)
  2. `InvokeResolver::respond_async_serialized_inner::closure` @ `0x100108fb4` (fn `0x100108604`)
  3. `InvokeResolver::respond_async_serialized_inner::closure` @ `0x1001275e8` (fn `0x100126f38`)
  4. `InvokeResolver::respond_async_serialized_inner::closure` @ `0x1001297ec` (fn `0x100128c94`)
  5. `refresh_full_runtime_snapshot` @ `0x1001e6ad8` (fn `0x1001e6a1c`) — after `load_full_runtime_snapshot` succeeds
  6. `refresh_usage_snapshot_with_retry` @ `0x1001e7fd0` (fn `0x1001e7eec`) — initial load attempt
  7. `refresh_usage_snapshot_with_retry` @ `0x1001e8120` (fn `0x1001e7eec`) — 200ms retry attempt

---

## Inferred

- **dim1 (frontend CCF)**: No own 1:1 frontend invoke command string. It is an internal emitter called *by* registered IPC commands. Frontend consumes the emitted `runtime-state-updated` Tauri event (listener registered on frontend side). dim1 closed via caller chain — registered commands `refresh_full_runtime_snapshot` + `refresh_usage_snapshot` are the IPC entry points.
- **dim2 (owner pseudocode)**: Full HexRays pseudocode at `0x1001e3858`. Valid. `source=ida`, `source_binary_sha256=1db044e8...`, `status=decompiled`.
- **dim3 (call tree depth)**: 7 callers confirmed + 3 field callees decompiled: `refresh_tray_menu_with_snapshot` (full), 
ote_usage_refresh_activity` (full, already gate-stamped readyToImplement per existing comment), `tauri::Emitter::emit` (full). Depth ≥ 5 edges + terminated_reason: `external_call_recorded(Emitter::emit→Listeners::emit)+side_effect_commit(tray set_menu)+response_serialize(N/A no return value)+error_return(tauri::Error drop on emit fail)`.
- **dim4 (interface/DTO/error/side-effect)**:
  - Input: `(a1: AppHandle ptr X0, a2: &CoreSnapshotPayload X1 implicit sret-like, a3: &str X2/X3, a4: usize X2)` — `a3`/`a4` is the "reason" string slice (e.g. `"progressive"`, 11 bytes).
  - No IPC return value — caller gets `Result<(), tauri::Error>` via `__dst` sret but callers discard it.
  - Side effects: (1) DISPLAY_SNAPSHOT_CACHE global write (mutex guarded), (2) tray menu `set_menu` call, (3) conditional 
ote_usage_refresh_activity` (usage refresh watcher wake), (4) `tauri::Emitter::emit("runtime-state-updated", payload_clone)`.
  - Error: `tauri::Error` on emit (event name invalid OR emit internal fail) → `drop_in_place<tauri::Error>` → result discarded by caller. No panic.
- **dim5 (same-platform gate)**: macOS arm64, IDA native-binary decompile, binary SHA match confirmed.

---

## Unknown

- dim6 (test/acceptance mapping): source archive-side acceptance tests not yet defined for this internal emitter in `ACCOUNTS-ACCEPTANCE-COVERAGE-109.md`. Kept open.
- Windows equivalence: Not investigated in this session. Separate win IDB required.

---

## Gate Assessment

| Dimension | Status |
|---|---|
| dim1: frontend CCF | Closed (via caller chain; no own invoke name) |
| dim2: owner pseudocode | Closed (IDA, 792B, single pass) |
| dim3: call tree ≥5 | Closed (7 callers + 3 callee depths, terminated) |
| dim4: DTO/error/side-effect | Closed |
| dim5: same-platform gate | Closed (macOS arm64 IDA, SHA verified) |
| dim6: test/acceptance | Open |

**gate_tier**: `strictImplementationUse`
**genuine_ceiling**: false
**accepted_unknown**: false
**readyToImplement**: false (dim6 open)

---

## Fake-Wall Taxonomy (per ida-deep-recovery.md §1, all 8 excluded)

1. `drop_in_place/destructor`: EXCLUDED — pseudocode is real logic (OnceLock, clone, memcpy, emit). Not a destructor.
2. `architecture_only/budget_rule`: EXCLUDED — 792B, single decompile pass completed.
3. `async decompile failed (HexRays)`: EXCLUDED — straight-line synchronous Rust, no discriminant switch, no `async_fn_env`, no `::poll`.
4. `wrong_VA (ICF-size guess)`: EXCLUDED — `func_query(0x1001e3858)` → exact demangled `broadcast_runtime_snapshot::he97466b83e71d31c`, one result, no ICF twin.
5. `vtable/dynamic dispatch`: EXCLUDED — all callees direct demangled static symbols, no fat-pointer BL.
6. `HTTP-terminal`: EXCLUDED — no HTTP in this body; `tauri::Emitter::emit` is local process IPC, fully decompiled.
7. `library internal`: N/A — codexmate_lib own code.
8. `body too large`: EXCLUDED — 792B, no chunking required.

**recovery_attempts**: not_needed_no_ceiling. Real synchronous body, no fake walls encountered. IDA decompile returned full pseudocode on first call.

---

## Evidence References

- Owner pseudocode: live IDB session `<audit-session>, fn `0x1001e3858`, size 0x318.
- Event string: `get_string(0x100ee16ed)` → `"runtime-state-updated"` (21B).
- Callee `refresh_tray_menu_with_snapshot`: decompiled `0x1003348b4` (full).
- Callee 
ote_usage_refresh_activity`: decompiled `0x100262428` (full, pre-existing gate readyToImplement).
- Callee `tauri::Emitter::emit`: decompiled `0x10034b310` (full).
- Callee `refresh_full_runtime_snapshot`: decompiled `0x1001e6a1c` (full, confirms broadcast call on load success).
- Callee `refresh_usage_snapshot_with_retry`: decompiled `0x1001e7eec` (full, confirms two broadcast calls: initial + 200ms retry).
- xrefs_to `0x1001e3858`: 7 callers, all code xrefs, confirmed.
- IDB comment appended at `0x1001e3858`, IDB saved.

**Produced**: 2026-06-04 · <workstation> · session <audit-session>
**Source binary SHA**: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482
