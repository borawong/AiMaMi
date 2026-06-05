# Evidence Paths — windows-1.0.9-maintenance

## Binary SOT
- `<source-location>/source-binary/AiMaM 1.0.9 win64.exe.i64`
- SHA256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b

## IDA IDB
- `<source-location>/source-binary/AiMaM 1.0.9 win64.exe.i64`
- saved 2026-06-03 after session <audit-session> angle-3

## Windows Frontend CCF
- `<source-location>/intermediate/aimami/frontend-ccf/windows-1.0.9-frontend-ccf-bootstrap/`
- `frontend/frontend-control-flow.jsonl` line 79 (restart_codex), line 106 (graceful_restart_for_update)
- `frontend/frontend-ccf-quick-evidence.md` confirms both commands

## Frontend Delta Classification
- `<source-location>/upstream/aimami/1.0.9/comparison-windows-x64.md`
- Both commands classified as retained (not 1.0.9-new additions)

## Distilled Logic
- `<source-location>/audits/windows-1.0.9-maintenance/logic/WIN-UPDATE-RESTART-DISTILLED-109.md`

## field IDA VAs (Windows x64)
- graceful_restart_for_update dispatcher branch: 0x140268a0b (inside auto_switch_multiplex_dispatcher_sys@0x1402663e0, case 27)
- restart_codex cmd_wrapper: 0x14026f140
- restart_codex async_wrapper: 0x1400a2de0
- signal_codex_quit_wake: 0x140254510
- quit_codex_wait_fallback_kill_sys: 0x140254140
- check_update_installability_core_sys: 0x140250b80
- tauri_ipc_resolve_sys: 0x140062230
