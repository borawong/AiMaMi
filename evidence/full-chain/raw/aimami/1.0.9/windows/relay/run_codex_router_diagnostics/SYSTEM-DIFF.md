# System Diff — run_codex_router_diagnostics (windows-x64 vs macOS)

## Platform Artifacts

- **Windows**: AiMaM 1.0.9 win64.exe (PE stripped, x64)
- **macOS**: Not analyzed this session

## Frontend IPC / Control-flow

- Windows: NOT COVERED
- macOS: Not analyzed

## Backend Commands / Control-flow / Pseudocode / Call-tree / Leaf

### Windows

| Item | Value |
|---|---|
| Owner pattern | Inline in dispatcher@0x1402663e0, case@0x14026853d (ICF folded; same dispatcher as set_block_official_passthrough) |
| Core | run_codex_router_diagnostics_core_sys@0x140440130 |
| Diagnostic runner | sub_1403A6B60 (reads config sections, runs 5+ checkers) |
| Terminal | sub_14104DEE0 (file open+read, external_call_recorded) |
| NO Codex kill | Confirmed: does NOT call quit_codex_wait_fallback_kill_sys |

### macOS

- Not analyzed; do not infer

## Interface / Error / Boundary

- Arg: manager(internal handle, required)
- Response: sections[] with name/status/detail per section
- Read-only; no state mutation; no process kill

## Gate Leaf

- Windows: strictImplementationUse
- macOS: Unknown

## Resource / Binary Surface

- String "run_codex_router_diagnostics" @ 0x1412690AA
- ICF note: shares dispatcher 0x1402663e0 with set_block_official_passthrough

## Unknown

- macOS behavior (not analyzed)
- Exact section names in response
- Per-section check logic (sub_1403C37A0, sub_1403C3D20, etc.)
