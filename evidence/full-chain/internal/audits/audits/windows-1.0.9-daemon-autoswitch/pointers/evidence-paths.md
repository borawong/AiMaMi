# Evidence Paths — windows-1.0.9-daemon-autoswitch

所有路径相对 `<source-location>/`

## Windows Binary SOT

```
raw/binary/AiMaM 1.0.9 win64.exe
raw/binary/AiMaM 1.0.9 win64.exe.i64
```

SHA-256: `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b`

## Daemon Raw Bundles (Windows x64)

```
raw/aimami/1.0.9/windows/daemon/run_daemon_once/
  manifest.json
  ida/pseudocode/0001_run_daemon_once_owner_sys_a3a40.c
  ida/pseudocode/0002_run_daemon_once_core_resolve_723d0.c
  ida/pseudocode/0003_run_daemon_once_core_impl_a3a40.c
  call-trees/run_daemon_once.jsonl

raw/aimami/1.0.9/windows/daemon/load_bootstrap_state/
  manifest.json
  ida/pseudocode/0001_load_bootstrap_state_owner_sys_272e80.c
  ida/pseudocode/0002_load_bootstrap_state_core_serialize_451160.c
  call-trees/load_bootstrap_state.jsonl

raw/aimami/1.0.9/windows/daemon/note_usage_refresh_activity/
  manifest.json  (status: consumerStartReady; platform_result: ABSENT)

raw/aimami/1.0.9/windows/daemon/schedule_full_runtime_refresh/
  manifest.json  (status: consumerStartReady; platform_result: ABSENT)

raw/aimami/1.0.9/windows/daemon/start_usage_refresh_watcher/
  manifest.json  (status: consumerStartReady; platform_result: ABSENT)

raw/aimami/1.0.9/windows/daemon/update_usage_refresh_schedule/
  manifest.json  (status: consumerStartReady; platform_result: ABSENT)
```

## Auto-Switch Raw Bundles (Windows x64)

```
raw/aimami/1.0.9/windows/auto-switch/start_auto_switch_pending_watcher/
  manifest.json  (bootstrap_addr: 0x14028CCB0; thread_spawn_addr: 0x140004980; status: strictImplementationUse)
  ida/pseudocode.c
  call-trees/call-tree.jsonl

raw/aimami/1.0.9/windows/auto-switch/load_pending_auto_switch/
  manifest.json  (dispatcher_addr: 0x1402663E0, core_addr: 0x140564060; status: strictImplementationUse)
  ida/pseudocode.c
  call-trees/call-tree.jsonl

raw/aimami/1.0.9/windows/auto-switch/confirm_pending_auto_switch/
  manifest.json  (owner_addr: 0x14026EA00, core_addr: 0x1400A9BD0; status: strictImplementationUse)
  ida/pseudocode.c
  call-trees/call-tree.jsonl

raw/aimami/1.0.9/windows/auto-switch/dismiss_pending_auto_switch/
  manifest.json  (owner_addr: 0x14027F120, core_addr: 0x1400AA290; status: strictImplementationUse)
  ida/pseudocode.c
  call-trees/call-tree.jsonl

raw/aimami/1.0.9/windows/auto-switch/confirm_pending_auto_switch_and_restart_codex/
  manifest.json  (dispatcher_addr: 0x1402663E0, coroutine_addr: 0x1408E4F50; status: strictImplementationUse)
  ida/pseudocode.c
  call-trees/call-tree.jsonl

raw/aimami/1.0.9/windows/auto-switch/configure_auto_switch/
  manifest.json  (owner_addr: 0x14027BE90, core_addr: 0x1400A7C00; status: strictImplementationUse)
  ida/pseudocode/0001_configure_auto_switch_owner_sys_27be90.c
  ida/pseudocode/0002_configure_auto_switch_core_impl_a7c00.c
  call-trees/configure_auto_switch.jsonl

raw/aimami/1.0.9/windows/auto-switch/set_auto_switch/
  manifest.json  (owner_addr: 0x140272080, core_addr: 0x1400A4F60; status: strictImplementationUse)
  ida/pseudocode/0001_set_auto_switch_owner_sys_272080.c
  ida/pseudocode/0002_set_auto_switch_core_impl_a4f60.c
  call-trees/set_auto_switch.jsonl
```

