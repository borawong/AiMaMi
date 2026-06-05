# WIN-RELAY-IMAGE-COMPAT-109.md

**Cluster**: relay_image_compat (Windows x64)
**Session**: <audit-session>
**Machine**: <workstation>
**Binary SHA (sha12)**: a5822387fa3f
**Binary full SHA**: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
**Date**: 2026-06-03
**Source**: `src\core\relay\proxy_server.rs` (confirmed from IDA string refs)
**IDB saved**: yes (<source-location>\raw\binary\AiMaM 1.0.9 win64.exe.i64)

---

## Evidence Status

| dim | status | notes |
|---|---|---|
| dim1 frontend control-flow | accepted_unknown | no frontend CCF available for this session; Windows IPC path confirmed via dispatcher xref |
| dim2 backend owner + IDA decompile | A-level | all 5 owners decompiled; non-failed |
| dim3 callees/xrefs to impl leaves | A-level (depth >= 5) | codex_paths_build_from_env → codex_paths_join_all_subpaths → sub_14104DEE0 → file-read → atomic-write |
| dim4 interface/DTO/error/side-effect | A-level | DTO closed: CoreEnvelope{ok:{enabled:bool}}; side-effect: config.toml [features] section mutation |
| dim5 platform gate | Windows-confirmed | all evidence from a5822387fa3f Windows artifact; no macOS inference |
| dim6 test/acceptance | missing | dim6 not closed this session |

**Consumer tier**: strictImplementationUse (dim6 missing)
**gate**: pass

---

## Call Tree (depth >= 5)

```
Tauri IPC dispatcher (auto_switch_multiplex_dispatcher_sys @ 0x1402663E0)
├── relay_image_compat_set_handler_sys @ 0x14027A1B0     [A-level; set_image_compat command]
│   ├── sub_1404632D0 (param deserializer: "set_image_compat"/"enabled")
│   ├── relay_image_compat_set_impl_sys @ 0x1400A5EB0    [A-level; core write]
│   │   ├── codex_paths_build_from_env_sys @ 0x140476200
│   │   ├── codex_paths_join_all_subpaths @ 0x140476350
│   │   ├── sub_14104DEE0 (file-read config.toml)
│   │   ├── sub_14009FA50 (line-splitter for TOML parsing)
│   │   ├── sub_140183010 (trim/strip helper)
│   │   ├── sub_1401836B0 (suffix search helper)
│   │   ├── sub_1400D2320 (TOML line-vector write-back)
│   │   ├── sub_14104E390 (atomic file write)
│   │   └── relay_image_compat_build_ok_bool_response_sys @ 0x1404391D0
│   └── tauri_ipc_resolve_sys @ 0x140062230
│
└── relay_image_compat_get_handler_sys @ 0x1402779B0     [A-level; get_image_compat command]
    ├── relay_image_compat_read_config_toml_sys @ 0x1400A55F0   [A-level; read path]
    │   ├── codex_paths_build_from_env_sys @ 0x140476200
    │   ├── codex_paths_join_all_subpaths @ 0x140476350
    │   ├── sub_14104DEE0 (file-read config.toml)
    │   ├── sub_140091550 (BufReader line iterator)
    │   ├── sub_140183010 (trim helper)
    │   ├── sub_1401836B0 (suffix search: finds '=' position)
    │   └── relay_image_compat_build_ok_bool_response_sys @ 0x1404391D0
    └── (response marshal)

relay_image_compat_get_core_impl_sys @ 0x1400A7040      [B-level; used by reset_codex_config]
    ├── sub_140153300 (AppState param extract)
    ├── codex_paths_build_from_env_sys @ 0x140476200
    ├── codex_paths_join_all_subpaths @ 0x140476350
    ├── sub_141047370 (file-read with Result)
    ├── sub_14104E390 (on err path: atomic write)
    └── relay_image_compat_build_ok_bool_response_sys @ 0x1404391D0

stream_codex_responses_native_sys @ 0x14012AE30         [B-level; forward gate / image_url rejection]
    ├── sub_140108C80("image_url", 9)   [substring check on response body]
    ├── cs:off_141882AF8 (log-level global; cmp rax, 3 = DEBUG gate)
    ├── sub_140E8A390 (log "[AiMaMi] image_url rejected by upstream; retrying with text fallback")
    ├── sub_140143840 (retry request without image content @ loc_14012source archive8D)
    └── stream_codex_responses_translator_dispatch_sys @ 0x140134DC0

relay_image_support_capability_descriptor_sys @ 0x140599610  [image-support RelayCapabilityDescriptor builder]
    └── called from relay_image_support_tool_pair_builder_sys @ 0x1405999D0

relay_image_compat_build_ok_bool_response_sys @ 0x1404391D0  [shared response builder]
    └── callers: relay_image_compat_read_config_toml_sys, relay_image_compat_set_impl_sys,
                 relay_image_compat_get_core_impl_sys, PluginRegistry::set_enabled@0x140164C00,
                 update_plugin_config@0x140165130, relay_set_block_passthrough_write_ok_sys@0x140440370
```

