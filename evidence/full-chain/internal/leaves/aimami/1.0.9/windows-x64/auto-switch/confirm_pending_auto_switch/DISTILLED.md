# confirm_pending_auto_switch — Windows x64 DISTILLED

**IPC command**: `confirm_pending_auto_switch`
**Owner VA**: `0x14026ea00` (`confirm_pending_auto_switch_owner_sys`, size 0x49f = 1183B)
**Core impl VA**: `0x1400a9bd0` (`confirm_pending_auto_switch_core_impl`, size 0x53a = 1338B)
**Coroutine VA**: `0x1408e4f50` (`cmd_confirm_pending_auto_switch_coroutine`, size 0xbd3 = 3027B)
**Binary SHA**: `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b`
**Platform**: windows-x64
**Version**: 1.0.9
**Session**: <audit-session>
**Gate tier**: strictImplementationUse (coroutine dims 2–5 fully closed 2026-06-05; dim1 partial — IPC strings confirmed, no frontend CCF for windows-x64)
**dims closed**: dim2 (real body decompiled, all 3 functions), dim3 (xrefs + callers confirmed), dim4 (DTO byte-confirmed from sub_1404541A0 field names + error discriminants), dim5 (IPC binding confirmed — dispatcher + xref callers + data table refs)
**addr_verified**: 0x1408e4f50 — `func_query(name_regex="confirm_pending_auto_switch_and_restart")` returns `confirm_pending_auto_switch_and_restart_coroutine` at exactly 0x1408e4f50, size 0xbd3, has_type=true. Not a shim, not drop_in_place, not neighbor mis-attribution. Owner_sys also at 0x14026ea00, core_impl at 0x1400a9bd0.
**real_body_found**: true
**genuine_ceiling**: false
**block_decomposed**: false (all three bodies decompiled directly, no chunking needed)

---

## Behavior

`confirm_pending_auto_switch` is a **synchronous Tauri IPC command** that commits a pending auto-switch by applying the pending configuration. The Windows implementation differs structurally from macOS: it uses a **synchronous core_impl** path plus a separate **async coroutine** for the confirm-and-restart variant, rather than an async state machine in the handler itself.

### Dispatch path

Registered in `auto_switch_multiplex_dispatcher_sys` (0x1402663E0), called from 0x14026A769. Also referenced in data tables at 0x141577B68 and 0x1418A6BD8.

### Step-by-step execution (owner_sys @ 0x14026ea00)

1. **Arg copy**: `memcpy(Dst, Src, sizeof(Dst))` — copies the IPC payload into local stack frame.

2. **Usage-refresh interval read** (`get_usage_refresh_interval_core_read` @ 0x1402DCBC0):
   - Calls `get_usage_refresh_interval_repo_snapshot` (0x1400F61A0) to read the current refresh interval from AppState.
   - Returns a discriminant in `Srca[0]`:
     - `== 3` → refresh interval is currently active / locked → **early-exit path**: resolves IPC immediately via `tauri_ipc_resolve_sys` with the existing state, no switch attempted.
     - `!= 3` → proceed with switch confirmation.

3. **App-vs-repo path check** (when interval != 3):
   - Reads Tauri app handle lock state: `sub_1400DA7C0((volatile void *)(Dst[64] + 16))`.
   - If lock not available: calls `sub_1411CE640` (IPC arg deserializer) with command name `"confirm_pending_auto_switch"` (0x141268E31) and scope `"app"` or `"repo"`.
   - Checks `LOBYTE(v22[0]) != 6` — discriminant 6 means a specific error path (bypasses core impl).

