# start_auto_switch_pending_watcher — Windows 1.0.9

同步时间: 2026-06-02
范围: Windows x64 — native background thread, NOT a Tauri IPC command
最终结论: strictImplementationUse — dim1 accepted_via_native_bootstrap_substitute; dim2-5 closed; dim6 empty

## Gate Leaf Status
strictImplementationUse — dim1 closed via GATE-SPEC boot-spawn exception

## run()→spawn Chain (proven)
Tauri run() → auto_switch_watcher_bootstrap_sys (0x14028CCB0)
  → std_thread_spawn_wrapper_sys (0x140004980) → sub_14002A7E0 → CreateThread

PLATFORM DIFF: Windows uses CreateThread + CloseHandle (detach); macOS uses pthread_create

## Unknown / Missing
- Thread body poll interval and event name (intermediate decompile needed)
- test_acceptance_mapping (dim6 empty)