---

## Function Table

| function | VA | role | level |
|---|---|---|---|
| relay_image_compat_set_handler_sys | 0x14027A1B0 | Tauri IPC handler for set_image_compat | A |
| relay_image_compat_set_impl_sys | 0x1400A5EB0 | core impl: parse+write [features] in config.toml | A |
| relay_image_compat_read_config_toml_sys | 0x1400A55F0 | read [features].image_generation from config.toml | A |
| relay_image_compat_build_ok_bool_response_sys | 0x1404391D0 | shared CoreEnvelope{ok:{enabled:bool}} builder | A |
| relay_image_compat_get_core_impl_sys | 0x1400A7040 | get_image_compat core (used by reset_codex_config) | B |
| relay_image_compat_get_handler_sys | 0x1402779B0 | Tauri IPC handler for get_image_compat | A |
| relay_image_support_capability_descriptor_sys | 0x140599610 | image-support RelayCapabilityDescriptor builder | A |
| relay_image_support_tool_pair_builder_sys | 0x1405999D0 | tool pair [fetch, image-support] allocator | A |
| stream_codex_responses_native_sys | 0x14012AE30 | forward gate: image_url rejection + retry | B |
| relay_set_block_passthrough_write_ok_sys | 0x140440370 | uses shared ok-bool builder for passthrough toggle | B |

---

## Interface / DTO

### IPC Commands

**get_image_compat** (command string VA: 0x141267E70)
- Input: manager (AppState handle, 7 bytes)
- Output: `CoreEnvelope { ok: { enabled: bool } }`
  - `ok` field: 2 bytes, value 27503 = 0x6B6F
  - `enabled` field: 7 bytes (0x64656C62617265 + 'n')
  - bool at offset +77 in response struct
  - enabled=true if `image_generation` field absent OR value != "false" in [features]
  - enabled=false if `image_generation = false` present in [features]

**set_image_compat** (command string VA: 0x141268D1C)
- Input: `{ enabled: bool }` (param field "enabled" 7 bytes at 0x14126925B)
- Output: same CoreEnvelope shape as get_image_compat
- Side-effect: mutates config.toml [features] section
  - Three insertion cases:
    1. `image_generation` field exists in section: replace its value line with "image_generation = false" (24 bytes)
    2. [features] section exists, no image_generation field: append newline + "image_generation = false"
    3. [features] section absent: insert new "[features]\nimage_generation = false\n" block
  - String constants: "[features]" @0x1412585E (0x657275746165665B + 0x5D73 = "[features]"), "image_generation = false" @0x1412585C0
  - field detection: byteswap comparison 0x696D6167655F6765 ('image_ge') + 0x6E65726174696F6E ('neration')
  - Atomic write via sub_14104E390 (same as other relay config writers)

### config.toml [features] section format
```toml
[features]
image_generation = false
```
- Section header: exactly `[features]` (10 bytes, detected by XOR mask 0x657275746165665B | 0x5D73)
- field: `image_generation` (16 bytes, SSE 16-byte prefix match against xmmword_141257E10)
- Value: `false` (5 bytes, compared as 0x736C6166 + 0x65)

