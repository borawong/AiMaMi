# relay Full-Chain Logic — AiMaMi 1.0.9 Windows x64

binary: AiMaM 1.0.9 win64.exe
sha256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
idb: <source-location>\raw\binary\AiMaM 1.0.9 win64.exe.i64
produced_at: 2026-06-02
sessions: 2026-06-02-relay-A-state-crud, B-router-test-http, C-config-passthrough-diag-20260602

---

## Dispatcher Architecture

All relay commands are dispatched via `auto_switch_multiplex_dispatcher_sys` at 0x1402663E0.
Two dispatch modes observed:
- **Separate owner function**: Most commands have a dedicated owner (A-level string-bound, named `<cmd>_owner_sys`).
- **Inline in dispatcher**: `set_block_official_passthrough` (0x140266cf5) and `run_codex_router_diagnostics` (0x14026853d) are inlined as case blocks in the dispatcher body.

Common IPC invoke array pattern:
```
[command_str, len, scope_key, scope_len, ipc_context_ptr, event_vec_ptr]
```

---

## Common Patterns Across All 18 Commands

### Auth Guard Pattern
- `sub_1400DA320`: checks `(Dst[64] + 16) → app handle capability`; returns 0=ok, non-0=fail
- `sub_1411CE640`: extracts "manager" state arg from IPC frame; result tag=6=Ok, !=6=Err

### Param Extraction
- `get_usage_refresh_interval_core_impl` (0x14045F6C0): generic typed-arg extractor, returns enum Result<T,E> with tag=6=Ok
- `sub_14045Fsource archive0`: RelayNetworkMode parser ("system"→0, "direct"→1)
- `sub_1404632D0` / `sub_140460CD0`: bool arg extractor
- `sub_1400F9FF0`: manager handle extractor (inline commands)

### Response Serialize Pattern
- `sub_14006F000` → `sub_14044BC90`: JSON envelope `{schemaVersion, success, code, message, data}`
- `sub_14006C340`, `sub_14006E780`, `sub_140072700`, `sub_140069740`: variant serializers for different return types
- `tauri_ipc_resolve_sys` (0x140062230): HTTP terminal — external_call_recorded

### IPC Cleanup
- `sub_140298200` (0x140298200): IPC context finalize, called at every exit path
- `sub_1400CA020`: event listener drop
- `sub_1400550D0`: drop temporary Src copy (rate-limit state)

### Rate Limit Guard (write commands only)
- `get_usage_refresh_interval_core_read` (0x1402DCBC0): reads app rate-limit state; LODWORD==3 → blocked → early error return

---

## Command-by-Command Full Chain

### 1. load_relay_state
**Owner**: 0x14027D660 (0x38f bytes)
**Args**: none (scope: "manager")
**Chain**:
1. auth guard sub_1400DA320 + sub_1411CE640 (manager scope)
2. sub_14043BAA0 (core reader):
   - sub_140148EA0 [lock acquire → WakeByAddressSingle — external_call_recorded]
   - sub_140153300 [RwLock read]
   - sub_1401BDED0 [state snapshot]
   - sub_1401802B0 [lock release]
   - sub_140439740 [result pack]
3. sub_14006F000 → sub_14044BC90 [JSON envelope]
4. tauri_ipc_resolve_sys [HTTP terminal]
**Response**: `{schemaVersion, success, code, message, data: RelayState}`
**data.RelayState**: provider list (208-byte structs: id/url/port/network/active/timestamps)
**Side effects**: none (read-only RwLock)

### 2. get_relay_active
**Owner**: 0x140280810 (0x3cf bytes)
**Args**: none (scope: "manager")
**Chain**:
1. auth guard sub_1400DA320 + sub_1411CE640
2. sub_14043B940 (active bool reader):
   - sub_140147AB0 [mutex + bool read from relay lock struct +17]
   - sub_1400F3970 [read active field]
   - WakeByAddressSingle [lock release — external_call_recorded]
