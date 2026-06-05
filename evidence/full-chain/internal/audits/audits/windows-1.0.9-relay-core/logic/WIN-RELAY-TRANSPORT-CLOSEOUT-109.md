# Windows relay-core Transport Layer — relay-transport-closeout-109
# Platform: windows-x64 | Binary SHA12: a5822387fa3f | Session: relay-transport-closeout-109
# Producer: <workstation> | Date: 2026-06-03

Scope: relay transport sub-layer within existing relay_proxy_server cluster.
Targets: forward_codex / by_provider dispatch / FeatureA compact path / relay_proxy_config (api_proxy commands + platform proxy layer).
Gate: supplement to windows-1.0.9-relay-core cluster, which owns relay_proxy_server (strictImplementationUse).

---

## 1. handle_codex_by_provider_ws_state_machine_sys (0x140831F60)

**Cluster**: relay_proxy_server  
**Tier**: A-level (decompiled, state machine, sha confirmed)  
**Size**: 0xb1b bytes

State machine dispatcher for the by_provider WebSocket path.
Entry = case 0: initializes state, copies request context, calls by_provider_request_broker_sys.
Loop: drive by_provider_request_broker_sys → forward_codex_responses_internal_sys → send response → iterate.

### Error responses (confirmed string literals)

| error field | HTTP status | VA |
|---|---|---|
| `by_provider.ws.provider_not_found` | 404 | 0x14129D01D |
| `by_provider.ws.bridge_failed` | 502 | 0x14129D089 |

### field callees

| function | VA | role |
|---|---|---|
| `by_provider_request_broker_sys` | 0x140833920 | reads generate/model, overrides model to "aimami-proxy" |
| `forward_codex_responses_internal_sys` | 0x140838820 | central response stream processor |
| `sub_140833E30` | 0x140833E30 | send request / poll next |
| `sub_140832FC0` | 0x140832FC0 | write response / error branch |
| `sub_140835420` | 0x140835420 | cleanup / close |

### Source module
`codexmate_lib::core::relay::proxy_server` (string at 0x14129CD35)

---

## 2. by_provider_request_broker_sys (0x140833920)

**Cluster**: relay_proxy_server  
**Tier**: A-level (decompiled, sha confirmed)  
**Size**: ~0x190 bytes

Reads the `generate` and `model` fields from the incoming JSON payload.
Overrides the model field to the literal string `"aimami-proxy"` (12 bytes, at 0x14129D0D0).
Calls `sub_140134070` (build upstream request with overridden model) then `sub_140FF0190` (send via WS).

```
payload.generate == true AND payload.generate != false:
  model = payload.model OR "aimami-proxy" (fallback)
  sub_140134070(ws_context, model_ptr, model_len)
  sub_140FF0190(ws_context, &result)  → Ok or Err
```

3-state coroutine (case 0/1/2/3). Source: `src\core\relay\proxy_server.rs` (at 0x14129CC7C).

---

## 3. forward_codex_responses_internal_sys (0x140838820)

**Cluster**: relay_proxy_server  
**Tier**: B-level (prior IDB comment confirms; size 0x4cbf; sha confirmed)

Central response stream processor. Callee of handle_codex_router_ws_core_sys.
field behaviors:
- Reads `model` from payload via sub_140FF5620
- String "no relay provider configured for codex" (0x14129D246) → 503 on no provider
- String "proxy.upstream" (0x14125BD8E) → upstream proxy error path
- Calls `relay_breaker_record_result_sys` (0x140120EC0) — records success/failure
- Calls `stream_codex_responses_translator_dispatch_sys` (0x140134DC0) — routes to translator
- Calls `relay_web_tools_build_passthrough_response_sys` (0x1401F9D60) — web tools path
- Calls `relay_web_tools_dispatch_loop_cluster2_sys` (0x140840650) — cluster2 forward path
- Calls `execute_proxy_tools_owner_sys` (0x1401DFC70) — proxy tool call path

field callees confirmed:
```
0x140129280  build_upstream_headers_variant
0x140FF5620  json_field_lookup
0x140120EC0  relay_breaker_record_result_sys
0x140134DC0  stream_codex_responses_translator_dispatch_sys
0x1401F9D60  relay_web_tools_build_passthrough_response_sys
0x140840650  relay_web_tools_dispatch_loop_cluster2_sys
0x1401DFC70  execute_proxy_tools_owner_sys
```

