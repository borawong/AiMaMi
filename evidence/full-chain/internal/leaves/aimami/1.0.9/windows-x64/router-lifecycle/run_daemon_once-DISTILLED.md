# run_daemon_once — DISTILLED Evidence (Windows x64, v1.0.9)

| field | value |
|---|---|
| session | <audit-session> |
| machine | <workstation> |
| platform | windows-x64 |
| binary | AiMaMi 1.0.9 |
| SHA (IDA comment) | a5822387fa3f |
| audit_stated_addr | 0x140285050 (WRONG — was get_hotspot_enabled_owner_sys) |
| addr_verified | 0x1402843e0 (run_daemon_once_owner_sys, confirmed via func_query + disasm) |
| gate_tier | strictImplementationUse |
| genuine_ceiling | false |
| block_decomposed | false |
| accepted_unknown | false |

## dim1 — IPC / Frontend CCF

- IPC handler name: `"run_daemon_once"` (string literal embedded in owner body at `aRunDaemonOnce`)
- Repo field: `"repo"` (second field-value pair in handler args struct)
- Called from: `auto_switch_multiplex_dispatcher_sys` @ 0x1402663e0, xref at 0x14026a874
- Data table xrefs: 0x14157c2d0, 0x1418a7df0 (vtable/dispatch table entries)
- dim1 frontier CCF (frontend invoke site): not confirmed in this session — Windows binary only; frontend lane gap remains open

## dim2 — Body (synchronous IPC dispatcher)

Three-function chain: `owner_sys → core_impl → core_resolve`

### run_daemon_once_owner_sys @ 0x1402843e0 (0x38f bytes, 32 blocks)

Synchronous Tauri IPC dispatcher. NOT async — no Future/poll state machine. Flow:

1. `sub_1400DA7C0(Dst[64]+16)` — fast-path pre-resolve check (returns non-null if already resolved)
2. If null (not pre-resolved): `sub_1411CE640(v18, v17, &v17[2])` — deserialize IPC params
   - Checks `v18[0] != 6` (success discriminant)
   - On success: calls `run_daemon_once_core_impl(Srca, v2)` with deserialized flag ptr
3. `run_daemon_once_core_resolve(v17, v18)` — serialize result to IPC reply
4. `tauri_ipc_resolve_sys(v13, v15[48], v17, &v19, v15[49], ...)` — dispatch IPC reply
5. Cleanup loop: frees an array of 96-byte structs (`sub_1400CA020`)
6. `sub_140298200(Dst)` — final cleanup/return

Handler args built as field-value slice: `["run_daemon_once", 15, "repo", 4, <Dst>, <&v22>]`

### run_daemon_once_core_impl @ 0x1400a3a40 (0x1081 bytes, 150 blocks)

Core business logic. Windows atomic run-once gate:

```
fn run_daemon_once_core_impl(Dst: *mut u8, Address: *mut i8) -> *mut u8
```

**Run-once atomic gate:**
```c
if _InterlockedCompareExchange8(Address, 1, 0) != 0 {
    // Already running or ran — wait on WaitOnAddress pattern
    sub_141206A60(Address);  // WaitOnAddress-style wait
}
```

**State DB read path (Address[1] == 1 fast path — already done):**
- Constructs poisoned-lock error wrapper
- Calls `sub_14106D750("poisoned lock: another task failed inside", 41, ...)` for panic
- Sets `Dst[0] = 0x8000000000000000` (Ok tag), copies result payload
- `WakeByAddressSingle(Address)` — wakes waiters
- Returns Dst

**State DB read path (Address[1] == 0 — first run):**
1. `sub_14055B4C0(&v58, Address+8)` — acquire RwLock read guard on state DB
2. `sub_14055CFC0(v49)` — read full state snapshot into v49
3. Branch on `*v49[0] == 2` (Ok discriminant):
   - **Ok path**: `sub_140464400(&v67, &v70)` — lock the Ok payload, copy to Dst, `WakeByAddressSingle`
   - **Err path**: branch on `v59` (error flag from deserialized params):
     - **v59 != 0**: `sub_14056B7F0(v49, v22, v19)` — write run-once flag; re-acquire lock; then `sub_1405608F0` or `sub_14055D580`
     - **v59 == 0**: `repository_diagnose_core_impl_sys(v50, v13)` — full repo diagnose; then `sub_14055D580(..., &v61)` — apply pending changes
     - `sub_14055BAC0(v50, N)` — write-back/commit state
     - If result Ok: `sub_140464400` to lock payload, copy to Dst
     - Else: memcpy Dst from v50