3. sub_14006C340 [response serialize]
4. tauri_ipc_resolve_sys [HTTP terminal]
**Response**: `{schemaVersion, success, code, message, data: bool}`
**data encoding**: binary encodes as enum tag=2 + strings "ok"/"enabled" internally; frontend receives bool
**Side effects**: none (read-only mutex)
**Note**: "ok"/"enabled" pair is internal Rust Result/enum representation, not returned as-is to frontend

### 3. get_relay_proxy_status
**Owner**: 0x14027DBF0 (0x38f bytes)
**Args**: none (scope: "manager")
**Chain**:
1. auth guard sub_1400DA320 + sub_1411CE640
2. sub_14043F4F0 → sub_140148BE0 (proxy struct reader):
   - CAS lock _InterlockedCompareExchange8 [external_call_recorded]
   - WakeByAddressSingle [lock release]
   - sub_14105D150 [string encode for url/network]
3. sub_14006E780 [response serialize]
4. tauri_ipc_resolve_sys [HTTP terminal]
**Response**: `{schemaVersion, success, code, message, data: ProxyStatus}`
**ProxyStatus fields** (from offset layout):
- has_proxy: bool (at +74)
- port: u16 (at +72)
- url: string (at +0..16)
- network: string (at +24..40)
- sentinel: 0x8000000000000000 (at +48)
**Side effects**: none (read-only)

### 4. upsert_relay_provider
**Owner**: 0x14026FB40 (0x5de bytes — largest read-write command)
**Args**: input (RelayUpsertInput — scope: "manager", rate-limit: "app")
**Chain**:
1. get_usage_refresh_interval_core_read (app rate-limit; LODWORD==3 → error)
2. sub_1400DA320 + sub_1411CE640 (manager auth)
3. sub_14045F0C0 (input param parse; type discriminant 4 or 5):
   - sub_140548A70 / sub_1407F8140 [input DTO decode]
4. sub_14043E420 (core upsert):
   - sub_140150520 [persistence write — codexmate_lib::core::relay::manager]:
     - _InterlockedCompareExchange8 [CAS lock — external_call_recorded]
     - provider array lookup by id (stride 208)
     - if found: memcpy 0xD0 bytes (update)
     - if not found: sub_1411CDAE0 [vec grow + append]
     - relay_manager_reset_codex_config_impl_sys (0x14014DF10) [Codex config.toml reset]
     - sub_1401523E0 [persistence commit]
     - sub_140572E10 [event notify]
   - sub_140438A30 [result RelayProvider struct pack]
5. sub_140072700 → JSON envelope
6. tauri_ipc_resolve_sys
**Response**: `{schemaVersion, success, code, message, data: RelayProvider}`
**Side effects**: relay state write (upsert by id), config.toml reset, persistence commit, event emit
**Error cases**: rate-limit (LODWORD==3), auth failure, JSON dispatch error, input parse failure (type not 4/5), relay state poisoned (panic)
**String evidence**: "codexmate_lib::core::relay::manager", "src<network-share>", "relay state poisoned"

### 5. delete_relay_provider
**Owner**: 0x140274710 (0x61e bytes)
**Args**: providerId:str (scope: "manager", rate-limit: "app")
**Chain**:
1. get_usage_refresh_interval_core_read (rate limit)
2. sub_1400DA320 + sub_1411CE640 (manager auth)
3. get_usage_refresh_interval_core_impl (providerId param extract; tag==6=Ok)
4. sub_14043C720 (core delete):
   - sub_14014F540 [provider lookup by id]
   - if LODWORD(v16[0])==10 (not found): returns Ok with "ok"/"enabled" struct (idempotent — treated as success)
   - if found: sub_140464400 [serialize/commit] + sub_14045D780 [cleanup]
   - sub_140001370 [drop providerId]
5. sub_140069740 → JSON envelope
6. tauri_ipc_resolve_sys
**Response**: `{schemaVersion, success, code, message, data: RelayStatePayload}`
**Note**: not-found is treated as success (idempotent delete)
**Side effects**: removes provider from relay state, persistence commit (sub_140464400)