---

## 4. compact_response_body_parser_sys / FeatureA Path (0x14013E630)

**Cluster**: relay_proxy_server (called from forward_codex_responses_internal_sys)  
**Tier**: A-level (decompiled, full logic recovered)

Processes the compact/encrypted streaming response path.

### Algorithm

1. Read `input` array from response JSON (field lookup via sub_140FF5620)
2. For each item in the array (32-byte entries):
   - Skip if item type field == 6 (done sentinel)
   - Read `type` field from item
   - If `type == "compact_notification"` (exact 10-char match):
     - Read `encrypted_content` field
     - Check length >= 18 and prefix matches `"1:"` (SIMD xmmword at 0x14125A7E0)
     - If prefix matches: call sub_14025C9E0 (base64 decode, VA 0x14025C9E0) with content[2:]
3. For each decoded item:
   - Extract `summary` field if present → copy string bytes
   - Build output JSON with fields: `"done"` (4 bytes, literal 1701869940), `"text"` (4 bytes, literal 1701605234), `"summary"` (7 bytes, literal 1953394531+1953391988), `"role"` (4 bytes, literal 1954047348)
   - Constructs Array variant JSON (type tag 5), appends to result list
4. Return result array to caller

### field constants

```
compact_notification type: bytes = "compact_notification" (10 chars, len=10)
encrypted_content prefix: "1:" (checked via SIMD at 0x14125A7E0, must be >= 18 chars)
base64 decoder: sub_14025C9E0
JSON output fields (as u32 literals):
  "done" = 0x656E6F64 = 1701869940
  "text" = 0x74786574 = 1701605234
  "summary" = 0x72616D6D75732E72... (7 bytes split across 2 u32 literals)
  "role" = 0x656C6F72 = 1954047348
```

---

## 5. try_pass_through (passthrough_to_chatgpt_upstream_sys) — Windows

**Cluster**: relay_proxy_server  
**VA**: 0x140145610  
**Tier**: A-level (prior IDB comment; sha confirmed)

See WIN-RELAY-CORE-INTERNAL-109.md §2 for full detail. Summary:
- Adds headers: `x-aimami-route` (14B at 0x14125C828) and `openai-passthrough` (18B)
- Error codes: 401 passthrough.no_chatgpt_auth / 502 passthrough.network / 500 passthrough.build_body

---

## 6. relay_proxy_config Commands (api_proxy IPC layer)

### 6.1 set_api_proxy_config_handler_sys (0x140282340)

**IPC command**: `set_api_proxy_config`  
**Tier**: A-level (decompiled, full param recovery)  
**Params**:

| field | type_tag | notes |
|---|---|---|
| `repo` | 4 | repository identifier string |
| `mode` | 4 | proxy mode string |
| `url` | 3 | proxy URL string (optional) |

**Flow**:
1. Read `repo` field via sub_1400DA7C0 (relay state lock)
2. Read `mode` field via sub_14045FAA0 (string parse)
3. Read `url` field via sub_140461E20 (optional string parse)
4. If all present: call `api_proxy_config_write_core_sys@0x14055C3A0(state, mode, url)`
5. On success: tauri_ipc_resolve_sys with ok result
6. On param parse failure: tauri_ipc_resolve_sys with Err

### 6.2 api_proxy_config_write_core_sys (0x14055C3A0)

**Tier**: B-level (settings write path confirmed)

This is a **settings file mutation**, NOT a relay TOML write.

```
Flow:
1. sub_14010FA90(&dst)  — read current settings state
2. if result == 10 (Ok):
   a. settings_deserialize_usage_refresh@0x1405532D0(&dst, state_ptr)
   b. settings_serialize_with_usage_refresh@0x140553A90(&result, state_ptr, &dst)
   c. if result.tag == 10: sub_140438740(&result, &ok_out) — write to disk
```

The api_proxy config is persisted in the **settings JSON** file, not in `~/.codex/config.toml`.

### 6.3 cmd_detect_api_proxy_config_coroutine_sys (0x1408C45B0)

**IPC command**: `detect_api_proxy_config`  
**Tier**: A-level (decompiled, coroutine state machine)  
**String at**: 0x14129C856

