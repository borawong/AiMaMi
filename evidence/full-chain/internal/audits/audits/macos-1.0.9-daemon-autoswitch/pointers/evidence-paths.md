# Evidence Pointers — macos-1.0.9-daemon-autoswitch

所有路径相对于 `<source-location>/`。

## Binary SOT

```
raw/binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi
raw/binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64
```

SHA-256: `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482` (full)
thin-SHA: `985dae00be620b21164b4a8d35cc0379b750d5a6257b25897b0e813441e4d706` (arm64)

## Frontend CCF

```
raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ipc-contracts.jsonl
raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/frontend-control-flow.jsonl
raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ccf-coverage-summary.json
raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/frontend-contract-report.md
raw/aimami/1.0.9/macos/frontend/system-ccf/SYSTEM-FRONTEND-CCF-109.md
raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/index-CL22l5v8.js
raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/maintenance-page-j6kXR210.js
```

## daemon module raw bundles (system/)

```
raw/aimami/1.0.9/macos/system/run_daemon_once/
raw/aimami/1.0.9/macos/system/run_daemon_once/ida/pseudocode/    (IPC + CLI pseudocode)
raw/aimami/1.0.9/macos/system/run_daemon_once/call-trees/run_daemon_once.jsonl
raw/aimami/1.0.9/macos/system/run_daemon_once/validation/result.json

raw/aimami/1.0.9/macos/system/load_bootstrap_state/
raw/aimami/1.0.9/macos/system/load_bootstrap_state/ida/pseudocode/
raw/aimami/1.0.9/macos/system/load_bootstrap_state/call-trees/

raw/aimami/1.0.9/macos/system/start_usage_refresh_watcher/
raw/aimami/1.0.9/macos/system/start_usage_refresh_watcher/ida/pseudocode/
raw/aimami/1.0.9/macos/system/start_usage_refresh_watcher/call-trees/

raw/aimami/1.0.9/macos/system/note_usage_refresh_activity/
raw/aimami/1.0.9/macos/system/note_usage_refresh_activity/ida/pseudocode/

raw/aimami/1.0.9/macos/system/schedule_full_runtime_refresh/
raw/aimami/1.0.9/macos/system/schedule_full_runtime_refresh/ida/pseudocode/

raw/aimami/1.0.9/macos/system/update_usage_refresh_schedule/
raw/aimami/1.0.9/macos/system/update_usage_refresh_schedule/ida/pseudocode/
```

## system other raw bundles

```
raw/aimami/1.0.9/macos/system/check_update_installability/
raw/aimami/1.0.9/macos/system/check_update_installability/ida/pseudocode/0001_check_update_installability_tauri_closure_he40ace9.c
raw/aimami/1.0.9/macos/system/check_update_installability/ida/pseudocode/0002_check_update_installability_platform_impl_h67162043.c
raw/aimami/1.0.9/macos/system/check_update_installability/ida/pseudocode/0003_check_update_installability_platform_is_translocation_h98e6351.c

raw/aimami/1.0.9/macos/system/force_kill_codex/
raw/aimami/1.0.9/macos/system/force_kill_codex/ida/pseudocode/  (4 files: owner + 3 platform helpers)

raw/aimami/1.0.9/macos/system/get_image_compat/
raw/aimami/1.0.9/macos/system/get_image_compat/ida/pseudocode/  (3 files)

raw/aimami/1.0.9/macos/system/get_system_info/
raw/aimami/1.0.9/macos/system/get_system_info/ida/pseudocode/  (4 files: owner + hostname + tauri wrapper + serde)

raw/aimami/1.0.9/macos/system/reset_codex_config/
raw/aimami/1.0.9/macos/system/reset_codex_config/ida/pseudocode/  (5 files)

raw/aimami/1.0.9/macos/system/set_image_compat/
raw/aimami/1.0.9/macos/system/set_image_compat/ida/pseudocode/  (6 files: owner + path + read + write + envelope + wrapper)

raw/aimami/1.0.9/macos/system/confirm_pending_auto_switch/
raw/aimami/1.0.9/macos/system/dismiss_pending_auto_switch/
```

## auto-switch module raw bundles

```
raw/aimami/1.0.9/macos/auto-switch/configure_auto_switch/
raw/aimami/1.0.9/macos/auto-switch/configure_auto_switch/ida/pseudocode/
raw/aimami/1.0.9/macos/auto-switch/configure_auto_switch/call-trees/

raw/aimami/1.0.9/macos/auto-switch/confirm_pending_auto_switch/
raw/aimami/1.0.9/macos/auto-switch/confirm_pending_auto_switch_and_restart_codex/
raw/aimami/1.0.9/macos/auto-switch/dismiss_pending_auto_switch/
raw/aimami/1.0.9/macos/auto-switch/load_pending_auto_switch/
raw/aimami/1.0.9/macos/auto-switch/set_auto_switch/
raw/aimami/1.0.9/macos/auto-switch/start_auto_switch_pending_watcher/
raw/aimami/1.0.9/macos/auto-switch/start_auto_switch_pending_watcher/AI.md   (boot_spawn_proof)
```

## AGENTS.md (raw tier authority)

```
raw/aimami/1.0.9/macos/AGENTS.md
```