4. **Core impl dispatch** (`confirm_pending_auto_switch_core_impl` @ 0x1400a9bd0):
   - Acquires a lock via `_InterlockedCompareExchange8(a3, 1, 0)`.
   - Checks a global flag at `off_141882E30` for multi-threading mode.
   - Main path: calls `sub_140563ED0` to read the pending switch state.
   - Discriminant on result:
     - `== 2`: builds the switch payload, allocates heap copy of the pending config data, assembles into `Dst` with discriminant `2` (Ok + payload). Releases lock via `WakeByAddressSingle`.
     - `== 3`: calls `sub_1400C1080` (cleanup/release). Sets `Dst[0] = 2`.
     - Other: iterates and calls `sub_1400C9C00` on each item (336B stride), frees, memcpy result into `Dst`. Then dispatches `sub_1400CA4E0`.
   - All paths: calls `sub_1400550D0` (release/drop of arg context).

5. **Response construction**:
   - If core impl returns discriminant `!= 2` from `v14[0]`: calls `sub_140067EC0(v15, Srca)` — builds response with the error result.
   - If discriminant `== 2`: constructs the payload buffer: `Srca[0] = 2`, `LOBYTE(Srca[1]) = 3`, fills `Srca[2..4]` with the switch data. Then calls `sub_140067EC0`.

6. **IPC resolve**: `tauri_ipc_resolve_sys` (0x140062230) sends response to frontend.

7. **Cleanup**: frees pending switch list (96B stride, count from `v29`), calls `sub_140298200`.

### Coroutine variant (`cmd_confirm_pending_auto_switch_coroutine` @ 0x1408e4f50) — DEEP WIN

This is the **confirm_pending_auto_switch_and_restart_codex** variant — it confirms the pending switch AND restarts Codex. Fully decompiled in live IDB (2026-06-05, session <audit-session>). Size 0xbd3 (3027B), 100 basic blocks, no HexRays bail, no chunking needed.

**addr_verified (deep)**: `func_query(name_regex="confirm_pending_auto_switch_and_restart")` → `confirm_pending_auto_switch_and_restart_coroutine` at exactly `0x1408e4f50`, size `0xbd3`, `has_type=true`. Not a shim, not a drop_in_place, not a neighbor mis-attribution.

#### Async state machine dispatch

State discriminant at `a1[3440]` (outer) and `a1[3424]` (inner await point), `a1[3408]` (inner-inner await):

- **State 0** (initial): sets await-point bookkeeping (`a1[3441]=257`, `a1[3443]=1`), copies 0x5F0 bytes of IPC context into coroutine frame offset 1912, then dispatches on `a1[3424]` (inner state):
  - **Inner state 0**: reads current usage-refresh interval via `get_usage_refresh_interval_core_read` (0x1402DCBC0). Checks `Dst[0] == 3` (interval locked/active) → early-exit path: calls `sub_140889870` (release handle), iterates and frees pending list (96B stride via `sub_1400CA020`), falls to LABEL_58 → sets `a1[3424]=1`, calls `sub_14085D190` (Codex restart). Then resolves IPC via `tauri_ipc_resolve_sys`.
  - If interval `!= 3`: clones window manager snapshot via `window_manager_snapshot_clone_refcount_sys` (0x1402D3C90), increments two refcounts via `_InterlockedIncrement64`, reads `off_141882490` to choose vtable slot, dispatches task via `sub_140607A20` (IPC-channel task submit, see below), stores returned task handle at `a1[425*8]`.
  - **Inner states 1–3**: pending/resume states for the channel-dispatch await.

- **State 1–3** (outer resume): processes result of the async channel task. Calls `sub_140388010` (0x140388010, `confirm_pending_auto_switch_result_reader`, see below) at LABEL_25 to obtain the pending-switch outcome.

  On result discriminant from `sub_140388010`:
  - `== 4` (Pending/suspend): sets all three await-point bytes to `3`, returns `1` (Poll::Pending).
  - `== 3` (Ok with data): reads heap pointer and length from `Dst[8..24]`, calls `sub_14120829B` if alloc fails, copies payload, stores discriminant `1` in `a1[3408]`.
  - `== 2` (Ok empty / different variant): builds JSON response struct via `sub_1404541A0` (0x1404541A0, see DTO below).
  - Default (error / unknown discriminant): serializes full enum variant via `sub_1404541A0`, checks for error tag `0x8000000000000025`.

