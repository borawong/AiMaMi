# DISTILLED: focus_main_window — Windows x64 (1.0.9)

**Generated**: 2026-06-04  
**Session**: <audit-session>
**Machine**: <workstation>
**Owner-gate**: ALLOW (write_mode=owner, basis=index_exact_path)  
**Platform**: windows-x64  
**Version**: 1.0.9

---

## addr_verified

`0x140270d30` confirmed as `focus_main_window_owner_sys` (size 0x34F = 847 bytes, `has_type=true`). Not a shim, neighbor, or drop_in_place. Three-function cluster verified via `func_query`:

| Symbol | Address | Size |
|---|---|---|
| `focus_main_window_core_sys` | `0x140162EB0` | 0x13E |
| `focus_main_window_owner_sys` | `0x140270D30` | 0x34F |
| `focus_main_window_dispatch_sys` | `0x140638240` | 0x147 |

---

## dim1 — IPC Command Binding (Frontend CCF)

IPC command name confirmed via rodata strings:
- `0x141268FCD` → `"focus_main_window"` (command name literal in owner body `0x140270D4B`)
- `0x141269230` → `"app"` (plugin/scope qualifier)

Owner `focus_main_window_owner_sys` is invoked from `auto_switch_multiplex_dispatcher_sys` (`0x1402663E0`, size 0x4F1F) at `0x14026A16B`. It is also registered in two data tables (`0x141578334`, `0x1418A6DDC`).

**dim1 status**: IPC binding confirmed from binary (command name + plugin scope in owner body). Frontend CCF (JS invoke call site) not directly observed — this is a product/frontend-lane gap, not a binary cap.

---

## dim2 — Real Body Decompiled

### Owner: `focus_main_window_owner_sys` @ `0x140270D30`

**This is a synchronous IPC handler body** — not async, no poll/Future state machine. The function is a direct Tauri command handler following the standard `CommandArg` deserialization pattern.

**field flow**:
1. **Input**: `char *Src` — raw Tauri IPC argument buffer (520-byte `Dst` + 400-byte `v15` regions + window manager context fields at offsets 117×8=936 and 920).
2. **Gate check**: calls `get_usage_refresh_interval_core_read(Srca)` at `0x1402DCBC0`. If `Srca[0] == 3` → this is the "interval known / proceed" branch (variant 3 = some interval enum variant).
3. **Branch A** (`Srca[0] == 3` — interval is known): Copies `v23/v24` from snapshot, reads window manager context fields, sets `v22=1`, then calls `tauri_ipc_resolve_sys` directly → **success resolve path**.
4. **Branch B** (`Srca[0] != 3` — interval variant mismatch): Calls `focus_main_window_core_sys` (`0x140162EB0`) via `sub_140162EB0(v19, v14)` to build a window-manager command envelope, then dispatches it. On failure (ref-count overflow or alloc failure): sets error tag `v22 = LOBYTE(v22) = 6` → goes to `LABEL_13` (cleanup + error branch). On success with zero-length payload: resolves with tag 3. On success with payload: calls `sub_140001370` (likely `dealloc`) + resolves.
5. **Cleanup** (`LABEL_14`): iterates over a Vec-like array at `v27` (stride 96 bytes), drops each element via `sub_1400CA020`, then frees backing allocation. Returns `sub_140298200(Dst)` — standard Tauri response cleanup/return.

### Core: `focus_main_window_core_sys` @ `0x140162EB0`

1. Calls `window_manager_snapshot_clone_refcount_sys` (`0x1402D3C90`) to clone + refcount the window manager snapshot from the IPC context (`a2`).
2. `_InterlockedIncrement64` on two ref-count fields (offsets +136, +144 of `a2`).
3. Copies 0xA0 (160) bytes of the snapshot into a heap allocation via `sub_140001360(160, 8)`.
4. Sets vtable pointer `off_141292BC8` and command tag `LOBYTE(Src[0]) = 28` (the `FocusWindow` command discriminant).
5. Calls `focus_main_window_dispatch_sys` (`0x140638240`) with the window manager state, context pointer, and prepared command envelope.
6. If dispatch returns ≠ 18 (not `Ok`): packages error into `Src` and calls `sub_140176BB0` (error propagation).
7. Sets `*a1 = 0x8000000000000000` (None/empty result sentinel) and calls `sub_1400550D0` (release window manager state ref).

### Dispatch: `focus_main_window_dispatch_sys` @ `0x140638240`