### 6. set_relay_provider_network
**Owner**: 0x1402813A0 (0x5ce bytes)
**Args**: providerId:str, network:"system"|"direct" (scope: "manager")
**Chain**:
1. sub_1400DA320 OR sub_1411CE640 (manager auth — OR semantics: either guard passes)
2. get_usage_refresh_interval_core_impl (providerId param; tag==6=Ok)
3. sub_14045Fsource archive0 (network param parse → RelayNetworkMode):
   - sub_140473690 ["system"→0, "direct"→1 by byte comparison]
   - sub_140FF1F70 [variant constructor]
   - error: sub_1411CED90 (from enum table @ off_14127C328)
4. sub_14043FE50 (set network core):
   - sub_140149AD0 [provider lookup by id + network update]
   - sub_140438A30 [result struct pack — 0xD0 bytes memcpy]
5. sub_140072700 → JSON envelope
6. tauri_ipc_resolve_sys
**Response**: `{schemaVersion, success, code, message, data: RelayProvider}`
**RelayNetworkMode**: "system"→variant 0, "direct"→variant 1 (IDA-proven by byte comparison)
**Side effects**: updates relay provider network field in-memory; does NOT call relay_manager_reset_codex_config_impl_sys (unlike upsert)
**Note**: IDA-proven enum from sub_140473690 — most rigidly confirmed interface element across all 18 commands

### 7. activate_relay_provider
**Owner**: 0x14027B060 (0x5ce bytes)
**Args**: providerId:str, ide:str (scope: "manager")
**Chain**:
1. sub_1400DA320 + sub_1411CE640 (manager auth)
2. get_usage_refresh_interval_core_impl (providerId)
3. sub_140463CE0 (ide field extract)
4. sub_14043F680 (core activate persistence write):
   - sub_140152720 [file-path resolution]
   - sub_140464400 [Result propagate]
   - sub_14045D780 [write]
   - sub_140439740 [serialize]
   - sub_140001370 [dealloc]
   → terminated_reason: persistence_commit
5. sub_14006F000 → sub_14044BC90 [state update + tauri_ipc_resolve_sys]
**Response**: Result<(), Error> (no payload body on success)
**Side effects**: persistence write to relay provider state (file-based); no HTTP send

### 8. deactivate_relay_provider
**Owner**: 0x140275030 (0x5ce bytes — structurally identical to activate)
**Args**: providerId:str, ide:str (scope: "manager")
**Chain**: identical to activate_relay_provider except:
- Command string: "deactivate_relay_provider"
- Core impl: sub_14043F960 (deactivate) vs sub_14043F680 (activate)
- File-path resolver: sub_140147510 vs sub_140152720 (different resolvers — different state files)
**Response**: Result<(), Error>
**Side effects**: persistence write for relay deactivation state; no HTTP send

