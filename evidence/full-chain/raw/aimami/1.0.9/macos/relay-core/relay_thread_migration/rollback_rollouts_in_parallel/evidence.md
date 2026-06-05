# Evidence: rollback_rollouts_in_parallel (macOS 1.0.9)

## Confirmed

- IDA demangled owner: `codexmate_lib::core::relay::codex_thread_visibility::rollback_rollouts_in_parallel::hde30247ff20adf46`
- VA: `0x10056c984`, size `0x101c`, binary SHA `1db044e8efab`
- Signature: `(result_slot: i64, entries_ptr: i64, entries_len: i64, opt_a: i64, opt_b: i64, opt_c: i64)` → returns `i64` (discriminant in result_slot)
- Source file: `src/core/relay/codex_thread_visibility.rs`
- IDA pseudocode obtained (full body, ~11KB)
- Core dispatch: if `entries_len == 0` → early Ok return with empty HashMap result
- Rayon pool construction: `rayon_core::registry::Registry::new` + `in_worker` for parallel execution over entries slice
- Per-entry work: allocates `48 * entries_len` bytes, fans out to rayon workers
- Each worker calls `replace_first_session_meta_line` (at `0x10056dc48`) for each entry that has a non-zero session meta line length
- Three Mutex-guarded result accumulators (ok-set, ext-changed-set, first-error), each with poisoning check via `unwrap_failed`:
  - `"restored poisoned"` — ok accumulator poisoned
  - `"ext_changed poisoned"` — change-detected accumulator poisoned
  - `"first_error poisoned"` — first-error accumulator poisoned
- On success: writes `*a1 = 10` (Ok) with combined result HashMaps
- On failure: propagates first error via `CoreError` display format
- Rayon pool drop: `<rayon_core::thread_pool::ThreadPool as core::ops::drop::Drop>::drop`
- Arc ref-count decrement on rayon registry after worker completes
- Accumulator layout: HashMap (`hashbrown`) + len counter + parallel slot `Vec<(path_len, path_ptr, orig_len, orig_ptr, target_len, target_ptr)>` (48 bytes each = 6 × i64)
- Calls `find_first_session_meta_line` per entry (before calling replace) to detect staleness
- `std::fs::metadata` used to check file existence before attempting session meta operations

## Inferred

- This is the parallel sub-engine called by `rollback_threads_for_router` when the entry list is non-empty
- The 48-byte entry struct matches `(path: (ptr, len), orig_meta: (ptr, len), target_meta: (ptr, len))` — 6 × 8 bytes
- The parallel loop iterates entries in reverse order (pointer arithmetic: `v54 -= 6` per step, starting from tail)
- `replace_first_session_meta_line` is called with `a6=0` (no staleness-guard override) during the parallel pass
- The non-parallel fallback (when `rayon_core::Registry::new` returns err tag `3`) falls through to sequential loop over entries with same per-entry logic

## Unknown

- Thread count of the Rayon pool (no explicit limit observed; uses default)
- Whether the parallel path is actually exercised in practice vs the sequential fallback
