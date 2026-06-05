# run_codex_router_diagnostics — Windows Evidence Leaf

**Sync time**: 2026-06-02  
**Binary**: AiMaMi 1.0.9 win64.exe  
**SHA-256**: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b  
**Session**: C-config-passthrough-diag-20260602  
**Platform**: windows-x64  
**Final conclusion**: strictImplementationUse (dim1-5 closed; frontend_ccf pending; response shape needs one more pass)

## Evidence Index

| Artifact | Path |
|---|---|
| Core pseudocode | ida/pseudocode/0001_run_codex_router_diagnostics_core_sys_ha5822387.c |
| Pseudocode manifest | ida/pseudocode-manifest.jsonl |
| Call tree | call-trees/run_codex_router_diagnostics.jsonl |
| Evidence detail | evidence.md |
| Validation | validation/result.json |

## Coverage

- dim1 (frontend CCF): NOT COVERED
- dim2 (owner/pseudocode): ACCEPTED — inline dispatcher@0x14026853d + core@0x140440130 decompiled
- dim3 (call-tree): ACCEPTED — depth 5, terminal sub_14104DEE0 (external_call_recorded)
- dim4 (interface/DTO/error/side-effect): ACCEPTED (manager confirmed; read-only; per-section non-fatal errors)
- dim5 (same-platform gate): ACCEPTED
- dim6 (test/acceptance): NOT COVERED

## Backend Control Flow / Pseudocode / Call-tree

**Owner**: INLINE in `auto_switch_multiplex_dispatcher_sys` @ 0x1402663e0, case @ 0x14026853d  
**Core**: `run_codex_router_diagnostics_core_sys` @ 0x140440130 (358 bytes)

```
auto_switch_multiplex_dispatcher_sys [inline@0x14026853d]
  └─ sub_1400F9FF0           — extract manager handle; failure → error
  └─ run_codex_router_diagnostics_core_sys (0x140440130)
       └─ codex_paths_build_from_env_sys  — ~/.codex/ base path
       └─ codex_paths_join_all_subpaths
       └─ sub_140153300                   — clone relay state (read-only)
       └─ sub_1403A6B60                   — diagnostic runner (reads config sections)
            ├─ sub_14104DEE0              — TERMINAL: file open+read (external_call_recorded)
            ├─ sub_1403C37A0              — section check A
            ├─ sub_1403C3D20              — section check B
            ├─ sub_14038A3F0              — check C
            ├─ sub_14038A5D0              — check D
            └─ sub_1403BFE10              — router state checker
  └─ sub_14029CBB0           — format diagnostics result into IPC response
  └─ tauri_ipc_resolve_sys   — serialize Ok/Err to frontend
```

**Critical distinction**: Does NOT call `quit_codex_wait_fallback_kill_sys` — READ-ONLY; no Codex kill.

## Interface / Error / Boundary

**Args**: manager(internal handle, required)  
**Response Ok** (inferred from formatter):
```json
{
  "sections": [
    { "name": <str>, "status": "ok"|"error"|"warning", "detail": <str|null> }
  ]
}
```
**Side effect**: read-only; reads ~/.codex/ config files; no state mutation; no process kill  
**Error paths**: manager-missing → error; per-section file-read errors → non-fatal, captured per section

## Gate Leaf Status

- **Tier**: strictImplementationUse
- implementation_use: false
- gate_accepted: false

## Unknown / Missing

- Exact section names in diagnostic report (accepted_unknown)
- Response struct shape confirmed from formatter (inferred, not individual field xrefs — accepted_unknown)
- Specific per-section check logic in sub_1403Cxxxx helpers (accepted_unknown)
