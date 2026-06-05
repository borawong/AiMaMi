# evidence — rollback_threads_for_router (per-thread) (Windows)

**VA**: `0x1403903A0`  
**IDA name**: `rollback_threads_for_router_sys`  
**Binary SHA**: `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b`  
**Size**: ~0xE06 bytes (3590 bytes)  
**Source module**: `codex_thread_visibility.rs`  
**Produced**: 2026-06-02 deep-win phase  

## Confirmed

- VA confirmed via `[thread-rollback] rollout file gone`, `session_meta not found`, `read rollout failed` string xrefs → `0x1403903A0`
- Also: `session_meta changed externally, delegating thread` → `to rollback_router_created_threads` delegation path
- Called from: `rollback_rollouts_in_parallel_sys` (via rayon async wrappers 0x1401AE7B0, 0x1401CE910, 0x14025BA20)
- Args: `(thread_entry_ptr, manifest_a, manifest_b)`
- Algorithm per thread:
  1. Takes lock on shared first_error mutex (spinlock + `_InterlockedCompareExchange8`)
  2. If `*v8 == 10` (already an error): unlocks and skips
  3. Reads rollout file path from thread entry (field `+64` = rollout_path ptr)
  4. Checks rollout file exists (`sub_1403E2EE0`): if file gone → logs `rollout file gone` → skip
  5. Reads session_meta from rollout file (`sub_1403E2EE0`): if not found → logs `session_meta not found` → skip
  6. If `read rollout failed` → skip
  7. Compares current session_meta vs manifest-stored expected value (memcmp on Size bytes)
  8. If matches manifest-stored value: calls `replace_first_session_meta_line_sys` (0x1403E5B10) to restore original
  9. If matches thread entry's externally-changed value: delegates to `rollback_router_created_threads` path (via `sub_14105D540` + `sub_140103580`)
  10. On success: atomically appends result to shared result array (`sub_1411CE2C0` for resize, 56-byte stride result entries)
  11. Increments success counter via `_InterlockedExchangeAdd64`
  12. Emits `rolling_back_threads` progress with current count
- Uses Windows Mutex primitives: `_InterlockedCompareExchange8` / `WakeByAddressSingle` for lock-free coordination
- Error codes: error 9 returned from `replace_first_session_meta_line_sys` = "session_meta changed since migration manifest was created"

## Inferred

- `sub_1403E2EE0` = `read_rollout_first_line_sys` (reads first line of rollout JSON file)
- `sub_14105CEC0` = loads thread's rollout_path string from thread entry struct
- `v64/v65` = path string ptr/len from `sub_14105CEC0`
- Result array uses 56-byte entries (result struct with session_meta snapshot + thread id fields)
- Thread entry struct: `+0` = mutex byte, `+8` = result_vec ptr, `+16` = session_meta ptr/len, `+24` = extra fields

## Unknown

- `sub_140103580` (delegation to rollback_router_created_threads) internal — not decompiled
- Exact condition for the `session_meta changed externally` delegation path vs skip
