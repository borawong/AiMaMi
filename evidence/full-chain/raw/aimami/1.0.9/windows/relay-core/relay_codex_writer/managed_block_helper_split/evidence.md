# managed_block_helper_split_sys — Windows x64 Raw Evidence

**product**: aimami  **version**: 1.0.9  **platform**: windows-x64
**binary SHA**: a5822387fa3f  **session**: win-relay_codex_writer-20260602

## Confirmed

- **Owner**: `managed_block_helper_split_sys` @ `0x1401D6430` (B-level, callee of `managed_block_migration_core_sys`)
- **Signature**: `fn(a1: *mut Result, a2: i64, a3: *const WCHAR, a4: *mut u8, a5: usize)`
  - `a4`/`a5` = content bytes + length
  - `a2`/`a3` = file path (ptr + WCHAR)
- **Newline normalization**: if `a4[len-1] == 0x0A` (newline), copies content as-is to heap buffer; else appends `\n` via `sub_14105D150` (format/append helper)
- **Write**: calls `relay_atomic_write_file_sys @ 0x140332540` with `(a2, a3, content_ptr, content_len)` → atomic file write
- **Return**:
  - `*a1 = 10` → Ok
  - `*a1 = 2, a1[1] = error_code` → Err
- **Drops**: frees temp buffer on both success and error paths
- **Call tree edges**: 9 callees confirmed

## Inferred

- `sub_14008EC00` = Display formatter (used to format content for append path)
- `byte_14126432E` = format spec byte for the newline-append format call

## Unknown

- Whether `relay_atomic_write_file_sys` uses `fs::write` with rename-swap or direct overwrite — separate evidence needed