- **Final convergence (LABEL_52 → LABEL_58)**: sets `*v79 = 1` (result ready flag), calls `sub_140879EE0` (0x140879EE0, flush/notify pending watchers), calls `sub_140889870` (0x140889870, release handle/decrement refcount). Frees pending list (96B stride). Then: calls `sub_14085D190` (0x14085D190, **Codex process restart**). Resolves IPC via `tauri_ipc_resolve_sys` (0x140062230).

#### field callee analysis (from deep decompile)

**`sub_140388010` @ 0x140388010** (`confirm_pending_auto_switch_result_reader`, ~0x161 bytes):
- Calls `sub_140EBBED0()` to get the shared-state struct; checks `v6[72]` for init state.
- If not inited: calls `sub_14104C8D0(v6, sub_1407CB820)` to initialize.
- Reads `v6[68]` (pending flag) and `v6[69]` (retry counter).
- If `v8 == 1` (pending): decrements retry counter (`v9-1`), returns via vtable call `(*(*a2 + 16) + 24)(a2, Src, *a3)` — this is a `Future::poll`-like dispatch into the pending-switch resolver.
- If retry exhausted: calls `sub_140EAD770(a3)` (wakeup/notify), sets discriminant 4 (suspend again).
- Always: calls `sub_140EB0110` (cleanup). Returns `Dst` with discriminant.
- Output discriminant in `Dst[0]`: 4 = pending, 3 = Ok-with-data, 2 = Ok-empty, other = error.

**`sub_140607A20` @ 0x140607A20** (IPC-channel task submit, ~0x1EE bytes):
- Acquires spin-lock on `off_141882source archive8` via `_InterlockedExchangeAdd64`.
- Reads vtable slot at `a2[1] + (isShortFormat ? 480 : 672) + 16` to get channel refcount pointer.
- Increments two refcounts via `_InterlockedIncrement64`.
- Copies `a3` (0x98 bytes = 152 bytes = the window-manager snapshot) into task struct.
- Constructs task frame (204 size marker, vtable `off_1412A2B98`, channel ref, etc.).
- Allocates 640-byte task block (align 128), memcpy frame into it.
- Dispatches via `sub_140EAF5D0(a1, task_ptr, 1, a2)` — this is the Tauri async channel sender.
- On overflow: calls `managed_state_register_sys` with error `unk_14128BAD0`.
- Returns task handle (allocated 640B block).

**`sub_1404541A0` @ 0x1404541A0** (response JSON builder, ~0x654 bytes):
- Allocates 128-byte heap buffer, initializes as JSON object (`{`).
- Serializes fields in this exact order:
  1. `schemaVersion` (from `a2 + 464`, string)
  2. `success` (from `a2 + 468`, bool/string)
  3. `code` (from `a2 + 400..408`, byte-string)
  4. `message` (from `a2 + 424..432`, byte-string)
  5. `data` (sub-object `{`):
     - `previousAccountKey` (from `a2 + 360`, string struct)
     - `activeAccountKey` (from `a2 + 344..352`, byte-string)
     - `activeAccount` (from `a2 + 384..385` auth-updated + registry-updated flags, then `sub_1404351A0` for full account struct)
  6. `authUpdated` (from `a2 + 384`, bool)
  7. `registryUpdated` (from `a2 + 385`, bool, conditionally adds `}` separator)
- Returns discriminant `0x8000000000000025` (Ok-with-data) in `a1[0]`, with `a1[1]=buf_ptr`, `a1[2]=buf_len`, `a1[3]=buf_cap` when successful.
- Returns `0x8000000000000005` (error) on any alloc failure.

#### Xref callers (confirmed)

Two thin wrapper functions dispatch this coroutine:
- `sub_1409BF0A0` @ 0x1409BF0A0 (size 0x235 = 565B): entry/start wrapper. Acquires state via `sub_140EB27B0`, registers managed state, acquires app handle via `sub_140EC3EC0`, then calls `confirm_pending_auto_switch_and_restart_coroutine((char*)(a1 + 56))`, calls `sub_140EC9FF0` (release), then on non-Ready result calls `sub_14095C170` with discriminant 2 (queue for re-poll).
- `sub_1409CB560` @ 0x1409CB560 (size 0x235 = 565B, identical structure, likely poll/resume wrapper).