1. Gets current thread/runtime handle via `sub_141047E80()`.
2. Compares window handle: `*(Dst[0] + 16)` (current thread window) vs `*(a2 + 32)` (target window handle). **Match** = same-window fast path.
3. **Match branch**: `_InterlockedDecrement64` on thread handle + optional cleanup via `sub_141043000`; copies command envelope; `_InterlockedIncrement64` on two window-state ref-count fields (offsets +24, +80 of `a2`); calls `sub_140638F20(a2+40, Dst)` — the real Tauri WM event dispatch sink; sets `*a1 = 18` (Ok).
4. **Mismatch branch**: Tries `sub_140695DD0` (cross-window dispatch via `PostMessageW`). If `v13[0] != 38` (not the "pending" sentinel): copies error, calls `sub_1406D3A10`, sets result = 3 (error). Else sets result = 18.

---

## dim3 — Callees and XREFs

### Owner callees (`0x140270D30`)
| Callee | Role |
|---|---|
| `memcpy` | arg buffer copy (3×) |
| `get_usage_refresh_interval_core_read` `0x1402DCBC0` | gate: reads refresh interval variant from AppState |
| `focus_main_window_core_sys` `0x140162EB0` | builds + dispatches FocusWindow command |
| `tauri_ipc_resolve_sys` `0x140062230` | IPC success resolve |
| `sub_140001360` | heap alloc |
| `sub_140001370` | heap dealloc |
| `sub_140068830` | error/cleanup helper |
| `sub_1400CA020` | element drop (Vec cleanup, stride 96) |
| `sub_140298200` | Tauri response return/cleanup |
| `sub_14120829B` | alloc failure abort |
| 
ullsub_1` | no-op (compiler artifact) |

### Core callees (`0x140162EB0`)
| Callee | Role |
|---|---|
| `window_manager_snapshot_clone_refcount_sys` `0x1402D3C90` | clone WM snapshot + refcount all sub-arcs |
| `focus_main_window_dispatch_sys` `0x140638240` | WM event dispatch |
| `memcpy` | 0x88 + 0xA0 byte copies |
| `sub_140001360` | heap alloc (160 bytes, align 8) |
| `sub_140176BB0` | error propagation |
| `sub_1400550D0` | release WM state ref |
| `sub_141208281` | alloc failure abort |
| 
ullsub_1` | no-op |

### XREFs to owner `0x140270D30`
- `auto_switch_multiplex_dispatcher_sys` `0x1402663E0` at `0x14026A16B` — the IPC command router calls this handler
- Data: `0x141578334`, `0x1418A6DDC` — vtable/function-pointer table entries (command registration)

### `get_usage_refresh_interval_core_read` (`0x1402DCBC0`)
Reads refresh interval from AppState: calls `get_usage_refresh_interval_repo_snapshot` (`0x1400F61A0`) into a local buffer, copies 0x98 bytes to output, releases several Arc ref-counts. Returns a tagged enum: discriminant 3 = "known interval" → owner takes fast `tauri_ipc_resolve_sys` path.

---

## dim4 — DTO / Error / Side-Effects

### Input DTO
`char *Src` is an opaque Tauri `CommandArg` buffer:
- Bytes 0–519 (0x208): deserialized window manager command args / request payload (copied to `Dst`)
- Bytes 520–919 (0x208–0x397): window manager state snapshot (copied to `v15`, 400 bytes)
- Offset 936 (117×8): window manager Arc pointer (`v28`)
- Offset 920: 128-bit window manager context field (`v27`, Vec of pending tasks, stride-96 elements)

**No user-visible input fields** decoded at this level — the owner handler does not deserialize named JSON fields itself; that is done upstream in the Tauri command router.

### Output DTO
On success (Branch A, `Srca[0]==3`): `tauri_ipc_resolve_sys` is called with:
- tag `v22 = 1`
- `v23` / `v24` from refresh interval snapshot (16 bytes each = two u64-pair fields)
- `&v17` (window context pointer)
- `v15[48]` / `v15[49]` + SHIDWORD — channel/callback handles

On success (Branch B after core dispatch): resolve with tag 3, length `v5`, pointer `v8`.
On error: tag 6 (error sentinel), no payload.

**Effective return type**: Unit/void on the IPC wire — `focus_main_window` is a fire-and-focus command; `tauri_ipc_resolve_sys` with tag=1 signals Ok(()).

