# DISTILLED (canonical) — restart_codex_cmd_wrapper (Win x64 1.0.9)

**authoritative**: true
**schema**: restoration.cm.distilled.v1
**session**: <audit-session>
**machine**: <workstation>
**model**: claude-sonnet-4-6
**produced_at**: 2026-06-05
**binary**: AiMaM 1.0.9 win64.exe
**binary_sha256**: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
**binary_size**: 26821632
**binary_format**: pe (x86_64)
**idb**: <source-location>\raw\binary\AiMaM 1.0.9 win64.exe.i64
**owner_va**: 0x14026f140
**addr_verified**: 0x14026f140 (func_query confirmed; unique match `restart_codex_cmd_wrapper_sys`, has_type=true, size=0x223)
**owner_name**: restart_codex_cmd_wrapper_sys
**owner_size**: 0x223 (547 B)
**callees_count**: 9 (all internal)
**gate_tier**: strictImplementationUse
**real_body_found**: true
**genuine_ceiling**: false
**block_decomposed**: false
**accepted_unknown**: false
**recovery_attempts**: N/A — no fake-wall encountered; all 7 taxonomy branches ruled out
**caller_disambiguation_tried**: false (no ICF ambiguity; unique named wrapper)
**dim1_frontend_ccf**: not_verified (win-side frontend lane gap; does not block strictImplementationUse)
**dim2_body**: closed — full decompile at 0x14026f140; synchronous Tauri cmd_wrapper frame; real body is this function, not a shim or drop_in_place
**dim3_callees_xrefs**: closed — 9 callees enumerated; dispatched from Tauri IPC dispatch table at 0x140267513 (dispatch case 13, len=13 'restart_codex')
**dim4_dto_error_side_effects**: closed — see below
**dim5_same_side_gate**: closed — restart_codex_async_wrapper_sys (0x1400a2de0) + quit_codex_wait_fallback_kill_sys (0x140254140) + signal_codex_quit_wake (0x140254510) + check_update_installability_core_sys (0x140250b80) all confirmed on win side

---

## Behavior

`restart_codex_cmd_wrapper` is the **synchronous Tauri IPC wrapper** for the `restart_codex` command (dispatch case 13). It copies the IPC input frame onto the stack, calls the async restart sequence, marshals the result string, and returns the final CoreEnvelope to the IPC layer.

### Overall Sequence

1. **Wrapper frame setup** (0x14026f140): Copies 520-byte `Src` (IPC input) to `Dst` stack buffer; copies 400-byte trailing block to `v14`; extracts three opaque handles (v2/v3/v4) from `Src` at offsets +115*8, +116*8, +117*8.
2. **Calls `restart_codex_async_wrapper_sys@0x1400a2de0`** into `v17[2]` output struct.
3. **Result marshal**: Reads `v17[0]` as discriminant:
   - discriminant == `0x8000000000000000` (err sentinel) → sets `v19 = 6`, skips to string marshal cleanup.
   - discriminant == `0` (ok, empty string) → sets `v19 = 3`, `v21 = 1` (inline/null pointer path).
   - discriminant is valid positive size → allocs heap buf, memcpy result bytes, sets `v19 = 3`, `v20/v21/v22 = size`.
4. **String cleanup** (0x14026f295): calls `sub_140068830` to drop the `v16` copy.
5. **Opaque handle cleanup** (0x14026f2b6): If `v2 > 0`, iterates over `v4` array (v2 entries × 96 bytes each), calling `sub_1400CA020` on each; then frees with `sub_140001370`.
6. **Returns** via `sub_140298200(Dst)` — the CoreEnvelope builder for the IPC response.

### Async Inner Wrapper (`restart_codex_async_wrapper_sys@0x1400a2de0`, 0x17d B)

**Three-phase quit-then-reinstall sequence:**

1. **Signal quit**: `signal_codex_quit_wake@0x140254510` — sends `WakeByAddressSingle` on `byte_14187C368` (quit wake byte) after setting it to 1 via `_InterlockedCompareExchange8`, and broadcasts to any waiting threads; updates `ymmword_14187C370` (global process name/path YMM register).

2. **Wait for quit / fallback kill**: `quit_codex_wait_fallback_kill_sys@0x140254140` (a2=8 seconds, a3=0):
   - If Codex process (imagename "Codex") is running: calls `force_kill_codex_by_imagename_sys@0x1402507b0` first.
   - Then polls every 50ms up to 8 seconds for Codex to exit (`sub_1403FC1C0("Codex", 5)` checking running state).
   - If still running after 8s: calls `kill_process_by_name_taskkill@0x1402502e0` (taskkill fallback).
   - Polls another 5 seconds after taskkill.
   - If still running: returns error string `"CODEX_APP_QUIT_TIMEOUT: Codex did not quit in time; please quit Codex manually and try again"` (92 bytes) with discriminant `9`.
   - If Codex not running at any check point: returns discriminant `10` (Ok).

3. **Check update installability / locate installer**: `check_update_installability_core_sys@0x140250b80` (called only if quit succeeded, discriminant==10):

#### `check_update_installability_core_sys` (0x140250b80, 7637 B, 329 blocks)

Large body — fully disassembled in 1300 instructions. Multi-phase installer location:

**Phase 1 — env-var path scan (10 candidates)**:
Builds an array of 10 (env_var, relative_path) pairs and iterates them:
- `LOCALAPPDATA` + `Programs\Codex\Codex.exe`
- `LOCALAPPDATA` + `Codex\Codex.exe`
- `LOCALAPPDATA` + `Programs\OpenAI Codex\Codex.exe`
- `LOCALAPPDATA` + `Programs\OpenAI\Codex\Codex.exe`
- `PROGRAMFILES` + `Codex\Codex.exe`
- `PROGRAMFILES` + `OpenAI Codex\Codex.exe`
- `PROGRAMFILES` + `OpenAI\Codex\Codex.exe`
- `PROGRAMFILES(X86)` + `Codex\Codex.exe`
- `PROGRAMFILES(X86)` + `OpenAI Codex\Codex.exe`
- `PROGRAMFILES(X86)` + `OpenAI\Codex\Codex.exe`