Flow:
1. Call `get_usage_refresh_interval_core_read@0x1402DCBC0` — read current settings
2. If settings.tag != 3 (no custom proxy): call `sub_140889870` (cleanup) → return no-proxy result
3. If custom proxy found: call `sub_140609490` — TCP probe / connectivity test
4. Return structured result via tauri_ipc_resolve_sys

The detect command reads proxy env state, then probes via TCP socket (via `sub_140609490`).

### 6.4 cmd_test_api_proxy_config_coroutine_sys (0x1408E8160)

**IPC command**: `test_api_proxy_config`  
**Tier**: A-level (decompiled, coroutine state machine)  
**String at**: 0x14129C91D  
**Params**: `mode` (4B) + `url` (3B)

Flow:
1. Read `mode` field via sub_14045FAA0
2. If mode parse fails: return Err result
3. Read `url` field via sub_140461E20
4. If url parse fails: return Err result
5. Read settings via get_usage_refresh_interval_core_read
6. TCP probe via sub_140609D60 (different probe fn from detect)
7. On success: call sub_140877B20 (notify/broadcast) + sub_140889870 (cleanup)
8. Return result via tauri_ipc_resolve_sys

---

## 7. detect_system_env_proxy_sys (0x140110A80)

**Cluster**: relay_proxy_config / platform proxy layer  
**Tier**: B-level (decompiled, full env var list recovered)

Windows system proxy detection. Called from cmd_detect_api_proxy_config_coroutine_sys.

### Environment variables checked (in order)

| variable | length | casing |
|---|---|---|
| `https_proxy` | 11 | lowercase |
| `HTTPS_PROXY` | 11 | uppercase |
| `http_proxy` | 10 | lowercase |
| `HTTP_PROXY` | 10 | uppercase |
| `all_proxy` | 9 | lowercase |
| `ALL_PROXY` | 9 | uppercase |

### Algorithm

1. `sub_1400A04E0` — enumerate env vars for https proxies (first pass)
2. `sub_1400B7C10` — enumerate env vars for http proxies (second pass)
3. `sub_1400D3090(&list, &off_14125B388, "https")` — filter for HTTPS scheme
4. For each proxy candidate: TCP probe via `sub_141032F60` (200ms timeout)
5. If TCP probe succeeds: call `apply_extra_headers_variant_b_sys@0x14010FF80` to build result
6. If no reachable proxy found:
   - Error message (118 bytes): "No reachable proxy configuration was detected from environment variables, system proxy, PAC, or common local addresses"
   - Return Err(9, 118, msg_ptr, 118)

### Exclusions (127.0.0.1 and localhost skip)

Checks for `127.0.0.1` (XOR check with 0x2E302E302E373231 | last_byte 0x31) and `localhost` (byteswap 0x6C6F63616C686F73). These local addresses are skipped (goto LABEL_71 = alternate path, NOT counted as reachable external proxy).

### Probe behavior

TCP probe: try_connect via `sub_141032F60(socket, addr, 200_000_000)` (200ms timeout = 200_000_000ns).
On failed connect: `closesocket(socket)`.
On success: `apply_extra_headers_variant_b_sys` adds result to output list.

---

## 8. set_block_official_passthrough / get_passthrough_audit_log

### relay_set_block_passthrough_write_ok_sys (0x140440370)

**Tier**: B-level (prior IDB comment)  
Calls `relay_state_block_passthrough_atomic_write_sys@0x14014DD10`.  
On result == 10 (Ok): calls `relay_image_compat_build_ok_bool_response_sys@0x1404391D0` (shared bool response builder).  
On error: builds Err result and calls `sub_14045D780` (cleanup).

### get_passthrough_audit_log_owner_sys (0x14026E440)

**Tier**: A-level (prior IDB comment)  
IPC: `get_passthrough_audit_log`. Param: `limit` (5B, optional integer).  
Calls `passthrough_audit_log_read_sys@0x14043FC40` with `has_limit` + `limit`.  
Returns `{ok, entries: PassthroughAuditEntry[]}`. Cleanup: 96B per entry.

### append_entry_write_core_sys (0x1408442C0)