### Side-Effects
1. **Window focus**: `focus_main_window_dispatch_sys` → `sub_140638F20` dispatches a `FocusWindow` (discriminant 28) event into the Tauri window manager event loop for the matching window handle. This raises/focuses the main application window to the foreground.
2. **Cross-window path**: If window handles do not match, `PostMessageW` is used to post a custom message to the target window's message queue (`off_141882778[3]` = custom message ID), with fallback to a channel-based dispatch (`sub_140011CC0` or `sub_1407C7850` based on channel type).
3. **Ref-count management**: Multiple `Arc` refcounts incremented/decremented on window manager state. No persistent state mutation — this is a pure window-focus trigger.
4. **No file I/O, no network, no DB writes**.

### Error Paths
| Condition | Behavior |
|---|---|
| `Srca[0] != 3` AND alloc failure (160 bytes) | `sub_14120829B` abort (OOM) |
| Ref-count overflow in `window_manager_snapshot_clone_refcount_sys` | `BUG()` / `__fastfail` |
| `focus_main_window_dispatch_sys` returns ≠ 18 | Error packaged via `sub_140176BB0`, IPC resolves with error |
| `PostMessageW` fails in mismatch branch | `sub_140EED7F0()` (GetLastError), error copied to output |
| `v19[0]` ref-count overflow sentinel | tag 6 error resolve |

---

## dim5 — Same-Platform Gate (Windows x64)

**Confirmed same-platform**: All evidence from `ida-pro-mcp-win` (Windows x64 IDB). `PostMessageW`, `HWND`, `SwitchToThread`, `_mm_pause`, `_InterlockedCompareExchange64` are Windows-only primitives — no macOS equivalents.

**Platform divergence noted**: macOS counterpart uses AppKit `NSWindow` focus/raise mechanism (different dispatch path). Windows uses Win32 `PostMessageW` + custom WM message for cross-window focus, and direct Tauri WM event dispatch for same-window focus.

---

## Fake-Wall Taxonomy Exhaustion

| Fake-wall type | Status | Notes |
|---|---|---|
| `drop_in_place` / async | NOT applicable | Body is synchronous IPC handler, no async state machine, no poll/Future. Owner is `_owner_sys` not a destructor. |
| `architecture_only` / budget bail | NOT applicable | Full body recovered, 847 bytes, decompiled without chunking. |
| `async decompile failed` | NOT applicable | Synchronous function. |
| VA pointing to wrong neighbor | NOT applicable | `func_query` confirmed exact name + address match. |
| vtable / dynamic dispatch | NOT applicable | No trait objects in this handler. Dispatch uses direct call. |
| `HTTP-terminal` | NOT applicable | No HTTP in this function. |
| Library internal | NOT applicable | All callees are named AiMaMi functions or known Tauri runtime primitives. |
| Body too large to chunk | NOT applicable | 847 bytes, fully decompiled in one pass. |

**`accepted_unknown`**: Not required. All dims fully closed.  
**`genuine_ceiling`**: False. No ICF folding ambiguity.  
**`recovery_attempts`**: N/A — no fake walls encountered.

---

## Gate Tier

| Dim | Status | Notes |
|---|---|---|
| dim1 (Frontend CCF) | Partial — IPC name confirmed in binary, JS callsite not observed | Product/frontend-lane gap |
| dim2 (Real body) | CLOSED | Owner + core + dispatch all decompiled |
| dim3 (Callees/XREFs) | CLOSED | All callees identified and field ones decompiled |
| dim4 (DTO/error/side-effect) | CLOSED | Input/output shape, all error paths, side-effects documented |
| dim5 (Same-platform gate) | CLOSED | Windows x64 evidence only; macOS divergence noted |
| dim6 (source archive impl side) | N/A | Producer scope; consumer side |

**`block_decomposed`**: false (synchronous, no async block)  
**`dims_closed`**: 2-3-4-5  
**`gate_tier`**: `strictImplementationUse`  
  - dim2–5 fully closed; dim1 frontend CCF is a product-side gap (not binary cap) and does not block `strictImplementationUse`.  
  - Not `readyToImplement` because dim1 frontend CCF callsite was not directly observed in the binary's frontend bundle.

**`behavior`**: Tauri IPC command `"focus_main_window"` (plugin scope `"app"`). Synchronous handler. Checks refresh interval state; on known-interval branch, resolves immediately with interval snapshot. On other branches, clones the window manager snapshot, builds a `FocusWindow` (discriminant 28) command envelope, dispatches it to the Tauri WM event loop for the matching window handle. Same-window dispatch uses direct event sink; cross-window dispatch uses `PostMessageW` with a custom message. Side-effect: brings the main application window to foreground. No persistent state changes, no I/O.