### 9. set_codex_router_enabled
**Owner**: 0x140894BE0 (0x12e3 bytes — large async state machine)
**Args**: app (AppHandle), manager (state), enabled:bool, relaunch:bool (scope: "app"+"manager")
**Gate**: readyToImplement (dim4 CLOSED relay-closeout-109)
**Chain** (async coroutine, phase switch on a1[3536] ∈ {0,1,2,3}):
1. get_usage_refresh_interval_core_read (app state)
2. sub_1400DA320 + sub_1411CE640 (manager guard)
3. sub_1404632D0 (enabled bool)
4. sub_140460CD0 (relaunch bool)
5. sub_1402D3C90 [Arc refcount bump helper — captures 13 Arc fields from relay manager state for async coroutine; NOT config writer]
6. sub_140609780 [tokio task dispatcher — spawns async work unit; calls sub_140EAF5D0]
   - Router state: _InterlockedIncrement64 on reference counts
   - Config.toml write chain (dim4 CLOSED):
     - State persistence: relay_state_json_serializer_sys@0x140467F70
       - Writes codexRouterEnabled field@(struct+292) and blockOfficialPassthrough@(struct+293) to relay state JSON
     - TOML block write: managed_block_migration_core_sys@0x1401D6FE0 →
         toml_block_renderer_core_sys@0x1401D37B0 →
         relay_toml_section_writer_atomic_sys@0x1403C3140 →
         relay_atomic_write_file_sys@0x140332540
     - TOML block markers:
       - Start: "# >>> aimami-relay codex-router top start (DO NOT EDIT MANUALLY)" (64B @0x141274D31)
       - End:   "# <<< aimami-relay codex-router top end" (39B @0x141274C97)
     - TOML field written: "router_enabled = false" or "router_enabled = true"
       - field "router_enabled" @0x14127D042; bool literals "false"@0x141263C8A / "true"@0x141263C8F
       - Struct offset +216 = router_enabled bool flag in renderer input
     - Section stripper: config_toml_aimami_block_stripper_sys@0x14042C4B0
       - Strips all [aimami_relay_*] sections (name len>=13, starts with 'aimami_relay_')
     - Rollback path: relay_manager_set_router_enabled_rollback_sys@0x14014A620
       - On failure: sets manager+316=0, calls relay_state_persist_commit_sys, relay_manager_reset_codex_config_impl_sys
       - Logs "[AiMaMi] rolling back codex_router_enabled to false" @0x14125DA28
       - If reset fails: calls relay_codex_config_toml_write_sys@0x140422D90 (megafunction; strips relay block from config.toml)
7. tauri_ipc_resolve_sys [HTTP terminal]
**Response**: Result<RouterState, Error> or Result<(), Error>
**Side effects**:
  - Writes "router_enabled = true/false" inside TOML block in ~/.codex/config.toml
  - Updates relay state JSON (codexRouterEnabled field)
  - Handles relaunch; router state atomic update via _InterlockedIncrement64
**field strings**: "router_enabled"@0x14127D042, "codexRouterEnabled"@0x14127C082/0x14129B911
**dim4 correction note**: 0x140454D00 (named in prior session) is thread_migration_exists_check_sys — the run_codex_router_diagnostics JSON builder, NOT the TOML writer. The actual TOML write path confirmed via relay_toml_section_writer_atomic_sys + managed_block_migration_core_sys call chain (relay-closeout-109).

### 10. test_relay_provider
**Owner**: 0x1408AF110 (0x158b bytes — large async state machine)
**Args**: manager (state), providerId:str
**Chain** (async, phase switch on a1[10832] ∈ {0,1,2,3}):
1. sub_1400DA320 + sub_1411CE640 (manager auth)
2. get_usage_refresh_interval_core_impl (providerId)
3. sub_140825280 (HTTP send):
   - URL: relay base URL + /v1/messages
   - Headers: x-api-field (0x14125B684), anthropic-version: 2023-06-01 (0x14125B68D)
   - WakeByAddressSingle [async wait — external_call_recorded]
4. sub_140854EE0 [result unwrap]
5. sub_1409645B0 [health score / response parse]
6. sub_140153990 [timestamp calc]
7. sub_1401523E0 [health metric persist]
8. tauri_ipc_resolve_sys
**Response**: RelayTestResult (health/success indicator)
**Side effects**: HTTP GET to /v1/messages; writes health metric to relay state; timestamp persistence
**Windows-specific**: WakeByAddressSingle + _InterlockedCompareExchange8 for async

### 11. test_relay_draft
**Owner**: 0x140913E40 (0x1451 bytes — large async state machine)
**Args**: manager (state), input (draft RelayProvider config)
**Chain**: identical to test_relay_provider but:
- Input: draft config object (not saved providerId)
- sub_1404626C0 extracts draft config (7-field enum Dst[0..6])
- sub_140571180: provider table lookup (208-byte stride, by id string match)
- Same HTTP send via sub_140825280 (/v1/messages)
- "__draft__" fallback id (9-byte string) when provider lookup fails
**Response**: health/test result
**Side effects**: HTTP send to relay, health state write, timestamp persistence