For each candidate: calls `sub_141044C40` to expand the env var and join with path; if result is not error sentinel, stores path into a growing list.

**Phase 2 — Registry App Paths scan (`reg query /ve`)**:
Iterates 2 registry keys with `reg query <field> /ve`:
- `HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Codex.exe`
- `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Codex.exe`

Uses `sub_14103D7A0` (init cmd builder, "reg"), `sub_14103D680` (append args: "query", field, "/ve"), `sub_141042780` (run, capture stdout). Parses output for `REG_SZ` or `REG_EXPAND_SZ` type string (`sub_1401CD110` comparison), trims trailing `\r\n`, and stores result path.

**Phase 3 — `where Codex.exe` (first pass)**:
Runs `where Codex.exe` via `sub_14103D7A0`("where") + `sub_14103D680`("Codex.exe") + `sub_141042780`. On success stores the path.

**Phase 4 — PowerShell Uninstall registry scan**:
Iterates 2 Uninstall registry keys via `powershell -NoProfile -Command <script>`:
- `HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`
- `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall`

Runs: `powershell -NoProfile -Command <inline_script>` via `sub_14103D7A0`("powershell") + args; the inline script (referenced via `byte_1412662C1` / `sub_14008EC00`) queries the Uninstall registry hive for Codex.exe paths.

**Phase 5 — PowerShell second Uninstall sweep**:
A second powershell pass with `-WindowStyle Hidden` flag (args: `-NoProfile -WindowStyle Hidden -Command <script>`) using `byte_141266248` / `sub_140001000` as script body.

**Phase 6 — `where Codex` (second pass)**:
Runs `where Codex` (without `.exe` extension) as a final fallback.

**Path validation** (`sub_141064DB0`): After each source finds a candidate, validates the path exists and is accessible.

**Result encoding**:
- **Success** (path found): Returns struct with discriminant `9`, length, and heap-allocated path string. The path string is the first valid Codex.exe path found (checked in phase order).
- **Failure** (no path): Writes hardcoded error string `"Codex.exe not found"` (0x13 = 19 bytes) at 0x14025201d–0x140252015 with discriminant `7`.
- **Internal alloc failure**: `sub_14120829B` (OOM abort path at 0x140252A35).

**Error sentinel**: `0x8000000000000000` propagated throughout; any phase returning this discriminant causes inner wrapper to return `*a1 = 0x8000000000000000` immediately.

---

## DTO Summary

**Input**: `Src` pointer to 920-byte IPC input frame (520 bytes data + 400 bytes aux). Offsets +115*8, +116*8, +117*8 hold opaque handles (size count, element stride ref, array ptr).

**Output (CoreEnvelope discriminants)**:
- `discriminant=3` (Ok variant), string payload = located Codex.exe path (heap alloc, size in v20/v22)
- `discriminant=6` (Err variant), empty — returned when `restart_codex_async_wrapper_sys` returns err sentinel `0x8000000000000000`
- Inner path `discriminant=7` = "Codex.exe not found" (19 B literal)
- Inner path `discriminant=9` = `"CODEX_APP_QUIT_TIMEOUT: Codex did not quit in time; please quit Codex manually and try again"` (92 B)

**Side effects**:
- Sends `WakeByAddressSingle` on `byte_14187C368` (quit wake byte, global)
- Updates `ymmword_14187C370` (global process-name YMM slot)
- Sets `byte_14187C368` (quit flag) via `_InterlockedCompareExchange8`
- Calls `force_kill_codex_by_imagename_sys` (taskkill by imagename) and `kill_process_by_name_taskkill` (taskkill /f fallback)
- Runs child processes: `reg query`, `where`, `powershell -NoProfile -Command`, `powershell -NoProfile -WindowStyle Hidden -Command`
- Allocates and frees heap for result string
- Calls `CloseHandle` on up to 5 handles (pipe/process handles from child process runs)

**Error paths**:
- Codex quit timeout (8s + 5s) → Err discriminant 9
- Codex.exe not found after all 6 phases → Ok discriminant 7 with "not found" string
- Any inner phase returning err sentinel 0x8000000000000000 → propagated as discriminant 6

---

## Fake-wall Taxonomy Exhaustion

All 7 taxonomy branches ruled out:

1. **drop_in_place / destructor**: Not applicable — owner is named `restart_codex_cmd_wrapper_sys`, not a Drop impl; real body decompiled fully.
2. **architecture_only / budget rule**: Not applicable — full disassembly obtained in three 500-instruction passes; no budget bail.
3. **async decompile failed**: Not applicable — wrapper is synchronous; async inner (`restart_codex_async_wrapper_sys`) is also fully decompiled (0x17d B, not truncated).
4. **wrong VA / neighbor misidentification**: Ruled out — `func_query` confirmed unique match at 0x14026f140 with correct name; size 0x223 matches decompile range.
5. **vtable / dynamic dispatch**: Not applicable — no trait object dispatch in this call chain; all callees are direct named calls.
6. **HTTP-terminal**: Not applicable — no HTTP transport; side effects are process-level (kill/spawn child processes) not external HTTP.
7. **library internal uninvertible**: Not applicable — `sub_1403FC1C0` and `sub_1402507b0` are AiMaMi-internal functions (not OS library internals); their behavior is recoverable from context and string refs.
