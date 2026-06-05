# Evidence Paths — AiMaMi 1.0.9 macOS system 模块

本文件只含外部路径指针，不复制 raw artifact。  
所有路径相对 `<source-location>`。

---

## Binary SOT

```
raw/binary/AiMaMi 1.0.9.app
  └── Contents/MacOS/AiMaMi  (fat binary, source SHA: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482)
raw/binary/AiMaMi 1.0.9_ida.app
  └── Contents/MacOS/AiMaMi  (thin arm64, SHA: 985dae00be620b21164b4a8d35cc0379b750d5a6257b25897b0e813441e4d706)
  └── Contents/MacOS/AiMaMi.i64  (IDA Pro database)
```

---

## Frontend CCF

```
raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/
  ├── frontend/ipc-contracts.jsonl
  ├── frontend/frontend-control-flow.jsonl
  ├── frontend/frontend-contract-report.md
  ├── dumped/assets/index-CL22l5v8.js  (主 bundle, L86)
  └── dumped/assets/maintenance-page-j6kXR210.js  (system 页面, L32)

raw/aimami/1.0.9/macos/frontend/system-ccf/SYSTEM-FRONTEND-CCF-109.md  (system 模块 CCF 结论)
```

---

## force_kill_codex

```
raw/aimami/1.0.9/macos/system/force_kill_codex/
  ├── manifest.json
  ├── AI.md
  ├── README.md
  ├── SYSTEM-DIFF.md
  ├── validation/result.json
  ├── call-trees/codexmate_lib::commands::system::force_kill_codex.jsonl
  ├── ida/pseudocode-manifest.jsonl
  ├── ida/pseudocode/0001_force_kill_codex_owner_cmd_1b9b65a7.c  (0x10025e654)
  ├── ida/pseudocode/0002_force_kill_codex_platform_force_kill_all_ha987baf7.c  (0x10067538c)
  ├── ida/pseudocode/0003_force_kill_codex_platform_force_kill_pid_hcbcb471.c  (0x100674274)
  └── ida/pseudocode/0004_force_kill_codex_platform_list_all_codex_hfa88ec1.c  (0x100674c48)
```

---

## reset_codex_config

```
raw/aimami/1.0.9/macos/system/reset_codex_config/
  ├── manifest.json
  ├── AI.md
  ├── README.md
  ├── SYSTEM-DIFF.md
  ├── validation/result.json
  ├── call-trees/reset_codex_config.jsonl
  ├── ida/pseudocode-manifest.jsonl
  ├── ida/pseudocode/0001_reset_codex_config_owner_sys.c  (0x10025fbc8)
  ├── ida/pseudocode/0002_relay_manager_snapshot.c  (0x1001cfc44)
  ├── ida/pseudocode/0003_resolve_codex_home.c  (0x100526914)
  ├── ida/pseudocode/0004_fs_write_inner.c  (0x100d2c974)
  └── ida/pseudocode/0005_core_envelope_ok.c  (0x1001d9148)
```

---

## get_image_compat

```
raw/aimami/1.0.9/macos/system/get_image_compat/
  ├── manifest.json
  ├── AI.md
  ├── README.md
  ├── SYSTEM-DIFF.md
  ├── validation/result.json
  ├── call-trees/codexmate_lib__commands__system__get_image_compat.jsonl
  ├── ida/pseudocode-manifest.jsonl
  ├── ida/pseudocode/0001_get_image_compat_owner_sys_592fbf82.c  (0x10025e7c0)
  ├── ida/pseudocode/0002_get_image_compat_resolve_codex_home_f6eadfda.c  (0x100526914)
  └── ida/pseudocode/0003_get_image_compat_core_envelope_ok_a5c0efab.c  (0x1001d9148)
```

---

## set_image_compat

```
raw/aimami/1.0.9/macos/system/set_image_compat/
  ├── manifest.json
  ├── AI.md
  ├── README.md
  ├── SYSTEM-DIFF.md
  ├── call-trees/set_image_compat_owner_sys.jsonl
  ├── ida/pseudocode-manifest.jsonl
  ├── ida/pseudocode/0001_set_image_compat_owner_sys.c  (0x10025ee14)
  ├── ida/pseudocode/0002_resolve_codex_home_leaf.c  (0x100526914)
  ├── ida/pseudocode/0003_read_to_string_inner_leaf.c  (0x100d2c1f4)
  ├── ida/pseudocode/0004_write_inner_leaf.c  (0x100d2c974)
  ├── ida/pseudocode/0005_core_envelope_ok_leaf.c  (0x1001d9148)
  └── ida/pseudocode/0006_tauri_wrapper.c  (0x10032427c)
```

---

## get_system_info

```
raw/aimami/1.0.9/macos/system/get_system_info/
  ├── manifest.json
  ├── AI.md
  ├── README.md
  ├── SYSTEM-DIFF.md
  ├── validation/result.json
  ├── call-trees/codexmate_lib::commands::system::get_system_info.jsonl
  ├── ida/pseudocode-manifest.jsonl
  ├── ida/pseudocode/0001_get_system_info_owner_cmd_6dde4e8d.c  (0x10025d0b4)
  ├── ida/pseudocode/0002_get_system_info_platform_hostname_get_20dd19b6.c  (0x10078660c)
  ├── ida/pseudocode/0003_get_system_info_tauri_wrapper_closure_9f4253799d.c  (0x100323d00)
  └── ida/pseudocode/0004_get_system_info_ipc_response_body_26fc1ff0.c  (0x1002680c0)
```

---

## check_update_installability

```
raw/aimami/1.0.9/macos/system/check_update_installability/
  ├── manifest.json
  ├── AI.md
  ├── README.md
  ├── SYSTEM-DIFF.md
  ├── call-trees/codexmate_lib::platform::update::check_update_installability.jsonl
  ├── ida/pseudocode-manifest.jsonl
  ├── ida/pseudocode/0001_check_update_installability_tauri_closure_he40ace9.c  (0x1003290d4)
  ├── ida/pseudocode/0002_check_update_installability_platform_impl_h67162043.c  (0x100578128)
  └── ida/pseudocode/0003_check_update_installability_platform_is_translocation_h98e6351.c  (0x100578020)
```

---

## Helpers / Watchers (no raw leaf)

```
No raw evidence paths — source archive-local product_decision
Historical reference only (do not use as upstream proof):
  raw/aimami/1.0.5/shared/call-trees/start_usage_refresh_watcher.jsonl  (1.0.5 only, different version)
```