**Tier**: A-level (prior IDB comment)  
Path: `sub_141035180(codex_paths, "passthrough-audit.jsonl", 23B)` → `passthrough_audit_jsonl_append_sys@0x14042D9E0`.  
Arc<CodexPaths> from a1+136, reads paths at base+792/+800.  
Error: logged via sub_140177DE0, NOT propagated (fire-and-forget).

---

## 9. Call Chain Summary

```
IPC: by_provider_ws_codex
  → handle_codex_by_provider_ws_state_machine_sys@0x140831F60
      → by_provider_request_broker_sys@0x140833920
          reads: generate + model; overrides model = "aimami-proxy"
          → sub_140134070 (build request)
          → sub_140FF0190 (send WS)
      → forward_codex_responses_internal_sys@0x140838820
          → relay_breaker_record_result_sys@0x140120EC0
          → stream_codex_responses_translator_dispatch_sys@0x140134DC0
          → compact_response_body_parser_sys@0x14013E630 (featureA compact path)
          → relay_web_tools_dispatch_loop_cluster2_sys@0x140840650
          → execute_proxy_tools_owner_sys@0x1401DFC70
      errors: 404(provider_not_found) / 502(bridge_failed)

IPC: set_api_proxy_config
  → set_api_proxy_config_handler_sys@0x140282340
      params: repo + mode + url
      → api_proxy_config_write_core_sys@0x14055C3A0
          → settings_deserialize_usage_refresh@0x1405532D0
          → settings_serialize_with_usage_refresh@0x140553A90
          → sub_140438740 (write settings to disk)

IPC: detect_api_proxy_config
  → cmd_detect_api_proxy_config_coroutine_sys@0x1408C45B0
      → get_usage_refresh_interval_core_read@0x1402DCBC0
      → detect_system_env_proxy_sys@0x140110A80
          reads: HTTPS_PROXY/HTTP_PROXY/ALL_PROXY (both cases)
          → TCP probe sub_141032F60 (200ms timeout)
          → apply_extra_headers_variant_b_sys@0x14010FF80

IPC: test_api_proxy_config
  → cmd_test_api_proxy_config_coroutine_sys@0x1408E8160
      params: mode + url
      → sub_140609D60 (TCP probe)

IPC: set_block_official_passthrough
  → auto_switch_multiplex_dispatcher_sys@0x1402663E0
      → relay_set_block_passthrough_write_ok_sys@0x140440370
          → relay_state_block_passthrough_atomic_write_sys@0x14014DD10
          → relay_image_compat_build_ok_bool_response_sys@0x1404391D0

IPC: get_passthrough_audit_log
  → get_passthrough_audit_log_owner_sys@0x14026E440
      → passthrough_audit_log_read_sys@0x14043FC40
```

---

## 10. Gate Assessment

| cluster | platform | tier | dim6 | notes |
|---|---|---|---|---|
| relay_proxy_server (transport supplement) | windows-x64 | **strictImplementationUse** | missing | forward chain + featureA + by_provider all A/B decompiled; no macOS-Windows structural diff found; ProxyContext 6 fields confirmed prior session |
| relay_proxy_config (api_proxy commands) | windows-x64 | **strictImplementationUse** | missing | 3 IPC commands decompiled (set/detect/test); settings write path confirmed; platform proxy detection algorithm recovered |
| passthrough_helpers (audit/block_passthrough) | windows-x64 | **strictImplementationUse** | missing | append + read + block_write all confirmed via prior comments + this session |

No gate promotion from this session. Existing cluster gates unchanged.
dim6 (acceptance mapping) remains missing — not done this session per scope.

---

## 11. Evidence Boundaries

- FeatureA compact path (`compact_response_body_parser_sys`) is Windows-confirmed (decompiled from win binary). macOS cross-reference: prior session confirmed `stream_codex_responses_native_sys@0x14012AE30` references `x-aimami-route` (same header) on Windows.
- `api_proxy_config` is stored in **settings JSON**, not `config.toml` — confirmed via settings_deserialize/serialize callees. This differs from relay TOML config (managed_block_migration_core_sys).
- `detect_system_env_proxy_sys` is Windows-specific: uses WinHTTP-adjacent `sub_1400D3090` + `apply_extra_headers_variant_b_sys`. macOS would use system Keychain/CFNetwork proxy APIs instead. **Do not infer macOS behavior from this function.**
- All VAs reference binary SHA a5822387fa3f (Windows 1.0.9 only).
