# Evidence Paths — windows-1.0.9-system

所有 raw 证据路径（相对 <source-location>）

---

## Binary SOT

```
raw/binary/AiMaM 1.0.9 win64.exe
raw/binary/AiMaM 1.0.9 win64.exe.i64  (IDA IDB under `<source-location>`)
SHA-256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
```

---

## force_kill_codex

```
raw/aimami/1.0.9/windows/system/force_kill_codex/manifest.json
raw/aimami/1.0.9/windows/system/force_kill_codex/README.md
raw/aimami/1.0.9/windows/system/force_kill_codex/AI.md
raw/aimami/1.0.9/windows/system/force_kill_codex/SYSTEM-DIFF.md
raw/aimami/1.0.9/windows/system/force_kill_codex/call-trees/force_kill_codex.jsonl
raw/aimami/1.0.9/windows/system/force_kill_codex/ida/pseudocode/0001_force_kill_codex_by_imagename_owner.c
raw/aimami/1.0.9/windows/system/force_kill_codex/ida/pseudocode/0002_quit_codex_wait_fallback_kill.c
raw/aimami/1.0.9/windows/system/force_kill_codex/ida/pseudocode/0003_notify_quit_codex_wait_fallback_kill.c
raw/aimami/1.0.9/windows/system/force_kill_codex/ida/pseudocode/0004_scan_codex_process_list.c
raw/aimami/1.0.9/windows/system/force_kill_codex/ida/pseudocode-manifest.jsonl
```

---

## reset_codex_config

```
raw/aimami/1.0.9/windows/system/reset_codex_config/manifest.json
raw/aimami/1.0.9/windows/system/reset_codex_config/call-trees/reset_codex_config_call_tree.jsonl
raw/aimami/1.0.9/windows/system/reset_codex_config/ida/pseudocode/0001_tauri_cmd_reset_codex_config_handler_14026F590.c
raw/aimami/1.0.9/windows/system/reset_codex_config/ida/pseudocode/0002_relay_manager_reset_codex_config_impl_14014DF10.c
raw/aimami/1.0.9/windows/system/reset_codex_config/ida/pseudocode/0003_relay_codex_config_toml_write_140422D90.c
raw/aimami/1.0.9/windows/system/reset_codex_config/ida/pseudocode/0004_relay_remove_codex_router_catalog_1403A1780.c
raw/aimami/1.0.9/windows/system/reset_codex_config/ida/pseudocode/0005_relay_atomic_write_file_140332540.c
raw/aimami/1.0.9/windows/system/reset_codex_config/ida/pseudocode-manifest.jsonl
```

---

## get_image_compat

```
raw/aimami/1.0.9/windows/system/get_image_compat/manifest.json
raw/aimami/1.0.9/windows/system/get_image_compat/README.md
raw/aimami/1.0.9/windows/system/get_image_compat/AI.md
raw/aimami/1.0.9/windows/system/get_image_compat/SYSTEM-DIFF.md
raw/aimami/1.0.9/windows/system/get_image_compat/call-trees/tauri_cmd_get_image_compat_handler.jsonl
raw/aimami/1.0.9/windows/system/get_image_compat/ida/pseudocode/0001_get_image_compat_handler_tauri_cmd_get_image_compat_handler_win64_a0b1c2d3.c
raw/aimami/1.0.9/windows/system/get_image_compat/ida/pseudocode/0002_get_image_compat_core_image_compat_read_config_toml_features_win64_b1c2d3e4.c
raw/aimami/1.0.9/windows/system/get_image_compat/ida/pseudocode/0003_get_image_compat_paths_codex_paths_build_from_env_win64_c2d3e4f5.c
raw/aimami/1.0.9/windows/system/get_image_compat/ida/pseudocode/0004_get_image_compat_response_image_compat_build_response_ok_bool_win64_d3e4f5a6.c
raw/aimami/1.0.9/windows/system/get_image_compat/ida/pseudocode-manifest.jsonl
raw/aimami/1.0.9/windows/system/get_image_compat/validation/result.json
```

---

## set_image_compat

```
raw/aimami/1.0.9/windows/system/set_image_compat/manifest.json
raw/aimami/1.0.9/windows/system/set_image_compat/call-trees/set_image_compat.jsonl
raw/aimami/1.0.9/windows/system/set_image_compat/ida/pseudocode/0001_set_image_compat_handler_owner_14027a1b0.c
raw/aimami/1.0.9/windows/system/set_image_compat/ida/pseudocode/0002_set_image_compat_impl_core_1400a5eb0.c
raw/aimami/1.0.9/windows/system/set_image_compat/ida/pseudocode/0003_image_compat_build_response_ok_bool_1404391d0.c
raw/aimami/1.0.9/windows/system/set_image_compat/ida/pseudocode-manifest.jsonl
raw/aimami/1.0.9/windows/system/set_image_compat/validation/result.json
```

---

## get_system_info

```
raw/aimami/1.0.9/windows/system/get_system_info/manifest.json
raw/aimami/1.0.9/windows/system/get_system_info/README.md
raw/aimami/1.0.9/windows/system/get_system_info/AI.md
raw/aimami/1.0.9/windows/system/get_system_info/SYSTEM-DIFF.md
raw/aimami/1.0.9/windows/system/get_system_info/call-trees/codexmate_lib__commands__system__get_system_info.jsonl
raw/aimami/1.0.9/windows/system/get_system_info/ida/pseudocode/0001_get_system_info_owner_cmd_140070050.c
raw/aimami/1.0.9/windows/system/get_system_info/ida/pseudocode/0002_get_system_info_field_builder_1400BF440.c
raw/aimami/1.0.9/windows/system/get_system_info/ida/pseudocode/0003_get_system_info_json_field_serializer_14041D2C0.c
raw/aimami/1.0.9/windows/system/get_system_info/ida/pseudocode/0004_get_system_info_response_envelope_140062230.c
raw/aimami/1.0.9/windows/system/get_system_info/ida/pseudocode-manifest.jsonl
raw/aimami/1.0.9/windows/system/get_system_info/validation/result.json
```

---

## check_update_installability

```
raw/aimami/1.0.9/windows/system/check_update_installability/manifest.json
raw/aimami/1.0.9/windows/system/check_update_installability/README.md
raw/aimami/1.0.9/windows/system/check_update_installability/AI.md
raw/aimami/1.0.9/windows/system/check_update_installability/SYSTEM-DIFF.md
raw/aimami/1.0.9/windows/system/check_update_installability/call-trees/check_update_installability.jsonl
raw/aimami/1.0.9/windows/system/check_update_installability/ida/
raw/aimami/1.0.9/windows/system/check_update_installability/validation/result.json
```

---

## Frontend CCF（共用 bundle，macOS arm64 dump）

```
raw/aimami/1.0.9/macos/frontend/system-ccf/SYSTEM-FRONTEND-CCF-109.md
raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ipc-contracts.jsonl
raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/frontend-control-flow.jsonl
raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/frontend-contract-report.md
raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/index-CL22l5v8.js
raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/maintenance-page-j6kXR210.js
```

注: 前端 bundle 跨平台共用，但 get_image_compat Windows CCF 需独立确认（macOS 特有能力警告）。