### 12. fetch_relay_models_draft
**Owner**: 0x1408E0870 (0x2d3c bytes — largest async state machine)
**Args**: manager (state), input (draft config)
**Chain** (async):
1. sub_1400DA320 + sub_1411CE640 (manager auth)
2. sub_1404622C0 (draft config extractor variant for models fetch)
3. Inline HTTP send (not via sub_140825280):
   - URL: relay base URL + /v1/models ("usted/v1/models" string evidence)
   - Headers: x-api-field (0x14129CA6D), anthropic-version (0x14129CA76)
   - Method: GET
4. sub_1401AA050 [reqwest/HTTP client send — external_call_recorded]
5. sub_1401AAE50 [response status check]
6. sub_140113280 → sub_140183010 [JSON parse body]
7. sub_1401134F0 [model entry parser]
8. sub_1401133E0 [model name/id extractor]
9. tauri_ipc_resolve_sys
**Response**: `Result<Vec<String>, Error>` (list of model names from relay provider)
**Side effects**: HTTP GET to {relay_url}/v1/models
**Windows-specific**: sub_140C31BF0/sub_140C31B10/sub_140C32FB0 for TLS/HTTPS client config

### 13. export_relay_config
**Owner**: 0x14027A740 (1582 bytes)
**Args**: filePath:str, includeApiKeys:bool (scope: "manager")
**Chain**:
1. sub_1400DA320 + sub_1411CE640 (manager auth)
2. get_usage_refresh_interval_core_impl (filePath)
3. sub_1404632D0 (includeApiKeys bool)
4. relay_config_export_serialize_sanitize_sys (0x14043BE40):
   - sub_140153300 [clone relay state providers]
   - relay_config_export_json_write_sys (0x14042E840):
     - provider loop: id/name/baseUrl/model/extraHeaders per provider
     - apiKey: if includeApiKeys=true → decrypt; if false → 0x8000000000000000 sentinel
     - qmemcpy("AiMaMi 1.0.9", 12) → exportedBy field
     - sub_14041C1F0 [JSON write schemaVersion]
     - sub_1404173A0 [JSON write exportedAt (timestamp ms)]
     - sub_140419670 [JSON write exportedBy/name/baseUrl/model/id]
     - sub_14041B270 [JSON write includeApiKeys bool]
     - sub_140418D20 [JSON write apiKey (conditional)]
     - sub_140469F80 [JSON write extraHeaders (map, optional)]
     - relay_atomic_write_file_sys (0x140332540) [atomic file write — external_call_recorded]
5. tauri_ipc_resolve_sys
**Response**: Ok(bool) via image_compat_build_response_ok_bool_sys
**Output file schema**:
```json
{
  "schemaVersion": <u64>,
  "exportedAt": <u64 ms>,
  "exportedBy": "AiMaMi 1.0.9",
  "includeApiKeys": <bool>,
  "providers": [
    {"id":str, "name":str, "baseUrl":str, "apiKey":str|omitted, "model":str, "extraHeaders":map|omitted}
  ]
}
```
**Side effects**: atomic file write; read-only relay state

### 14. import_relay_config
**Owner**: 0x140270420 (1550 bytes)
**Args**: filePath:str (scope: "manager")
**Chain**:
1. get_usage_refresh_interval_core_read (reads existing relay state)
2. sub_1400DA320 + sub_1411CE640 (manager auth)
3. get_usage_refresh_interval_core_impl (filePath)
4. relay_config_import_parse_sys (0x14043C2C0):
   - sub_140147C70 [file read + JSON deserialize → Vec<RelayProvider>]
   - sub_14000A1E0 [drop existing providers slice]
5. sub_14006AA80 [apply imported providers + persist]
6. tauri_ipc_resolve_sys
**Response**: import result (importedCount/skippedCount inferred)
**Side effects**: reads file; replaces relay state providers (destructive replace); config.toml persistence