**Completion marker:**
```c
flag_ptr[0] = 0;         // clear running flag
flag_ptr[1] = 1;         // set completion flag (if not poisoned)
WakeByAddressSingle(flag_ptr);  // wake all waiters
```

**Cleanup:** `sub_140001370(v60, v66, 1)` — free temp buffer, `sub_1400CA120(v49)` — release state snapshot

### run_daemon_once_core_resolve @ 0x1400723d0 (0x24a bytes, 13 blocks)

Response serializer. Calls `load_bootstrap_state_core_serialize(v15, v12)` on the Ok result. On `*v15 == 0x8000000000000025` (special tag): takes fast path. Else: wraps in display-error struct via `sub_140DE5140`. Always terminates in `tauri_ipc_resolve_sys`.

## dim3 — Callees / Xrefs

### owner_sys callees:
| addr | name | role |
|---|---|---|
| 0x1400DA7C0 | sub_1400DA7C0 | fast-path pre-resolve check |
| 0x1411CE640 | sub_1411CE640 | IPC param deserializer |
| 0x1400a3a40 | run_daemon_once_core_impl | core business logic |
| 0x1400723d0 | run_daemon_once_core_resolve | result serializer |
| 0x140062230 | tauri_ipc_resolve_sys | IPC reply dispatcher |
| 0x1400CA020 | sub_1400CA020 | 96-byte struct destructor (cleanup loop) |
| 0x140298200 | sub_140298200 | Dst final cleanup |
| 0x14120829B | sub_14120829B | OOM panic |
| 0x140001360 | sub_140001360 | alloc |
| 0x140001370 | sub_140001370 | dealloc |

### core_impl callees:
| addr | name | role |
|---|---|---|
| 0x141206A60 | sub_141206A60 | WaitOnAddress-style wait (Windows sync) |
| 0x1412077A0 | sub_1412077A0 | check Tokio runtime context |
| 0x14106D750 | sub_14106D750 | poisoned lock panic helper |
| 0x1412085B0 | sub_1412085B0 | display-error panic |
| 0x141206B20 | WakeByAddressSingle | Windows wake waiters |
| 0x14055B4C0 | sub_14055B4C0 | acquire RwLock read guard (0x141 bytes) |
| 0x14055CFC0 | sub_14055CFC0 | read state snapshot (0x347 bytes) |
| 0x140464400 | sub_140464400 | lock Ok payload |
| 0x1400C8830 | sub_1400C8830 | Err payload cleanup |
| 0x14056B7F0 | sub_14056B7F0 | write run-once flag (0x1d2d bytes) |
| 0x1405608F0 | sub_1405608F0 | process state (0x2818 bytes) |
| 0x14055D580 | sub_14055D580 | apply pending changes (0x6df bytes) |
| 0x14055BAC0 | sub_14055BAC0 | write-back/commit (0x730 bytes) |
| 0x14055DEA0 | repository_diagnose_core_impl_sys | full repo diagnose (0x19bb bytes) |
| 0x14038D350 | sub_14038D350 | score/sort routine |
| 0x1400A4E70 | sub_1400A4E70 | result combiner |
| 0x140047910 | sub_140047910 | completion notifier |
| 0x1400C2560 | sub_1400C2560 | state cleanup |

### core_resolve callees:
| addr | name | role |
|---|---|---|
| 0x140451160 | load_bootstrap_state_core_serialize | serialize bootstrap state |
| 0x140DE5140 | sub_140DE5140 | display-error wrapper |
| 0x1400542A0 | sub_1400542A0 | display-error cleanup |
| 0x140062230 | tauri_ipc_resolve_sys | IPC reply |

## dim4 — DTO / Error / Side-effects

### Input DTO
Struct passed as `Src` (char*), size >= 936 bytes:
- `[0..520)` — first region (memcpy 0x208 bytes → `Dst[0..520)`)
- `[520..920)` — second region (memcpy 0x190 bytes → `v15[0..400)`)
- `[+3A8h]` — qword (v23 = ptr)
- `[+398h..3A8h]` — __int128 (v22 = 16-byte value)
- Handler field-value encoding:
  - key0: "run_daemon_once" (len=15, `0xF`)
  - key1: "repo" (len=4)
  - val0: ptr to Dst (deserialized request params)
  - val1: ptr to &v22 (context/callback ptr)