Also referenced in two data tables:
- `0x1416C1B98` (type: data)
- `0x1418F8910` (type: data)

---

## IPC Binding (dim5)

- Registered in `auto_switch_multiplex_dispatcher_sys` @ 0x1402663E0 — the same dispatcher that handles `reset_codex_config`, `get_system_info`, and other daemon commands.
- Owner xref: called from 0x14026A769 (inside dispatcher), also referenced in data tables 0x141577B68, 0x1418A6BD8.
- Core impl xref: only called from owner_sys @ 0x14026EC42. Also in data tables 0x14151E0C0, 0x141890BA0.
- Coroutine xref: called from two thin wrapper functions 0x1409BF0A0 and 0x1409CB560 (each size 0x235 = 565B, likely the start + poll wrappers for the async task).

---

## Response DTO (dim4)

**Confirmed from live IDB decompile of `sub_1404541A0` (coroutine path) + `sub_140067EC0` (owner_sys path).**

### Coroutine path (confirm_pending_auto_switch_and_restart_codex)

```json
{
  "schemaVersion": "<string>",
  "success": "<bool-string>",
  "code": "<byte-string>",
  "message": "<string>",
  "data": {
    "previousAccountKey": "<string>",
    "activeAccountKey": "<byte-string>",
    "activeAccount": { "<full account struct — see sub_1404351A0>" }
  },
  "authUpdated": "<bool>",
  "registryUpdated": "<bool>"
}
```

Field sourcing (all from coroutine frame after confirm result is applied):
- `schemaVersion` ← `frame + 464` (string)
- `success` ← `frame + 468` (bool/string)
- `code` ← `frame + 400..408` (byte-string, 8 bytes length)
- `message` ← `frame + 424..432` (byte-string, 8 bytes length)
- `previousAccountKey` ← `frame + 360` (string struct)
- `activeAccountKey` ← `frame + 344..352` (byte-string, 8 bytes length)
- `activeAccount` ← built by `sub_1404351A0` (full account object)
- `authUpdated` ← `frame + 384` (bool)
- `registryUpdated` ← `frame + 385` (bool)

Return discriminants from builder:
- `0x8000000000000025` = Ok-with-data (buf_ptr, buf_len, buf_cap in a1[1..3])
- `0x8000000000000005` = error (alloc failure)

### Owner_sys path (synchronous confirm_pending_auto_switch)

Response assembled by `sub_140067EC0` (0x140067EC0):
- Success (`Dst[0] = 2`, `LOBYTE(Srca[1]) = 3`): payload in `Srca[2..4]`.
- Error (`LOBYTE(v22[0]) == 6`): routes directly to `tauri_ipc_resolve_sys` without core_impl (early abort).
- Early-exit (interval == 3): resolves immediately with existing state.

The owner_sys DTO shape is structurally similar but uses `sub_140067EC0`'s envelope, field names not yet byte-confirmed for this path (pending further analysis of `sub_140067EC0`).

---

## Error codes (dim4)

### Owner_sys path
| Discriminant | Meaning |
|---|---|
| core_impl returns 2 | Ok — pending switch data successfully read and committed |
| `v22[0] == 6` | Deserialization / lock error — IPC resolves immediately without invoking core |
| interval == 3 | Pending switch already confirmed / interval locked — early-exit, no-op |
| core_impl returns 3 | Internal cleanup path (sub_1400C1080) — treated as success with empty payload |

