# load_bootstrap_state — Windows x64 DISTILLED

**IPC command**: `load_bootstrap_state`
**Owner VA**: `0x140272e80` (`load_bootstrap_state_owner_sys`, size 0x37f = 895B)
**Core serialize VA**: `0x140451160` (`load_bootstrap_state_core_serialize`, size 0x564 = 1380B)
**Binary SHA**: `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b`
**Platform**: windows-x64
**Version**: 1.0.9
**Session**: <audit-session>
**Gate tier**: strictImplementationUse
**dims closed**: dim2, dim3, dim4, dim5 (dim1 partial — IPC string confirmed via rodata const `"load_bootstrap_state"` @ 0x141268DEA + `"repo"` @ 0x141269220, no frontend CCF file for windows)
**addr_verified**: 0x140272e80 — confirmed via `func_query(name_regex="load_bootstrap_state")`, returns `load_bootstrap_state_owner_sys` at exactly this address. Not a shim, not a drop_in_place. Two related functions: owner_sys @ 0x140272e80, core_serialize @ 0x140451160.
**real_body_found**: true
**genuine_ceiling**: false
**block_decomposed**: false (32 basic blocks, 895B — decompiled directly, no chunking needed)
**recovery_attempts**: N/A — no fake-wall encountered; body fully decompiled and all callees resolved

---

## Behavior

`load_bootstrap_state` is a **synchronous Tauri IPC command** that reads the current auto-switch bootstrap state from a shared lock-based repository and returns it serialized as a JSON response to the frontend. It is the Windows x64 counterpart that populates the frontend's initial state for the auto-switch subsystem.

### Dispatch path

Called from `auto_switch_multiplex_dispatcher_sys` (0x1402663E0) at 0x140269F55. Also referenced in data tables at 0x1415789C4 and 0x1418A6F80. The dispatcher is the central IPC multiplexer for all auto-switch commands on Windows.

### Step-by-step execution (owner_sys @ 0x140272e80)

1. **Arg copy**: `memcpy(Dst, Src, 0x208)` and `memcpy(v15, Src+520, 0x190)` — copies IPC payload blocks into local stack frame.
2. **Logging setup**: Sets up log context strings `"load_bootstrap_state"` and `"repo"` in `v16[]` alongside payload pointers — this is the structured logging/tracing initialization.
3. **State acquire**: `sub_1400DA7C0(Dst[64] + 16)` — acquires/locks the bootstrap state object. This function uses `_InterlockedCompareExchange8` (CAS on byte) to acquire a spinlock, then searches the state hashmap/arena via SIMD xmm comparison to find the state node. Returns null if the state object is not yet initialized.
4. **Null path (state not initialized)**: If the lock returns null, calls `sub_1411CE640(v17, v16, &v16[2])` — this is the serialization/deserialization entry that builds an `Err` result (variant byte `!= 6`). On success (variant == non-error), copies result back, calls `tauri_ipc_resolve_sys` directly and exits.
5. **State found path**: Calls `sub_1400A7360(Srca, state_ptr)` — deserializes/unpacks the raw state into a typed struct (`Srca`). Checks `LODWORD(Srca[0]) == 2` to detect the "Ok(T)" variant of a Rust `Result`.
6. **Result Ok(T) path** (`Srca[0] == 2`): Extracts the inner data: `v4 = Srca[1]` (data ptr), `v5 = Srca[2]` (data ptr2), `v6.hi = Srca[3]` (length). Conditionally allocates heap via `sub_140001360(len, 1)` and copies the payload via `memcpy`. If allocation fails, panics via `sub_14120829B`. After copy, assembles result fields (`v16[1]` variant byte = 3, `v16[2]` = length, `v16[3..4]` = data OWORD).
7. **Result Err path** (`Srca[0] != 2`): `memcpy(v16, Srca, sizeof(v16))` — copies the error result directly.
8. **Error/success serialize**: `sub_140071070(v17, v16)` — serializes the resolved result into IPC response format. Internally copies payload, checks `*a2 == 2` (Ok vs Err discriminant), calls `sub_140453D20` on error path to convert to display string, then calls `tauri_ipc_resolve_sys` with the final response.
9. **Cleanup**: Iterates `v21` count times calling `sub_1400CA020()` on each node (+96 stride), then if `v21` non-zero calls `sub_140001370` to free the array (96 * count bytes, align 8).
10. **Return**: `sub_140298200(Dst)` — returns the IPC handle/envelope.

### core_serialize @ 0x140451160

Builds the JSON wire format of the bootstrap state response. Field sequence confirmed from rodata string literals:

```
{
  "schemaVersion": <a2+160>,   // sub_14041ACD0 — u64/version field
  "success":       <a2+164>,   // sub_140418140 — bool
  "code":          <a2+8..16>, // sub_140420FB0 — integer code
  "message":       <a2+32..40>,// sub_140420FB0 — string message
  "data": {
    "executedAt":              <a2+144>,      // sub_140419B00 — timestamp
    "runOnce":                 <a2+152>,      // sub_140418140 — bool
    "autoSwitchEnabled":       <a2+153>,      // sub_140418140 — bool; sub_140469C70 encodes value @ a2+154
    "activeAccountKey":        <a2+72..95>,   // sub_1404185E0 — string (nullable)
    "switchedAccountKey":      <a2+96..119>,  // sub_1404185E0 — string (nullable)
    "pendingSwitchAccountKey": <a2+120..143>  // sub_1404185E0 — string (nullable)
  }
}
```

Output discriminant: `*a1 = 0x8000000000000025` on success (Ok with content), `*a1 = 0x8000000000000005` on error.

---

## DTO

### IPC input

No structured input payload beyond the standard Tauri IPC envelope — `load_bootstrap_state` takes no explicit arguments. The `Src` parameter is the raw IPC invocation context (payload + invoke handle).

### IPC response (JSON)

```json
{
  "schemaVersion": <u64>,
  "success": <bool>,
  "code": <i32>,
  "message": <string>,
  "data": {
    "executedAt": <timestamp_string_or_null>,
    "runOnce": <bool>,
    "autoSwitchEnabled": <bool>,
    "activeAccountKey": <string_or_null>,
    "switchedAccountKey": <string_or_null>,
    "pendingSwitchAccountKey": <string_or_null>
  }
}
```

All three account field fields (`activeAccountKey`, `switchedAccountKey`, `pendingSwitchAccountKey`) are nullable strings — `sub_1404185E0` handles Option<String> serialization (writes 
ull` JSON literal if absent).

---

## Error paths

1. **State acquire returns null** (not yet initialized): `sub_1411CE640` builds an Err result; if variant byte == 6 (specific error code), the decompiled fast-path extracts the error pointer and falls through to `sub_1400A7360` for full deserialization. If variant != 6, the result is resolved directly via `tauri_ipc_resolve_sys`.
2. **Result::Err from state read** (`Srca[0] != 2`): Error content copied directly into `v16`, serialized by `sub_140071070` which calls `sub_140453D20` to format display string, then resolved via IPC.
3. **Allocation failure** (heap alloc returns null for payload copy): `sub_14120829B(1)` — Rust panic handler, process terminates.
4. **core_serialize error**: On any serialization sub-call failure (bool=non-zero return), jumps to `LABEL_4` → `sub_141204520()` (gets last error) → frees heap buffer → sets error discriminant `*a1 = 0x8000000000000005`.

---

## Side effects

- **Read-only**: Acquires and immediately releases the bootstrap state spinlock (CAS byte acquire, releases at end of `sub_1400DA7C0` via `WakeByAddressSingle` if needed). No state mutation.
- **Heap alloc/free**: Temporary allocation for payload copy during deserialization (freed in cleanup loop). Also allocates 128-byte JSON output buffer in `core_serialize` (freed on error path).
- **IPC resolve**: Calls `tauri_ipc_resolve_sys` exactly once (either in fast path or via `sub_140071070`) — resolves the pending IPC promise with the response.
- **No file I/O, no network, no DB write.**

---

## Same-side gate (dim5)

Caller: `auto_switch_multiplex_dispatcher_sys` @ 0x1402663E0 — same Windows x64 binary. No cross-process or cross-machine IPC. State is held in-process in the spinlock-guarded repository arena. This is a pure in-process read query.

---

## Fake-wall taxonomy exhaustion

| Fake wall | Status | Notes |
|---|---|---|
| `drop_in_place` / destructor confusion | Not applicable | Owner `load_bootstrap_state_owner_sys` is not a drop/destructor — confirmed by `func_query` name match |
| `architecture_only` / budget rule | Not applicable | 895B body decompiled completely in one pass |
| `async decompile failed` | Not applicable | This is a synchronous IPC handler, not async — no Future/poll involved |
| Guessed wrong VA / neighbor | Not applicable | `func_query` returns exact match at 0x140272e80 |
| vtable / dynamic dispatch | Not applicable | No trait objects in dispatch path; direct calls only |
| `HTTP-terminal` | Not applicable | Pure in-process read, no HTTP |
| Library internal vs config callsite | Not applicable | `sub_1400DA7C0` (state acquire) fully decompiled; CAS + SIMD hashmap lookup confirmed |
| Oversized body | Not applicable | 32 blocks, full decompile succeeded |