### 15. set_block_official_passthrough
**Owner**: INLINE in dispatcher at 0x140266cf5
**Args**: manager (handle), blocked:bool
**Chain**:
1. sub_1400F9FF0 (manager handle extract)
2. sub_1404632D0 (blocked bool extract)
3. set_block_official_passthrough_write_sys (0x140440370):
   - sub_14014DD10 (relay_state_block_passthrough_atomic_write_sys):
     - _InterlockedCompareExchange8(relay_state+16, 1, 0) [CAS lock]
     - v4[317] = a3 [write blocked bool at relay state offset +317]
     - WakeByAddressSingle(relay_state+16) [release]
     - sub_140153300 [clone relay state]
     - sub_1401523E0 [persist to config.toml — external_call_recorded]
   - image_compat_build_response_ok_bool_sys (0x1404391D0) [Ok(bool) response]
4. memcpy + tauri_ipc_resolve_sys
**Response**: `{"value": <bool>}` (echoes blocked value set)
**Config.toml field**: `blockOfficialPassthrough = true|false`
**Relay state**: offset +16 = lock byte (CAS), offset +317 = blockOfficialPassthrough bool
**Error**: "relay state poisoned" panic (0x14125D823)

### 16. get_passthrough_audit_log
**Owner**: 0x14026E440 (959 bytes)
**Args**: limit:u64 (optional, default 50)
**Chain**:
1. sub_140460EC0 (limit arg extract; default 50 from disasm `mov a3, 50`)
2. passthrough_audit_log_read_sys (0x14043FC40):
   - codex_paths_build_from_env_sys (0x140476200) [build ~/.codex/ path]
   - codex_paths_join_all_subpaths (0x140476350) [full paths]
   - passthrough_audit_log_filter_sys (0x14042E190):
     - sub_141035180 [build path: ~/.codex/passthrough-audit.jsonl]
     - sub_14104DEE0 [open + read JSONL file — external_call_recorded]
     - sub_14009DCF0 [filter: take last N entries]
3. tauri_ipc_resolve_sys
**Response**: array of PassthroughAuditEntry (7 fields, struct metadata @ 0x141269F09)
**File**: `~/.codex/passthrough-audit.jsonl`
**PassthroughAuditEntry** (7 fields inferred from struct string "struct PassthroughAuditEntry with 7 elements"):
- timestamp, model, provider, status, requestId, durationMs, error (field names inferred from module context passthrough_audit.rs @ 0x14127B306)
**Side effects**: read-only; no relay state mutation; no manager auth check (no sub_1400DA320)

### 17. run_codex_router_diagnostics
**Owner**: INLINE in dispatcher at 0x14026853d
**Args**: manager (handle)
**Chain**:
1. sub_1400F9FF0 (manager handle)
2. run_codex_router_diagnostics_core_sys (0x140440130):
   - codex_paths_build_from_env_sys [build ~/.codex/]
   - codex_paths_join_all_subpaths [full paths]
   - sub_140153300 [clone relay state for read]
   - sub_1403A6B60 (diagnostic runner):
     - sub_14104DEE0 [file open+read — external_call_recorded]
     - sub_140262F50 [config section validator]
     - sub_1403C37A0, sub_1403C3D20, sub_14038A3F0, sub_14038A5D0 [per-section checks]
     - sub_1403BFE10 [router state checker]
     - sub_14042C1C0 [result formatter]
3. sub_14029CBB0 [format diagnostics into IPC response struct]
4. tauri_ipc_resolve_sys
**Response**: diagnostics report with sections array (names/status/detail inferred)
**Side effects**: read-only; reads ~/.codex/ config files; no state mutation; no kill/restart