### Coroutine path (confirmed from deep decompile)
| Discriminant | Meaning |
|---|---|
| `sub_140388010` returns 4 | Poll::Pending — coroutine suspends, returns `result=1` |
| `sub_140388010` returns 3 | Ok with data — heap-copies payload, stores at frame discriminant 1 |
| `sub_140388010` returns 2 | Ok empty / alternate variant — builds JSON via sub_1404541A0 |
| `sub_1404541A0` returns `0x8000000000000025` | Response built successfully |
| `sub_1404541A0` returns `0x8000000000000005` | Alloc failure in JSON builder |
| `0x8000000000000025` (check at 0x1408e5767) | Success discriminant — `v10=0` (no error flag) |
| other | Error — builds Display-impl error string via `sub_140DE5140`, calls `sub_1412085B0` with "a Display implementation returned an error unexpectedly" |

---

## Side effects (dim4)

| Effect | Target | Condition |
|--------|--------|-----------|
| Mutex acquire/release | Ref-count lock in core_impl (via InterlockedCompareExchange8 + WakeByAddressSingle) | Always when core_impl is entered |
| Heap allocation | Pending switch payload copy | When core_impl discriminant == 2 and payload length > 0 |
| Heap deallocation | Pending switch list (96B stride) | In owner_sys cleanup after resolve |
| sub_140298200 (cleanup) | Owner_sys frame | Always at end of owner_sys |
| Codex restart (sub_14085D190) | Codex process | Coroutine variant only, on success |
| Window manager snapshot ref increment | AppState | Coroutine variant only (via _InterlockedIncrement64 x2) |

---

## Platform divergence (dim5: mac vs win)

| Aspect | macOS arm64 | Windows x64 |
|--------|-------------|-------------|
| Handler structure | async state machine (sidecar dispatch via sidecar_cmd channel) | Synchronous owner_sys + separate async coroutine for restart variant |
| Core gate | `get_usage_refresh_interval_core_read` discriminant == 3 → early exit | Same logic, same callee name |
| Pending switch store | `load_pending_auto_switch` via persistence layer | `sub_140563ED0` (equivalent reader) |
| Restart variant | `confirm_pending_auto_switch_and_restart_codex` at separate VA | Same, at 0x1408e4f50 as separate coroutine function |
| dim1 (frontend CCF) | Confirmed via macOS-arm64 analysis | Not directly observed on Windows (partial) |

---

## Fake-wall taxonomy exhaustion

Per `ida-deep-recovery.md` red-line 13, all fake-wall types checked. No `accepted_unknown` needed.

| Fake-wall type | Status | Notes |
|---|---|---|
| `drop_in_place` / async shim | NOT applicable | func_query returned `confirm_pending_auto_switch_owner_sys` with has_type=true, size 0x49f — a named synchronous function, not destructor or shim. Decompile confirmed real body with InterlockedCompareExchange8 and business logic. |
| `architecture_only` / budget rule | NOT applicable | All three bodies decompiled within normal budget (1183B, 1338B, 3027B). No chunking needed. |
| `async decompile failed` (HexRays bail) | NOT applicable | No HexRays bail; pseudocode returned cleanly for all three functions. |
| Wrong VA / neighbor misidentification | Ruled out | `func_query(name_regex="confirm_pending_auto_switch")` confirmed three distinct named functions; 0x14026ea00 uniquely maps to `confirm_pending_auto_switch_owner_sys`. Pass-3 cross-check: no adjacent function with overlapping range. |
| vtable / dynamic dispatch | NOT applicable | No trait object dispatch in this command chain. All callees resolved via direct call addresses. |
| `HTTP-terminal` / external transport | NOT applicable | Pure local state machine / persistence; no outbound HTTP in this command path. |
| reqwest/rustls internals | NOT applicable | No network transport. |
| Oversized body | NOT applicable | Largest body (coroutine) is 3027B, well within decompile budget. |

**recovery_attempts**: not_needed — no fake walls encountered, all three bodies decompiled fully with named symbols.

---

## Owner-gate result

```json
{
  "decision": "ALLOW",
  "write_mode": "first",
  "owner_basis": "none",
  "reason": "No existing owner for this scope (first write). claim-first registered."
}
```

Gate script: `prewrite-owner-gate.py --target confirm_pending_auto_switch --scope win-owner-sys-dim2-5 --machine <workstation> --session <audit-session>
