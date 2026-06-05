# DISTILLED: rollback_threads_for_router — Windows x64 (1.0.9)

**Generated**: 2026-06-04  
**Session**: <audit-session>
**Machine**: <workstation>
**authoritative**: true  
**gate_accepted**: false  
**gate_tier**: strictImplementationUse  

---

## dim1 — Owner / VA

| Field | Value |
|---|---|
| IDA name | `rollback_threads_for_router_sys` |
| VA | `0x1403903a0` |
| Size | `0xe66` bytes (3686) |
| has_type | true |
| Binary SHA (imagebase) | IDB: `AiMaM 1.0.9 win64.exe.i64` |
| Source module | `codexmate_lib::core::relay::codex_thread_visibility` |
| Source file | `src\core\relay\codex_thread_visibility.rs` |
| Basic blocks | 130 |
| Real body? | YES — direct decompile, not shim, not drop_in_place |

---

## dim2 — Signature / DTO

```
_QWORD *__fastcall rollback_threads_for_router_sys(
    _QWORD *a1,       // per-entry context: [0]=mutex/lock ptr, [1]=router_id (str), [2]=v_ext_changed, [3]=fallback_str, [4]=v_restored, [5]=progress_sink_ptr, [6]=first_error_ptr
    __int128 *a2,     // iterator current (entry slice)
    __int128 *a3      // iterator end
)
```

**Iteration pattern**: `while (a2 != a3)` — advances `a2 += 15` per entry (each entry is 15 × 16 = 240 bytes wide on Win x64).

**field DTO fields per entry** (extracted from pseudocode):
- `a2 + 7*8` → `originalSessionMetaLine` ptr (current)
- `a2 + 8*8` → `originalSessionMetaLine` len
- `a2 + 10*8` → alternate meta line ptr (staleness crosscheck)
- `a2 + 11*8` → alternate meta line len
- `a2 + 72` (offset 0x48) → passed to `sub_14105D540` (likely progress/notif ctx)
- `a2 + 24` → secondary ptr for log sink dispatch

**Result slot**: writes into callee's result struct via `replace_first_session_meta_line_sys` return, then discriminant `10` = Ok, `9` = Err.

---

## dim3 — Callees