## Legacy Daemon module paths (also contain auto-switch evidence — same raw data, different path)

```
raw/aimami/1.0.9/windows/daemon/confirm_pending_auto_switch/  (legacy path, contains confirm + and_restart evidence)
raw/aimami/1.0.9/windows/daemon/configure_auto_switch/
raw/aimami/1.0.9/windows/daemon/dismiss_pending_auto_switch/
raw/aimami/1.0.9/windows/daemon/set_auto_switch/
```

## Frontend CCF (macOS dump, cross-platform shared JS bundle)

```
raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ipc-contracts.jsonl
raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/frontend-control-flow.jsonl
raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/frontend-contract-report.md
raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/index-CL22l5v8.js
raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/settings-page-CHeElwco.js
raw/aimami/1.0.9/macos/frontend/system-ccf/SYSTEM-FRONTEND-CCF-109.md
```

## field Function Addresses (Windows x64)

| Function | VA | Role |
|---|---|---|
| run_daemon_once_owner_sys | 0x1402843E0 | command owner |
| run_daemon_once_core_resolve | 0x1400723D0 | state resolver |
| run_daemon_once_core_impl | 0x1400A3A40 | core impl |
| schtask_trigger | 0x14056B7F0 | trigger schtasks |
| daemon_schtasks_register | 0x1403FB450 | CreateProcessW(schtasks.exe) |
| load_bootstrap_state_owner_sys | 0x140272E80 | command owner |
| load_bootstrap_state_core_serialize | 0x140451160 | JSON serialize |
| auto_switch_watcher_bootstrap_sys | 0x14028CCB0 | boot-spawned watcher bootstrap (start_auto_switch_pending_watcher) |
| std_thread_spawn_wrapper_sys | 0x140004980 | std::thread::spawn wrapper |
| CreateThread_target | 0x14002A7E0 | CreateThread (watcher thread body) |
| auto_switch_multiplex_dispatcher_sys | 0x1402663E0 | multiplex dispatcher (load_pending + confirm_and_restart) |
| load_pending_auto_switch_core | 0x140564060 | core impl |
| load_pending_auto_switch_cmd_string | 0x141268DFE | command string |
| confirm_pending_auto_switch_owner_sys | 0x14026EA00 | command owner |
| confirm_pending_auto_switch_core_impl | 0x1400A9BD0 | core impl |
| confirm_pending_auto_switch_and_restart_coroutine | 0x1408E4F50 | async restart coroutine |
| confirm_and_restart_async | 0x1400A2DE0 | restart async |
| confirm_and_restart_cmd_wrapper | 0x14026F140 | cmd wrapper |
| confirm_and_restart_cmd_string | 0x14129C7A0 | restart bridge command string |
| dismiss_pending_auto_switch_owner_sys | 0x14027F120 | command owner |
| dismiss_pending_auto_switch_core_impl | 0x1400AA290 | core impl |
| configure_auto_switch_owner_sys | 0x14027BE90 | command owner |
| configure_auto_switch_core_impl | 0x1400A7C00 | core impl |
| set_auto_switch_owner_sys | 0x140272080 | command owner |
| set_auto_switch_core_impl | 0x1400A4F60 | core impl |
| sub_140563ED0 | 0x140563ED0 | promote_pending_to_active |
| sub_140564060 | 0x140564060 | load/clear pendingSwitchAccountKey |
| sub_140388010 | 0x140388010 | restart_codex |
| get_usage_refresh_interval_core_impl | 0x14045F6C0 | Windows interval getter (replaces start_usage_refresh_watcher) |
| set_usage_refresh_interval_owner_sys | 0x14027F690 | Windows interval setter (replaces update_usage_refresh_schedule) |