### Output DTO (Result<T,E>)
Tagged Rust Result written to `Dst[0..168+]`:
- `Dst[0..8]` = `0x8000000000000000` on Ok, different on Err
- `Dst[8..24]` = __int128 payload (Ok value or Err data)
- `Dst[24]` = u8 variant byte
- `Dst[25..29]` = u32 first field
- `Dst[28..32]` = u32 second field
- On Ok from DB: `Dst[8..24]` = v64 (__int128 from lock), `Dst[24..32]` = v65 (qword)

### Run-once flag layout (Address ptr)
```
Address[0]: atomic flag (i8)
  0 = idle/not started
  1 = running (CAS sets this)
  2 = waiter present (WakeByAddressSingle target)
  0 (reset) = done
Address[1]: completion marker (i8)
  0 = not completed
  1 = completed (set after successful run)
Address+8: RwLock guard / state DB handle (used by sub_14055B4C0)
Address+528..536: two qwords (v15[48], v15[49]) — resolve callback ptrs
Address+528+304: two dwords (v15[49].hi/lo) — IPC channel identifiers
```

### Error paths
1. **Poisoned RwLock**: string `"poisoned lock: another task failed inside"` → `sub_14106D750` → panic via `sub_1412085B0` ("a Display implementation returned an error unexpectedly")
2. **Alloc failure**: `sub_140001360` returns null → `sub_14120829B(1)` — allocation OOM panic
3. **DB read error**: `*v49[0] != 2` (Err discriminant) → propagated as Err variant in output DTO
4. **pre-resolve miss + deser error**: `v18[0] == 6` → copies deserialized error payload to Dst + resolve via `tauri_ipc_resolve_sys`

### Side-effects
- Atomic write to flag byte: `Address[0] = 0` (release), `Address[1] = 1` (completion) — idempotent
- `WakeByAddressSingle(flag_ptr)` — unblocks all threads waiting on the daemon-once gate
- If `sub_140047910(Addressa, v76)` called: additional completion notification (Windows only)
- State DB RwLock acquired then released (read-only path doesn't write)
- On dirty/error path: `sub_14056B7F0` writes run-once flag into persistent state
- `sub_14055BAC0` commits state changes (if run)
- No file I/O in owner_sys itself — all state is in-memory RwLock protected struct

## dim5 — Same-side Gate

- **Windows-only** sync primitives: `WakeByAddressSingle`, `_InterlockedCompareExchange8` — not present on macOS path
- `run_daemon_once` on macOS would use a different synchronization primitive (likely `pthread_mutex` or Tokio `OnceCell`)
- No cross-platform gate concerns: this binary is Windows x64 only

## Fake-wall Taxonomy Exhaustion

| fake wall | status | notes |
|---|---|---|
| drop_in_place / destructor instead of async body | NOT APPLICABLE | body is synchronous, no Future/poll state machine |
| architecture_only / budget rule self-limit | NOT APPLICABLE | full decompile succeeded cleanly |
| async decompile failed (HexRays limit) | NOT APPLICABLE | synchronous body, 150 blocks but decompiled fine |
| VA pointing to wrong neighbor | CONFIRMED + CORRECTED | 0x140285050 was get_hotspot_enabled_owner_sys; func_query found true owner 0x1402843e0 |
| vtable / dynamic dispatch | NOT APPLICABLE | no trait objects / vtable dispatch in this path |
| HTTP-terminal / external server | NOT APPLICABLE | local daemon gate, no HTTP |
| reqwest/rustls library internals | NOT APPLICABLE | no network calls |
| body too large (context budget bail) | NOT APPLICABLE | 0x1081 bytes decompiled completely |

recovery_attempts: n/a (no genuine ceiling detected; all fake walls exhausted without finding a real wall)

## Gate Assessment

- **addr_verified**: 0x1402843e0 (not audit-stated 0x140285050)
- **gate_tier**: strictImplementationUse
- **genuine_ceiling**: false
- **block_decomposed**: false (full decompile without chunking)
- **dim1**: frontier CCF not confirmed (Windows binary; frontend lane gap)
- **dim2**: complete — owner_sys + core_impl + core_resolve all decompiled
- **dim3**: complete — all callees enumerated
- **dim4**: complete — input DTO, output DTO (Result tagged union), run-once flag layout, error paths, side-effects
- **dim5**: complete — Windows-only sync primitives identified; macOS counterpart not in scope

Not promoting to readyToImplement because dim1 frontend CCF not confirmed in this session.