### 18. fix_codex_router_issue
**Owner**: 0x140284970 (1217 bytes)
**Args**: manager (state), itemId:str
**Chain**:
1. sub_1400DA320 + sub_1411CE640 (manager auth)
2. get_usage_refresh_interval_core_impl (itemId extract)
3. fix_codex_router_issue_core_sys (0x14043E710):
   - codex_paths_build_from_env_sys [build ~/.codex/]
   - codex_paths_join_all_subpaths
   - sub_140153300 [clone relay state]
   - itemId dispatch:
     - "all" (3 bytes) → sub_1403C9DE0 [fix all sections]
     - else → sub_1403CDA60 [fix targeted section by itemId]:
       - case 0xC=12: "config_title"
       - case 0xE=14: "auth_integrity"
       - case 0x12=18: "codex_identity_type"
       - case 0x13=19: "extra_headers"
       - case 0x15=21: "relay_provider_id"
       - case 0x17=23: "proxy_settings"
   - sub_1403FC1C0("Codex", 5) [check if Codex process running]
   - if running → quit_codex_wait_fallback_kill_sys (0x140254140) [SIGTERM→SIGKILL at 8s — external_call_recorded]
4. sub_140067180 [dispatch fix result to IPC]
5. tauri_ipc_resolve_sys
**Response**: Vec<FixResultItem> = [{section: str, success: bool, detail: str|null}]
**Side effects**: DESTRUCTIVE — kills Codex process; modifies ~/.codex/ config sections
**itemId values**: "all", "config_title", "auth_integrity", "codex_identity_type", "extra_headers", "relay_provider_id", "proxy_settings"

---

## source archive Implementation Delta Notes (from commands/relay.rs)

Reading the source archive source at src-tauri/src/commands/relay.rs reveals field behavioral deltas vs upstream:

1. **load_relay_state**: source archive uses `relay::build_state_payload(repo.paths())` — synchronous, file-based (no in-memory RwLock). Upstream uses in-memory RwLock state; source archive reads from filesystem each call.

2. **get_relay_active**: source archive uses `relay::build_active_payload(repo.paths())` — returns `RelayActivePayload`. Upstream returns an enum-encoded bool.

3. **get_relay_proxy_status**: source archive uses `relay::proxy::status()` — no args at all (no repo even), calls proxy module directly. Upstream takes manager scope.

4. **upsert_relay_provider**: source archive takes `RelayUpsertInput` as direct arg. source archive also calls `tray_menu::refresh_tray_menu` after upsert (side effect not in upstream).

5. **delete_relay_provider**: source archive accepts `id: Option<String>` or `provider_id: Option<String>` (backward compat), returns `RelayStatePayload`. Upstream returns single provider struct.

6. **set_relay_provider_network**: source archive accepts both `id` and `provider_id` options; returns `RelayProvider`. Also calls `tray_menu::refresh_tray_menu`.

7. **activate/deactivate**: source archive adds `prepare_codex_router_edit()` (calls `stop_codex_app_gracefully`) before the core op. Upstream does the same via `quit_codex_wait_fallback_kill_sys` internally.

8. **set_codex_router_enabled**: source archive does NOT have `relaunch` as a separate arg — it always relaunches after toggle (via `launch_codex_after_router_edit`). Upstream has explicit `relaunch` bool.

9. **export_relay_config**: source archive returns `RelayExportFile` struct AND optionally writes to file. Upstream writes to filePath and returns bool.

10. **import_relay_config**: source archive accepts either a pre-parsed `RelayExportFile` object OR a `filePath` string (two-form API). Upstream only takes filePath.

11. **test_relay_provider/test_relay_draft/fetch_relay_models_draft**: source archive uses `async + spawn_blocking` (reqwest blocking client). Upstream uses native Windows async state machine. Semantically equivalent.

12. **diagnose_codex_router** (source archive name) = **run_codex_router_diagnostics** (upstream name). Command name differs!

13. **fix_codex_router_issue**: source archive accepts both `issue_id` and `item_id` for backward compat.

14. **set_block_official_passthrough**: NOT in source archive relay.rs as a separate command. May be covered by a different command or may need to be added.

15. **get_passthrough_audit_log**: NOT found in source archive relay.rs. Appears to be a new/missing command in source archive implementation.