### Forward Gate (stream_codex_responses_native_sys)
- NOT a config-file read gate: the forward path does NOT call codex_paths_build_from_env_sys
- Gate mechanism: BEHAVIORAL (reactive, not proactive)
  - When response body contains "image_url" substring (9 bytes, sub_140108C80 at 0x14012C3C0)
  - AND response tag [rsi+388h] < 3 (non-terminal state)
  - AND not a specific content-type bypass ([rsi+0CEh] != 1)
  - → Logs retry message if log_level (cs:off_141882AF8) >= 3
  - → Retries request without image content via sub_140143840 at loc_14012source archive8D
- Source file: `src\core\relay\proxy_server.rs` (confirmed at 0x14125BC7A, 0x14125BF70)

### relay_image_support_capability_descriptor_sys fields
| field | bytes | value |
|---|---|---|
| id | 13 | "image-support" |
| name | 13 | "Image Support" |
| description | 194 | Chinese Vision description @0x14128AF28 |
| version | 5 | "1.0.0" (0x2E302E31 + 0x30) |
| category | 6 | "relay" (0x617C656C6172 → "relay\0") |
| enabled | 1 | true (0x01) |
| visible (offset+144) | 2 | 1 (word) |

### relay_models_error_hint_sys (adjacent, image_generation error path)
- VA: 0x140431D00 (pre-existing name retained)
- Checks error message for "image generation" (0x10, 0x14127B6AE) and "image_generation" (0x10, 0x14127B276)
- This is the ERROR HINT path (display), not the capability gate
- Called from HTTP stream body parser and relay_models_sanitize_error_for_display_sys

---

## Error Paths

- `relay_image_compat_set_impl_sys`: on file-read fail → returns Err propagated via 0x8000000000000000 sentinel
- `relay_image_compat_set_impl_sys`: on atomic-write fail → calls sub_14105D150 (error handler) → Err result
- `relay_image_compat_get_core_impl_sys`: tag=2 (empty/missing) → returns {enabled: false} (ok=false path)
- `relay_image_compat_get_core_impl_sys`: file-write error → 70-byte error string (xmmword_141258480..xmmword_1412584B0)
- `stream_codex_responses_native_sys` image_url rejection: retry path at loc_14012source archive8D → if retry also fails → continues normal error handling

---

## Platform Differences vs macOS

| aspect | Windows | macOS |
|---|---|---|
| config.toml parse approach | byteswap-compare (no SIMD rotation) | SSE cmpeq (identical xmmword prefix) |
| [features] section marker check | XOR mask 0x657275746165665B | identical XOR mask |
| image_generation field check | dual byteswap: 0x696D6167655F6765 + 0x6E65726174696F6E | identical pattern |
| atomic write function | sub_14104E390 | relay_toml_section_writer_atomic_sys |
| forward gate location | stream_codex_responses_native_sys@0x14012AE30 | forward_codex_responses_internal@0x100114ab0-equivalent |
| log retry message | "[AiMaMi] image_url rejected by upstream; retrying with text fallback" (137 bytes @0x14125BF91) | identical string |
| capability descriptor | relay_image_support_capability_descriptor_sys@0x140599610 | equivalent builder |

---

## Six-Dim Gate Assessment

| dim | result |
|---|---|
| dim1 frontend | accepted_unknown (no CCF session; IPC path confirmed via dispatcher) |
| dim2 backend owner/IDA | pass (5 non-failed decompiles; all A-level) |
| dim3 callees depth | pass (>= 5: dispatcher → handler → impl → codex_paths → file-read → atomic-write) |
| dim4 DTO/interface | pass (CoreEnvelope closed; config.toml format closed; forward gate behavior closed) |
| dim5 platform gate | pass (Windows-only evidence from a5822387fa3f) |
| dim6 acceptance mapping | missing |

**Overall**: strictImplementationUse (dim6 not closed; dim1 accepted_unknown)