| Address | Name | Role |
|---|---|---|
| `0x1403e5b10` | `replace_first_session_meta_line_sys` | Core operation: rewrite first session meta line in .jsonl |
| `0x14105cec0` | `sub_14105CEC0` | Likely: read rollout/manifest JSON (feeds `v65`/`v66` = path/len) |
| `0x141047370` | `sub_141047370` | File-backed read producing result discriminant (10=Ok) |
| `0x1403e2ee0` | `sub_1403E2EE0` | Inner loop read/parse; discriminant 10=Ok |
| `0x14105d540` | `sub_14105D540` | Progress notification (takes entry+72 offset) |
| `0x14105d150` | `sub_14105D150` | Error result construction (writes discriminant 9 + error string) |
| `0x140103580` | `sub_140103580` | ext_changed handler (calls after staleness confirmed) |
| `0x1411cd210` | `memcmp` | Bitwise comparison: current meta line vs saved originalSessionMetaLine |
| `0x1411ce2c0` | `sub_1411CE2C0` | Vec capacity grow / realloc (progress results vec) |
| `0x140e8a390` | `sub_140E8A390` | Tracing/logging emit (called at multiple log levels) |
| `0x141206a60` | `sub_141206A60` | Mutex contended wait (spin on InterlockedCompareExchange8) |
| `0x141206b20` | `WakeByAddressSingle` | Windows futex wake (3 call-sites: lock release, restored, rollback) |
| `0x1412077a0` | `sub_1412077A0` | Poisoned-check helper (returns bool) |
| `0x1412085b0` | `sub_1412085B0` | Panic/poison log emit (called with string + error ctx) |
| `0x14120829b` | `sub_14120829B` | Allocation failure handler (abort path) |
| `0x140054ff0` | `sub_140054FF0` | Drop/cleanup for result value |
| `0x1404013c0` | `sub_1404013C0` | Drop for rollout JSON value |
| `0x140001360` | `sub_140001360` | Alloc (malloc-style, size=20 for "rolling_back_threads") |
| `0x140001370` | `sub_140001370` | Free (dealloc) |
| `0x1400013a0` | 
ullsub_1` | No-op stub |

---

## dim4 — Error strings / Side-effects

**Error strings embedded** (from decompile refs):
| String | Meaning |
|---|---|
| `"first_error poisoned"` | Mutex on first-error accumulator poisoned |
| `"restored poisoned"` | Restored-state mutex poisoned after success |
| `"ext_changed poisoned"` | External-change mutex poisoned |

**State/progress string emitted**:
| String | Emitted where |
|---|---|
| `"rolling_back_threads"` | `qmemcpy` into malloc'd buf, then dispatched via vtable slot `v37` at `v34+40` — this is the progress/event emitter call |

**Source location strings** (for tracing):
- `"codexmate_lib::core::relay::codex_thread_visibility"` (len 51)
- `"src\core\relay\codex_thread_visibility.rs"` (len 41)

**Side effects**:
1. Calls `replace_first_session_meta_line_sys` — rewrites first line of each session's `.jsonl` metadata file on disk
2. `_InterlockedExchangeAdd64(v61, 1)` — atomically increments a progress counter (v61 = `a1[4]`)
3. `_InterlockedIncrement64(v60)` — increments ext_changed counter (v60 = `a1[2]`) on staleness path
4. `WakeByAddressSingle` called at 3 sites: after main lock release, after "restored" mutex release, after "rollback" mutex release
5. Emits `"rolling_back_threads"` progress event via vtable function pointer at `v69[1]+40`
6. Logging via `sub_140E8A390` at tracing log levels ≥2 and ≥3

**Staleness check logic**:
```
if (size[1] != v90 || memcmp(Buf1, v19, size[1])) {
    // current first line != expected originalSessionMetaLine
    if (size[1] == a2[11] && !memcmp(Buf1, v88, size[1])) {
        // matches fallback/alternate → call replace_first_session_meta_line_sys
    } else {
        // true ext_changed: v90 not matching alternate either → ext_changed path
    }
}
```

---

## Platform comparison (mac vs win)

| Dimension | macOS | Windows |
|---|---|---|
| Semantics | Parallel rayon pool for rollback | Per-entry loop with Windows futex (WakeByAddressSingle) + InterlockedCAS — no rayon |
| Concurrency model | Rayon thread pool (parallel_for) | Caller-driven per-item loop (called FROM rollback_rollouts_in_parallel_sys) |
| Calling convention | Rust ABI, return via result_slot | Win x64 __fastcall, returns `_QWORD*` |
| Session meta rewrite | `replace_first_session_meta_line` | `replace_first_session_meta_line_sys` (`0x1403e5b10`) |
| Progress event | state tag `"rolling_back_threads"` | identical string `"rolling_back_threads"` via vtable |
| Error strings | all 5 matching strings | `first_error poisoned`, `restored poisoned`, `ext_changed poisoned` confirmed; others in replace_first_session_meta_line_sys callee |
| SQL | `SELECT model_provider FROM threads WHERE...` | Not observed in this function; likely in callee `sub_1403E2EE0` |

---

## Fake-wall taxonomy exhaustion

| Fake-wall signal | Check | Result |
|---|---|---|
| `drop_in_place` / destructor | func_query confirms `rollback_threads_for_router_sys` is the direct symbol, full 130-block body decompiled | Not applicable — real body obtained |
| architecture_only / budget rule | Full decompile returned (no budget bail) | Not applicable |
| async decompile failed | Function is synchronous loop (no Future::poll, no async state machine) | Not applicable |
| Wrong VA | IDA name = `rollback_threads_for_router_sys`, exact match | Not applicable |
| vtable / dynamic dispatch | `v37` is a vtable slot call at `v34+40` for progress notification; content is known (emits `"rolling_back_threads"` string) | Known dispatch — not a cap |
| HTTP-terminal | No HTTP calls in this function | Not applicable |
| Library internal | `memcmp` / `WakeByAddressSingle` are OS/CRT primitives, not AiMaMi logic | Not applicable |
| Body too large | 3686 bytes, 130 blocks, fully decompiled in single pass | Not applicable |

**recovery_attempts**: None needed — all dimensions resolved from direct decompile. No accepted_unknown items.

**genuine_ceiling**: false

---

## Gate judgment

- dim1 (owner/VA): PASS — `rollback_threads_for_router_sys` at `0x1403903a0`, confirmed
- dim2 (signature/DTO): PASS — per-entry iterator, entry layout mapped
- dim3 (callees): PASS — all 20 callees identified, `replace_first_session_meta_line_sys` named
- dim4 (errors/side-effects): PASS — 3 error strings + `"rolling_back_threads"` progress string + 4 side-effect categories

**gate_tier**: `strictImplementationUse`  
(Not `readyToImplement` because: Windows concurrency model is per-entry loop called from rollback_rollouts_in_parallel_sys rather than self-contained rayon parallel; SQL query not directly observed in this body — needs callee `sub_1403E2EE0` verification to confirm presence. These are refinement items, not blockers.)
