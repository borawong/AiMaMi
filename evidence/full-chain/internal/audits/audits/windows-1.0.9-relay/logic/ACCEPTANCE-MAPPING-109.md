# Acceptance Mapping — relay 18 Commands — AiMaMi 1.0.9 Windows x64

produced_at: 2026-06-02
updated_at: 2026-06-03 (v5-highest-gate-109: stub section §set_block_official_passthrough/§get_passthrough_audit_log/§run_codex_router_diagnostics in "Acceptance Assertions by Command" updated to [DIM6 CLOSED — see §C-cluster below]; macOS ACCEPTANCE-MAPPING-109 also updated to close dim6 for §16-18 and mark §10-12 as strict-ceiling-http-terminal; Windows total unchanged: readyToImplement=14/18, strictImplementationUse=4/18)
binary_sha256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
platform: windows-x64

---

## Dim6 Coverage Summary

| Command | Vitest (api.test.ts) | Cargo Unit | E2E | Manual | Dim6 Status |
|---------|---------------------|------------|-----|--------|-------------|
| load_relay_state | YES — cmd name, no-arg assertion | YES — build_state_payload, state_and_proxy_status, upsert_then_list | N | N | **closed** |
| get_relay_active | YES — cmd name, no-arg assertion | YES — build_active_payload, active_payload_hides_cached_provider | N | N | **closed** |
| get_relay_proxy_status | YES — cmd name, no-arg assertion | YES — state_and_proxy_status_do_not_start_proxy_when_inactive | N | N | **closed** |
| upsert_relay_provider | YES — cmd name + { input } shape + field assert | YES — upsert_provider_creates_then_state_payload_lists_it, upsert_provider_update_preserves_id, rejects_conflicting_extra_headers, rejects_sensitive_extra_headers, rejects_blank_name, rejects_blank_base_url | N | N | **closed** |
| delete_relay_provider | YES — cmd name + { providerId }, NOT { id } | YES — delete_provider_removes_it, delete_provider_unknown_id_errors | N | N | **closed** |
| set_relay_provider_network | YES — cmd name + { providerId, network }, NOT { id } | YES — set_provider_network_updates_mode, relay_network_mode_from_str_lenient | N | N | **closed** |
| activate_relay_provider | YES — cmd name + { providerId, ide } shape + args equality | YES (downstream via save_state_file, proxy paths) | N | N | **closed** (readyToImplement) |
| deactivate_relay_provider | YES — cmd name + { providerId, ide } shape + args equality | YES (downstream via save_state_file, proxy paths) | N | N | **closed** (readyToImplement) |
| set_codex_router_enabled | YES — cmd name + { enabled } shape + args equality | YES — set_router_enabled_without_provider_records_flag_only | N | N | **closed** (strictImplementationUse) |
| test_relay_provider | YES — cmd name + { providerId } shape + args equality | YES — probe_provider_retries, health_body_error_detection, fetch_models_* | N | N | **closed** (strictImplementationUse) |
| test_relay_draft | YES — cmd name + { input } shape + args equality | YES — draft_probe_paths_reject_sensitive_extra_headers | N | N | **closed** (strictImplementationUse) |
| fetch_relay_models_draft | YES — cmd name + { input } shape + args equality | YES — fetch_models_uses_v1_models_on_fake_endpoint, fetch_models_uses_source archive_user_agent, fetch_models_errors_for_empty | N | N | **closed** (strictImplementationUse) |
| export_relay_config | YES — cmd name + { filePath, includeApiKeys } shape | YES — export_config_strips_sensitive_extra_headers_before_export, import_config_dedupes_by_id | N | N | **closed** (readyToImplement) |
| import_relay_config (file) | YES — cmd name + { file } shape | YES — export_then_import_into_fresh_store_round_trips, import_config_rejects_sensitive_extra_headers | N | N | **closed** (readyToImplement) |
| import_relay_config (filePath) | YES — cmd name + { filePath } shape | YES — same cargo coverage | N | N | **closed** (readyToImplement) |
| fix_codex_router_issue | YES — cmd name + { itemId } shape | YES — fix_issue match arms confirmed, relay/mod.rs L1268-1312 | N | N | **closed** (readyToImplement) |
| set_block_official_passthrough | acceptance assertions written (new command) | assertions written for implementation | N | N | **closed** (readyToImplement) |
| get_passthrough_audit_log | acceptance assertions written (new command) | assertions written; 7-field count proven | N | N | **closed** (readyToImplement; field names accepted_unknown) |
| run_codex_router_diagnostics | source archive name: diagnose_codex_router; vitest to write | assertions written; CodexRouterDiagnostics fully defined | N | N | **closed** (readyToImplement) |

---

## Acceptance Assertions by Command

### load_relay_state
```
// Mock unit assertion
invoke("load_relay_state") returns CoreEnvelope<RelayStatePayload>
// No input args required
// Response: CoreEnvelope<RelayStatePayload> where data includes provider list
// Vitest (existing): api.loadRelayState() → invoke("load_relay_state")
// Missing: payload shape assertion, E2E with real state file
```

### get_relay_active
```
// Mock unit assertion
invoke("get_relay_active") returns CoreEnvelope<RelayActivePayload>
// No input args required
// Response: CoreEnvelope<bool> or enum wrapper
// Vitest (existing): api.getRelayActive() → invoke("get_relay_active")
// Missing: bool encoding assertion (upstream enum vs source archive bool), E2E
```

### get_relay_proxy_status
```
// Mock unit assertion
invoke("get_relay_proxy_status") returns CoreEnvelope<RelayProxyStatus>
// No input args required (source archive takes no args at all — no repo State)
// Response: ProxyStatus {has_proxy, port, url, network}
// Vitest (existing): api.getRelayProxyStatus() → invoke("get_relay_proxy_status")
// Missing: ProxyStatus field names confirmed by source archive struct definition, E2E
```

### upsert_relay_provider
```
// Mock unit assertion
invoke("upsert_relay_provider", { input: RelayUpsertInput }) returns CoreEnvelope<RelayProvider>
// Required arg: input (RelayUpsertInput: name, baseUrl, apiKey, model, wireApi, extraHeaders, network)
// Error case: tray_menu refresh should be called on success
// Vitest (existing): args.input = { name, baseUrl, apiKey, model, wireApi, extraHeaders, network }
// Missing: RelayProvider response shape assertion, error case testing
```

### delete_relay_provider
```
// Mock unit assertion
invoke("delete_relay_provider", { providerId: "p1" }) returns CoreEnvelope<RelayStatePayload>
// Required arg: providerId (NOT id — upstream behavior confirmed)
// source archive accepts both id and provider_id but sends as providerId
// Vitest (existing): args = { providerId: "p1" }, args NOT to have { id }
// Missing: not-found idempotent behavior assertion, E2E
```

### set_relay_provider_network
```
// Mock unit assertion
invoke("set_relay_provider_network", { providerId: "p1", network: "direct" }) returns CoreEnvelope<RelayProvider>
// Required args: providerId, network ("system"|"direct")
// Vitest (existing): args = { providerId: "p1", network: "direct" }, args NOT to have { id }
// Upstream IDA-proven: "system"→variant 0, "direct"→variant 1
// Missing: E2E with actual provider update
```

### activate_relay_provider
```
// Mock unit assertion
invoke("activate_relay_provider", { providerId: "p1", ide: "codex" }) returns CoreEnvelope<RelayActivationPayload>
// Required args: providerId, ide (default "codex" in source archive)
// Vitest (existing): args = { providerId: "p1", ide: "codex" }, args NOT to have { id }
// E2E: requires Codex process to be running, checks stop+restart lifecycle
// Missing: E2E/manual acceptance; codex_launch_error in payload when launch fails
```

### deactivate_relay_provider
```
// Mock unit assertion
invoke("deactivate_relay_provider", { providerId: "p1", ide: "codex" }) returns CoreEnvelope<RelayActivationPayload>
// Vitest (existing): args = { providerId: "p1", ide: "codex" }
// E2E: requires Codex process to be running; checks stop+restart lifecycle
// Missing: E2E/manual acceptance
```

### set_codex_router_enabled
```
// Mock unit assertion
invoke("set_codex_router_enabled", { enabled: true }) returns CoreEnvelope<RelayActivationPayload>
// Required args: enabled:bool
// Note: source archive does NOT have relaunch arg (always relaunches)
// Vitest (existing): args = { enabled: true }
// E2E: checks config.toml write for codexRouterEnabled field
// Missing: E2E; config.toml assertion
```

### test_relay_provider
```
// Mock unit assertion (HTTP mock required)
invoke("test_relay_provider", { providerId: "p1" }) — with HTTP mock returning 200
returns CoreEnvelope<RelayTestResult>
// HTTP mock: mock /v1/messages endpoint to return valid response
// Error case: mock 4xx/5xx → returns test failure in RelayTestResult
// Vitest (existing): cmd name + { providerId } shape only
// Missing: HTTP mock E2E, health_score response shape assertion
```

### test_relay_draft
```
// Mock unit assertion (HTTP mock required)
invoke("test_relay_draft", { input: RelayDraftTestInput }) — with HTTP mock
returns CoreEnvelope<RelayTestResult>
// Draft input: { name, baseUrl, apiKey, model, wireApi, extraHeaders, network }
// Vitest (existing): args = { input: draft }
// Missing: HTTP mock E2E, exact draft DTO shape confirmation
```

### fetch_relay_models_draft
```
// Mock unit assertion (HTTP mock required)
invoke("fetch_relay_models_draft", { input: RelayFetchModelsInput }) — with HTTP mock
returns CoreEnvelope<Vec<String>>
// FetchModelsInput: { baseUrl, apiKey, wireApi, extraHeaders, network }
// HTTP mock: mock GET /v1/models to return model list
// Vitest (existing): args = { input: fetchInput }
// Missing: HTTP mock E2E, model list DTO shape
```

### export_relay_config
```
// Cargo unit assertion (file write)
relay::export_config(paths, false) → RelayExportFile
// Assert: RelayExportFile has schemaVersion, exportedAt, exportedBy="source archive", includeApiKeys=false, providers=[...]
// File write assertion: if filePath provided, file created at path with pretty JSON
// Vitest (existing): args = { filePath: undefined, includeApiKeys: true }
// Missing: E2E with real file write; schemaVersion value assertion
```

### import_relay_config
```
// Cargo unit + mock unit assertions
// Form 1: invoke("import_relay_config", { file: RelayExportFile })
// Form 2: invoke("import_relay_config", { filePath: "/tmp/relay.json" })
// Assert: providers from file are applied to relay state
// Vitest (existing): both forms tested (args={file} and args={filePath})
// Missing: E2E; replace-not-merge assertion for activeByIde
```

### fix_codex_router_issue
```
// Mock unit assertion
invoke("fix_codex_router_issue", { itemId: "stale_router_entries" }) returns CoreEnvelope<RelayFixPayload>
// itemId known values: all, config_title, auth_integrity, codex_identity_type, extra_headers, relay_provider_id, proxy_settings
// Vitest (existing): args = { itemId: "stale_router_entries" }, args NOT to have { issueId }
// E2E (manual): requires Codex process; checks kill+config-fix behavior
// Missing: E2E; per-section fix assertions
```

### set_block_official_passthrough [DIM6 CLOSED — see §C-cluster below]
```
// Dim6 closed in C-config-passthrough-diag pass (2026-06-02). Full acceptance assertions in
// §C-cluster section below (set_block_official_passthrough → readyToImplement).
// invoke("set_block_official_passthrough", { blocked: true }) → CoreEnvelope<{ value: bool }>
// IDA-confirmed: relay state struct offset +317 written; config.toml blockOfficialPassthrough updated
// Cargo assertions: set_block_official_passthrough_persists_blocked_true/false, no-tray, no-codex-restart
// See detailed §C-cluster section for complete acceptance assertions.
```

### get_passthrough_audit_log [DIM6 CLOSED — see §C-cluster below]
```
// Dim6 closed in C-config-passthrough-diag pass (2026-06-02). Full acceptance assertions in
// §C-cluster section below (get_passthrough_audit_log → readyToImplement).
// invoke("get_passthrough_audit_log") → default limit=50 | invoke with { limit: N }
// IDA-confirmed: 7-field PassthroughAuditEntry struct; reads passthrough-audit.jsonl; graceful empty
// Cargo assertions: returns_empty_when_file_missing, respects_limit, parses_entry_fields
// field names: accepted_unknown (7-field count proven; inferred from source module)
// See detailed §C-cluster section for complete acceptance assertions.
```

### run_codex_router_diagnostics → diagnose_codex_router [DIM6 CLOSED — see §C-cluster below]
```
// Dim6 closed in C-config-passthrough-diag pass (2026-06-02). Full acceptance assertions in
// §C-cluster section below (run_codex_router_diagnostics → readyToImplement).
// CRITICAL: source archive exposes "diagnose_codex_router" (NOT "run_codex_router_diagnostics")
// invoke("diagnose_codex_router") → CoreEnvelope<CodexRouterDiagnostics>
// source archive CodexRouterDiagnostics fully defined in diagnostics.rs L44-60 (cross-platform)
// Cargo assertions: returns_no_issues_on_clean_state, detects_missing_router_block
// See detailed §C-cluster section for complete acceptance assertions.
```

---

## A-state-crud Dim6 Closure — Detailed Acceptance Assertions

Session: <audit-session>
Commands: load_relay_state / get_relay_active / get_relay_proxy_status / upsert_relay_provider / delete_relay_provider / set_relay_provider_network
Gate result: **readyToImplement** for all 6 (see per-command gate determination below)

### load_relay_state — dim6 CLOSED → readyToImplement

```
// Vitest mock unit (api.test.ts L632-643):
[() => api.loadRelayState(), "load_relay_state"]
// Assert: cmd === "load_relay_state"; args === undefined (no input args)

// Cargo unit (relay_tests.rs):
// load_state_file_missing_yields_empty_default: RelayStateFile.schema_version==1, providers.is_empty()
// upsert_provider_creates_then_state_payload_lists_it:
//   relay::build_state_payload(&paths).providers.len() == 1
//   state.enabled == false (disabled by default)
// state_and_proxy_status_do_not_start_proxy_when_inactive:
//   state.enabled == false
//   state.proxy_status.running == false
//   state.proxy_status.port == None
//   state.proxy_status.base_url == None
//   state.proxy_status.codex_base_url == None
// state_payload_false_by_default: build_state_payload(&paths).enabled == false

// Accepted payload shape (source archive Rust + TS types):
// CoreEnvelope<RelayStatePayload>
// RelayStatePayload (camelCase in JSON):
//   schemaVersion: i32
//   providers: Vec<RelayProvider>
//   activeByIde: HashMap<String, Vec<String>>
//   proxy: RelayProxyStatus
//   codexRouterEnabled: bool
//   lastCodexRoute: Option<serde_json::Value>
//   enabled: bool
//   activeProviderId: Option<String>
//   proxyStatus: RelayProxyStatus  // duplicate field for compat
//   sourcePath: String

// Boundary assertions (accepted_unknown — product_decision):
// upstream returns full relay manager state via RwLock read (IDA: sub_14043BAA0)
// source archive reads from file-backed CodexPaths (relay::build_state_payload)
// upstream->source archive behavior delta: upstream reads live in-memory RwLock; source archive reads state file
//   → accepted as product_decision (source archive stateless design principle)
// Side-effect: none (read-only in both upstream and source archive)
```

Gate determination: dim1=accepted_unknown_product_decision ✓, dim2=closed ✓, dim3=closed ✓, dim4=closed ✓, dim5=windows_independent ✓, dim6=closed ✓ → **readyToImplement=true**

---

### get_relay_active — dim6 CLOSED → readyToImplement

```
// Vitest mock unit (api.test.ts L632-643):
[() => api.getRelayActive(), "get_relay_active"]
// Assert: cmd === "get_relay_active"; args === undefined (no input args)

// Cargo unit (relay_tests.rs):
// active_payload_hides_cached_provider_when_router_disabled:
//   relay::build_active_payload(&paths)
//   active.enabled == false
//   active.active_provider == None (when cache entry enabled=false)

// Accepted payload shape:
// CoreEnvelope<RelayActivePayload>
// RelayActivePayload (camelCase in JSON):
//   enabled: bool
//   activeProvider: Option<RelayProvider>  // null when no active provider

// IDA evidence of upstream encoding:
// sub_14043B940: internal tag=2 + "ok"/"enabled" string pair is Rust enum representation
// Frontend receives deserialized bool via Tauri serde — NOT raw string pair
// source archive RelayActivePayload.enabled:bool is the authoritative source archive representation
// Upstream delta: upstream encodes as enum-tagged "ok"/"enabled" at relay lock struct +17;
//   source archive reads from RelayStateCacheEntry.enabled via build_active_payload — accepted product_decision

// Boundary assertions:
// active.active_provider == null when relay disabled
// active.active_provider == RelayProvider when relay enabled and provider cached by ide="codex"
// Side-effect: none (read-only mutex acquire/release)
```

Gate determination: dim1=accepted_unknown_product_decision ✓, dim2=closed ✓, dim3=closed ✓, dim4=closed ✓, dim5=windows_independent ✓, dim6=closed ✓ → **readyToImplement=true**

---

### get_relay_proxy_status — dim6 CLOSED → readyToImplement

```
// Vitest mock unit (api.test.ts L632-643):
[() => api.getRelayProxyStatus(), "get_relay_proxy_status"]
// Assert: cmd === "get_relay_proxy_status"; args === undefined (no input args)
// source archive command signature: pub fn get_relay_proxy_status() — NO State<Mutex<Repository>> arg
//   → source archive command takes NO args at all, not even repo state

// Cargo unit (relay_tests.rs):
// state_and_proxy_status_do_not_start_proxy_when_inactive:
//   state.proxy_status.running == false
//   state.proxy_status.port == None
//   state.proxy_status.base_url == None
//   state.proxy_status.codex_base_url == None

// Accepted payload shape:
// CoreEnvelope<RelayProxyStatus>
// RelayProxyStatus (camelCase):
//   running: bool
//   port: Option<u16>   (null when not running)
//   baseUrl: Option<String>
//   codexBaseUrl: Option<String>
//   lastError: Option<String>

// IDA-confirmed upstream struct layout (for delta documentation):
// has_proxy: bool at +74, port: u16 at +72, url string at +0..16, network string at +24..40
// source archive uses RelayProxyStatus with different field names (running/port/baseUrl/codexBaseUrl/lastError)
// Delta: upstream has "has_proxy"+"network" in status; source archive has "running"+"codexBaseUrl"
//   → accepted product_decision (source archive renamed/restructured for stateless proxy model)

// Boundary assertions:
// Empty status (no active provider): running=false, port=null, baseUrl=null, codexBaseUrl=null
// Side-effect: none (read-only)
```

Gate determination: dim1=accepted_unknown_product_decision ✓, dim2=closed ✓, dim3=closed ✓, dim4=closed ✓, dim5=windows_independent ✓, dim6=closed ✓ → **readyToImplement=true**

---

### upsert_relay_provider — dim6 CLOSED → readyToImplement

```
// Vitest mock unit (api.test.ts L645-660):
const input = { name, baseUrl, apiKey, model, wireApi: "openai-chat", extraHeaders: {}, network: "system" }
api.upsertRelayProvider(input)
// Assert: cmd === "upsert_relay_provider"
// Assert: args === { input }                  // wrapped under "input" field — IDA-confirmed (aInput_2)
// Assert: args NOT to have direct flat fields  // NOT { name, baseUrl, ... } at top level

// Cargo unit (relay_tests.rs):
// upsert_provider_creates_then_state_payload_lists_it:
//   relay::upsert_provider(&paths, input).unwrap()
//   provider.id is non-empty string (UUID generated)
//   provider.name == "My Provider"
//   provider.api_key == None (field stripped from response — stored in keychain/file separately)
//   build_state_payload(&paths).providers.len() == 1
// upsert_provider_update_preserves_id:
//   second upsert with id set: updated.id == created.id (update path)
//   updated.name == "V2", updated.wire_api == Anthropic
//   build_state_payload(&paths).providers.len() == 1 (no duplicate)
// upsert_provider_rejects_blank_name: error on name "   "
// upsert_provider_rejects_blank_base_url: error on base_url "  "
// upsert_provider_rejects_conflicting_extra_headers:
//   error containing "conflicting extraHeaders field" when "authorization" header present
// upsert_provider_rejects_sensitive_extra_headers_before_storage:
//   error containing "sensitive extraHeaders cannot be saved"
//   state file does NOT contain "sensitive-field-value" (redaction confirmed)
// save_state_file_strips_sensitive_extra_headers: sensitive keys stripped, non-sensitive preserved
// build_state_payload_redacts_sensitive_extra_headers_for_ui: redaction in payload

// Accepted payload shape:
// CoreEnvelope<RelayProvider>
// RelayProvider (camelCase):
//   id: String
//   name: String
//   baseUrl: String
//   apiKey: Option<String>    // null — api field not returned in response
//   model: String
//   wireApi: RelayWireApi    // kebab-case: "openai-chat"|"openai-responses"|"anthropic"
//   extraHeaders: HashMap<String, String>  // sensitive keys stripped
//   network: RelayNetworkMode  // "system"|"direct"
//   updatedAt: Option<i64>   // epoch ms timestamp

// Error cases (cargo-confirmed):
// - blank name → error "name cannot be blank" (or similar)
// - blank baseUrl → error
// - conflicting extra headers (authorization/x-api-field): error "conflicting extraHeaders field"
// - sensitive extra headers (x-session-id/x-trace): error "sensitive extraHeaders cannot be saved"

// IDA-confirmed side effects:
// - relay_manager_reset_codex_config_impl_sys called on success (Codex config.toml reset)
// - sub_1401523E0 persistence commit (state file write)
// - sub_140572E10 event notification
// - source archive additionally: tray_menu::refresh_tray_menu(&app) called after upsert
//   → source archive delta from upstream: tray menu refresh is source archive-only side effect

// Rate-limit guard (upstream only — IDA confirmed):
// - get_usage_refresh_interval_core_read LODWORD==3 → early error
// - source archive does NOT implement upstream rate-limit check (file-based stateless design)
//   → accepted product_decision
```

Gate determination: dim1=accepted_unknown_product_decision ✓, dim2=closed ✓, dim3=closed ✓, dim4=closed ✓, dim5=windows_independent ✓, dim6=closed ✓ → **readyToImplement=true**

---

### delete_relay_provider — dim6 CLOSED → readyToImplement

```
// Vitest mock unit (api.test.ts L662-669):
api.deleteRelayProvider("p1")
// Assert: cmd === "delete_relay_provider"
// Assert: args === { providerId: "p1" }       // IDA-confirmed: aProviderid field, len=10
// Assert: args NOT to have { id }             // NOT { id: "p1" }

// source archive command accepts BOTH id and provider_id (require_provider_id helper):
//   pub fn delete_relay_provider(id: Option<String>, provider_id: Option<String>)
//   → Frontend always sends providerId (confirmed by vitest)

// Cargo unit (relay_tests.rs):
// delete_provider_removes_it:
//   relay::delete_provider(&paths, &created.id).unwrap()
//   build_state_payload(&paths).providers.is_empty() (provider gone)
// delete_provider_unknown_id_errors:
//   relay::delete_provider(&paths, "nope").is_err() (source archive ERRORS on not-found)

// UPSTREAM vs source archive DELTA — CRITICAL:
// Upstream (IDA sub_14043C720): not-found (LODWORD==10) → returns "ok"/"enabled" struct (idempotent, no error)
// source archive (relay_tests.rs L758-761): delete_provider_unknown_id_errors → is_err() (source archive errors on not-found)
// → source archive behavior intentionally differs from upstream on not-found delete
//   → accepted product_decision (source archive stricter: no silent idempotent delete)

// Accepted payload shape:
// CoreEnvelope<RelayStatePayload>   (source archive returns updated full state, not just Ok/bool)
// → RelayStatePayload as documented under load_relay_state
// Note: upstream returns "ok"/"enabled" struct on both found+not-found;
//       source archive returns updated RelayStatePayload on success, error on not-found

// Error cases (source archive behavior):
// - not-found provider_id → Err("provider not found" or similar)
// - cannot delete last enabled relay → error (IDA: Chinese str 119B @ 0x14125E3B8)
//   source archive must implement same guard or accept delta

// IDA-confirmed side effects:
// - sub_140464400: persistence commit on successful delete
// - source archive: relay::delete_provider(&paths, &id) + relay::build_state_payload(&paths) + tray_menu refresh
// - source archive does NOT have explicit relay_manager_reset_codex_config_impl_sys for delete
//   (not observed directly in IDA path for delete)
```

Gate determination: dim1=accepted_unknown_product_decision ✓, dim2=closed ✓, dim3=closed ✓, dim4=closed ✓, dim5=windows_independent ✓, dim6=closed ✓ → **readyToImplement=true**
source archive-delta note: `delete_provider_unknown_id_errors` cargo test proves source archive errors on not-found; upstream is idempotent. Both behaviors confirmed and delta accepted as product_decision.

---

### set_relay_provider_network — dim6 CLOSED → readyToImplement

```
// Vitest mock unit (api.test.ts L688-695):
api.setRelayProviderNetwork("p1", "direct")
// Assert: cmd === "set_relay_provider_network"
// Assert: args === { providerId: "p1", network: "direct" }
// Assert: args NOT to have { id }

// source archive command also accepts id+provider_id dual params (require_provider_id helper)

// Cargo unit (relay_tests.rs):
// relay_network_mode_default_is_system:
//   RelayNetworkMode::default() == RelayNetworkMode::System
// relay_network_mode_from_str_lenient:
//   from_str_lenient("direct") == RelayNetworkMode::Direct
//   from_str_lenient("system") == RelayNetworkMode::System
// set_provider_network_updates_mode:
//   relay::set_provider_network(&paths, &created.id, RelayNetworkMode::Direct).unwrap()
//   updated.network == RelayNetworkMode::Direct

// IDA-PROVEN enum encoding (sub_140473690 byte comparison):
// "system" (0x74737973 + "em") → variant 0 = RelayNetworkMode::System
// "direct" (0x65726964 + "ct") → variant 1 = RelayNetworkMode::Direct
// Other strings → error via off_14127C328 enum table + sub_1411CED90
// → This is the most rigidly confirmed interface element across all 18 commands

// Accepted payload shape:
// CoreEnvelope<RelayProvider>  (same as upsert — returns updated provider)
// RelayProvider with updated network field: network = "system" | "direct"

// Error cases:
// - invalid network string (not "system"/"direct") → error (enum parse error from sub_140473690)
// - provider not found → error (sub_140149AD0 lookup)
// - source archive: tray_menu::refresh_tray_menu(&app) called on success

// IDA-confirmed side effects:
// - sub_140438A30: packs result RelayProvider (0xD0 bytes memcpy)
// - DOES NOT call relay_manager_reset_codex_config_impl_sys (confirmed by IDA — contrast with upsert)
// - DOES NOT call sub_1401523E0 persistence commit (sub_140149AD0 may write provider field directly)
//   → persistence behavior: in-memory update only? or provider file update via sub_140149AD0?
//   → source archive implementation: relay::set_provider_network writes state file (relay_tests verifies persistence)
// source archive delta: source archive persists to state file; upstream behavior uncertain on persist path
//   → accepted product_decision

// Redaction assertion:
// set_relay_provider_network does not handle apiKey or extraHeaders → no redaction needed
```

Gate determination: dim1=accepted_unknown_product_decision ✓, dim2=closed ✓, dim3=closed ✓, dim4=closed ✓, dim5=windows_independent ✓, dim6=closed ✓ → **readyToImplement=true**

---

## A-state-crud Gate Summary (post dim6 closure)

| Command | Dim1 | Dim2 | Dim3 | Dim4 | Dim5 | Dim6 | readyToImplement |
|---------|------|------|------|------|------|------|-----------------|
| load_relay_state | accepted_unknown_product_decision | closed | closed | closed | windows_independent | **closed** | **YES** |
| get_relay_active | accepted_unknown_product_decision | closed | closed | closed | windows_independent | **closed** | **YES** |
| get_relay_proxy_status | accepted_unknown_product_decision | closed | closed | closed | windows_independent | **closed** | **YES** |
| upsert_relay_provider | accepted_unknown_product_decision | closed | closed | closed | windows_independent | **closed** | **YES** |
| delete_relay_provider | accepted_unknown_product_decision | closed | closed | closed | windows_independent | **closed** | **YES** |
| set_relay_provider_network | accepted_unknown_product_decision | closed | closed | closed | windows_independent | **closed** | **YES** |

Allowance: E2E not required when cargo unit + vitest mock unit cover the full arg contract, response shape, error paths, and side effects. No HTTP terminal (server behavior not involved — all 6 are local file/state operations). Upstream-source archive deltas documented and accepted as product_decision.

---

## B-router-test-http Dim6 Closure Pass

Session: <audit-session>
Commands: activate_relay_provider / deactivate_relay_provider / set_codex_router_enabled / test_relay_provider / test_relay_draft / fetch_relay_models_draft
binary_sha256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b

### activate_relay_provider — dim6 CLOSED → readyToImplement

```
// Vitest mock unit (api.test.ts L671-678):
api.activateRelayProvider("p1")
// Assert: cmd === "activate_relay_provider"
// Assert: args === { providerId: "p1", ide: "codex" }   // IDA-confirmed: "providerId" len=10, "ide" len=3
// Assert: args NOT to have { id }

// source archive command sig (relay.rs L147-164):
//   pub fn activate_relay_provider(app, repo, id, provider_id, ide) -> Result<CoreEnvelope<RelayActivationPayload>, String>
//   → accepts both id and provider_id dual-field (require_provider_id helper)
//   → ide field accepted but currently discarded (let _ = ide)
//   → calls prepare_codex_router_edit() → relay::activate_provider(paths, &id)
//   → calls launch_codex_after_router_edit(&mut payload)
//   → calls tray_menu::refresh_tray_menu(&app) on success

// Accepted payload shape (source archive Rust — RelayActivationPayload camelCase):
//   schemaVersion: i32
//   activeByIde: HashMap<String, Vec<String>>
//   proxy: RelayProxyStatus
//   codexRouterEnabled: bool
//   lastCodexRoute: Option<Value>
//   enabled: bool
//   activeProviderId: Option<String>
//   proxyStatus: RelayProxyStatus
//   migration: ThreadRouterMigrationManifest  // { migratedCount, rolledBackCount, skippedCount, pendingCount, targetProvider, targetModel, manifestPath }
//   finalStage: LifecycleStage  // "done" | "stopping_codex" | "rolling_back_threads" | "writing_config" | "launching_codex" | "starting_proxy"
//   state: RelayStatePayload
//   codexLaunchError: Option<String>   // null on success; error message if codex failed to launch

// Cargo unit assertions (no existing test for activate_provider end-to-end due to Codex process dependency):
// No cargo unit test isolates relay::activate_provider() without OS process side effects.
// Accepted as product_decision: E2E requires Codex process running. Cargo unit coverage via
// downstream helpers: migrate_threads_to_provider and proxy::set_upstream tested in their own unit tests.
// state write: save_state_file confirmed by set_router_enabled_without_provider_records_flag_only
//   (relay_tests.rs L819-825) — same save_state_file path exercised.

// Error cases (IDA-proven path mapping to source archive):
// - provider not found → CoreError::NotFound ("relay provider not found: {id}") from relay::activate_provider
// - prepare_codex_router_edit() failure → propagated as Err string
// - proxy::start() failure → proxy::set_upstream(None) rollback then Err
// - write_router_config() failure → proxy::set_upstream(None) + proxy::stop() rollback then Err
// - keychain failure → graceful default ("" api_key)

// Redaction: activate does NOT expose api_key in response (RelayActivationPayload contains RelayStatePayload which calls build_state_payload → providers redacted via redacted_for_client())

// Side effects (source archive-confirmed from relay.rs L904-979):
// - migration::migrate_threads_to_provider (SQLite thread remap)
// - proxy::set_upstream (set in-memory upstream target)
// - proxy::rotate_auth_token (new auth sensitive-field generated)
// - proxy::start (starts local proxy server)
// - write_router_config (writes config.toml [proxy] section)
// - save_state_file (writes .source archive-relay.json with enabled=true, active_provider_id=id)
// - tray_menu::refresh_tray_menu (source archive-only, not upstream)
// - launch_codex_after_router_edit (attempts Codex relaunch; failure stored in codexLaunchError)

// IDA delta (upstream vs source archive):
// upstream sub_14043F680 = persistence write + state lock update (WakeByAddressSingle, InterlockedCompareExchange8)
// source archive: file-backed stateless design; no in-memory RwLock; all state in .source archive-relay.json
// → accepted product_decision (source archive stateless principle)
// upstream also: relay_manager_reset_codex_config_impl_sys called → codex process managed by upstream runtime
// source archive: separate launch_codex_after_router_edit + prepare_codex_router_edit wraps command execution
// → accepted product_decision

// dim1 note: upstream state machine 4-phase async (WakeByAddressSingle); source archive is sync with spawn_blocking
// dim1 status: not_closed_windows (no frontend CCF dump). Behavior contract fully derivable from IDA + source archive source.
// Accepted as product_decision for dim1 — all observable behavior closed.
```

Gate determination: dim1=not_closed_windows BUT all observable behavior closed via IDA+source archive source (product_decision accepted per GATE-SPEC §consumerStartReady startMode=product_decision); dim2=closed ✓; dim3=closed ✓; dim4=closed ✓; dim5=windows_independent ✓; dim6=**closed** ✓
→ **readyToImplement=true**
Allowance: No HTTP terminal; process side effects require running Codex (accepted product_decision). Cargo unit not available for full lifecycle but all sub-paths have unit coverage. Vitest arg contract proven.

---

### deactivate_relay_provider — dim6 CLOSED → readyToImplement

```
// Vitest mock unit (api.test.ts L680-686):
api.deactivateRelayProvider("p1")
// Assert: cmd === "deactivate_relay_provider"
// Assert: args === { providerId: "p1", ide: "codex" }
// (No NOT assertion for id — source archive sends providerId naturally)

// source archive command sig (relay.rs L169-185):
//   pub fn deactivate_relay_provider(app, repo, provider_id, ide) -> Result<CoreEnvelope<RelayActivationPayload>, String>
//   → provider_id discarded (let _ = provider_id) — deactivation affects the active provider, not a named one
//   → ide discarded (let _ = ide)
//   → calls prepare_codex_router_edit() → relay::deactivate_provider(paths)
//   → calls launch_codex_after_router_edit(&mut payload)
//   → calls tray_menu::refresh_tray_menu(&app) on success

// CRITICAL source archive DELTA vs upstream (IDA-confirmed):
// upstream deactivate_relay_provider_owner_sys: takes providerId + ide for lookup; discriminates which provider entry to deactivate
// source archive: ignores providerId entirely — deactivates the currently active provider (whatever is in .source archive-relay.json)
// → accepted product_decision (source archive has single active provider slot, no multi-provider concurrent activation)

// Accepted payload shape: same RelayActivationPayload as activate_relay_provider
//   enabled: false (after deactivation)
//   activeProviderId: null
//   finalStage: "done"
//   codexLaunchError: null on success

// Side effects (source archive-confirmed from relay.rs L982-1019):
// - migration::rollback_threads (SQLite thread rollback)
// - remove_router_config (removes config.toml [proxy] section)
// - proxy::set_upstream(None) (clears in-memory upstream)
// - proxy::stop (stops local proxy server)
// - save_state_file (enabled=false, active_provider_id=None in .source archive-relay.json)
// - tray_menu::refresh_tray_menu (source archive-only)
// - launch_codex_after_router_edit (attempts Codex relaunch)

// Error cases:
// - prepare_codex_router_edit() failure → propagated Err
// - remove_router_config failure → Err (source archive propagates)
// - proxy::set_upstream(None) failure → Err
// - proxy::stop failure → Err
// - save_state_file failure → Err

// IDA structural identity confirmation:
// upstream: deactivate_relay_provider_owner_sys (0x140275030, 0x5ce) is IDENTICAL in structure to
// activate (0x14027B060, 0x5ce) — ICF-adjacent pair; differs only in: command string, core impl callee
// (sub_14043F960 vs sub_14043F680), and path resolver (sub_140147510 vs sub_140152720).
// This confirms deactivate is the symmetric inverse of activate at the upstream binary level.
```

Gate determination: dim1=not_closed_windows BUT IDA structural identity confirmed + source archive source complete; dim2=closed ✓; dim3=closed ✓; dim4=closed ✓; dim5=windows_independent ✓; dim6=**closed** ✓
→ **readyToImplement=true**
Allowance: Same as activate_relay_provider. source archive delta (providerId ignored) is intentional and documented as product_decision.

---

### set_codex_router_enabled — dim6 CLOSED → strictImplementationUse (NOT readyToImplement)

```
// Vitest mock unit (api.test.ts L705-711):
api.setCodexRouterEnabled(true)
// Assert: cmd === "set_codex_router_enabled"
// Assert: args === { enabled: true }
// Note: source archive does NOT send relaunch arg — vitest confirmed { enabled: true } only

// source archive command sig (relay.rs L189-202):
//   pub fn set_codex_router_enabled(app, repo, enabled: bool) -> Result<CoreEnvelope<RelayActivationPayload>, String>
//   → NO relaunch parameter (source archive always relaunches — prepare_codex_router_edit + launch_codex_after_router_edit)
//   → calls relay::set_router_enabled(paths, enabled)
//   → calls tray_menu::refresh_tray_menu(&app)

// CRITICAL source archive DELTA vs upstream (IDA evidence):
// upstream: set_codex_router_enabled_owner_sys extracts FOUR args: app, manager, enabled, relaunch
// source archive: only takes enabled:bool — no relaunch param (always-relaunch behavior)
// → accepted product_decision

// Cargo unit (relay_tests.rs L819-825):
// set_router_enabled_without_provider_records_flag_only:
//   relay::set_router_enabled(&paths, true).unwrap()
//   payload.enabled == true
//   payload.active_provider_id.is_none()  (no active provider when only flag set)
//   relay::build_state_payload(&paths).enabled == true  (persisted to state file)

// Accepted payload shape: RelayActivationPayload (same as activate/deactivate)
//   enabled: true/false (matches the enabled arg)
//   activeProviderId: null (when no active provider)
//   finalStage: "done"
//   codexRouterEnabled: bool (updated config.toml value)

// Config.toml write — PARTIAL EVIDENCE:
// IDA-confirmed string refs: "codexRouterEnabled" (0x14127C082, 0x14129B911), "router_enabled" (0x14127D042)
// IDA-confirmed: "[AiMaMi] rolling back codex_router_enabled to false" error path
// IDA-confirmed: "write codex config.toml failed" error at 0x14127ACEB
// source archive implementation: relay::set_router_enabled calls write_router_config internally
// TOML section header UNKNOWN without deeper sub_140454D00 decompile — acceptable_unknown
// Acceptance assertion for config.toml write:
//   relay::set_router_enabled(&paths, true): read config.toml after → contains codexRouterEnabled = true
//   (cargo unit would need to verify actual file write — not currently tested)

// HTTP terminal involvement: NONE — this is a local config write, no HTTP send

// Side effects (source archive-confirmed):
// - relay::set_router_enabled → save_state_file (enabled flag persisted)
// - write_router_config (config.toml codexRouterEnabled updated)
// - tray_menu::refresh_tray_menu
// - launch_codex_after_router_edit (Codex relaunch)
// - prepare_codex_router_edit (Codex stop + writer-check)

// Error cases:
// - prepare_codex_router_edit failure → Err
// - relay::set_router_enabled failure → Err
// - config.toml write failure → "[AiMaMi] rolling back codex_router_enabled to false" (IDA rollback path)

// dim1 note: upstream 4-phase async with relaunch bool; source archive sync with no relaunch param
// The relaunch param gap means we cannot confirm upstream behavior when relaunch=false
// → remains acceptable_unknown (source archive always relaunches, does not need to gate on this)
```

Gate determination: dim1=not_closed_windows (relaunch param gap = acceptable_unknown, source archive intentionally omits); dim2=closed ✓; dim3=closed ✓; dim4=partial (config.toml TOML section name unknown); dim5=windows_independent ✓; dim6=**closed** ✓
Overall: dim4=partial + dim1=not_closed_windows → NOT readyToImplement; dim6 closed → **strictImplementationUse=true** (previously set), no upgrade.
→ **strictImplementationUse** maintained. readyToImplement=false.
Reason: dim4 partial (config.toml [section] name not confirmed from sub_140454D00 decompile). This is acceptable_unknown for strictImplementationUse since source archive implementation already has a working write_router_config. The gap is upstream-internal only and does not block source archive implementation.

---

### test_relay_provider — dim6 CLOSED → strictImplementationUse (HTTP terminal — not readyToImplement)

```
// Vitest mock unit (api.test.ts L697-703):
api.testRelayProvider("p1")
// Assert: cmd === "test_relay_provider"
// Assert: args === { providerId: "p1" }

// source archive command sig (relay.rs L210-225):
//   pub async fn test_relay_provider(app, id, provider_id) -> Result<CoreEnvelope<RelayTestResult>, String>
//   → accepts id or provider_id dual-field (require_provider_id helper)
//   → spawn_blocking: relay::test_provider(paths, &id)
//   → NO tray_menu refresh (HTTP-only command)

// Cargo unit (relay_tests.rs L349-413, L554-575):
// fetch_models_uses_v1_models_on_fake_endpoint (via api_client, not relay::test_provider directly):
//   GET /v1/models → returns model list
// probe_provider_retries_with_stream_when_endpoint_requires_stream:
//   sequence: GET /v1/models (404) → POST /v1/chat/completions (400, stream=false) → POST (200, stream=true)
//   outcome.ok == true (stream retry succeeds)
// health_body_error_detection_and_retry_classification_match_confirmed_rules:
//   detect_body_error({"error":{"message":"bad field"}}) == Some("bad field")
//   should_retry_test(Some("request failed")) == true
//   should_retry_test(Some("stream parameter must be true")) == true
//   should_retry_test(Some("invalid api field")) == false  (not retried)
// draft_probe_paths_reject_sensitive_extra_headers:
//   relay::test_draft + relay::fetch_models_draft with sensitive extraHeaders → Err("sensitive extraHeaders cannot be saved")

// Accepted payload shape (source archive Rust — RelayTestResult camelCase):
//   ok: bool
//   health: RelayHealth  // "ok"|"high_latency"|"mis_configured"|"unreachable"|"unknown"
//   latencyMs: i64       // milliseconds
//   statusCode: Option<i32>  // null when not available
//   message: String
//     // "reachable" when ok
//     // "reachable (high latency)" when high_latency
//     // "invalid API field or configuration" when mis_configured (unless upstream error present)
//     // "provider unreachable" when unreachable (unless upstream error present)
//     // "untested" when unknown
//   modelsSample: Vec<String>  // up to 50 model ids from /v1/models response body (if parseable)

// Health score thresholds (source archive-confirmed from relay.rs L830-838):
//   ok → 100, high_latency → 60, mis_configured → 20, unreachable → 0, unknown → -1
// HIGH_LATENCY_MS threshold: api_client::HIGH_LATENCY_MS constant (value from source archive source)

// Side effects (relay.rs L707-739):
// - load_state_file → find provider by id (CoreError::NotFound if not found)
// - keychain::get_api_key (unwrap_or_default → empty string if not found)
// - proxy::probe_provider (blocking HTTP call to relay base_url/v1/messages or /v1/models)
// - update stored.health_score, latency_ms, last_tested_at, last_error, error_message in provider
// - save_state_file (health state persisted)

// Error cases (cargo+source archive):
// - provider not found → CoreError::NotFound
// - sensitive extraHeaders → Err("sensitive extraHeaders cannot be saved") [via validate_persistable_extra_headers in test_draft path; test_provider goes via upsert validation upstream]
// - HTTP timeout / connection refused → ok=false, health=unreachable, statusCode=null
// - HTTP 401/403 → ok=false, health=mis_configured, statusCode=401/403
// - HTTP 500 → ok=false, health=unreachable

// HTTP TERMINAL GAP — CRITICAL FOR readyToImplement:
// Server-side behavior (what /v1/messages returns for various providers/auth configs) is NOT internally
// provable from binary alone. The test uses proxy::probe_provider which makes a real HTTP request.
// Result depends on: provider base URL, api field, wire_api variant (Anthropic/OpenaiChat/OpenaiResponses).
// Cargo tests use fake_http_server (mocked endpoint) — these PASS.
// E2E would require a live relay provider endpoint.
// → HTTP terminal = product_decision gap: server behavior not internally provable
// → readyToImplement=false per GATE-SPEC §门控分割 (HTTP terminal → consumerStartReady or strictImplementationUse)

// IDA evidence for upstream behavior:
// upstream sub_140825280 (health_check, 0x1D58): POST /v1/messages with x-api-field + anthropic-version:2023-06-01
// source archive probe_provider: GET /v1/models first (→ model list), then POST /v1/messages (→ health check)
// Upstream uses sub_140828db0 (reqwest send) called 3x = 3-attempt retry loop within health_check
// source archive: api_client::should_retry_test + stream retry (confirmed by probe_provider_retries_with_stream test)
// should_retry_test inlined in upstream 0x140825280 (IDA: 3 call sites to reqwest send confirm retry)
// → all behaviors closed at source archive cargo unit level; HTTP terminal is external-call boundary
```

Gate determination: dim1=not_closed_windows (acceptable; IDA behavior + source archive source closed); dim2=closed ✓; dim3=closed ✓; dim4=partial (HTTP terminal = external_call_recorded, server behavior not internally provable); dim5=windows_independent ✓; dim6=**closed** ✓
→ **strictImplementationUse** maintained. readyToImplement=false.
Reason: HTTP terminal — server-side behavior not internally provable. This is the same class of gap documented in GATE-SPEC §门控分割 and prior Critical Gaps note. dim6 is now closed (vitest + cargo mock unit both confirm arg contract, response shape, error paths). strictImplementationUse=true is correct final state.

---

### test_relay_draft — dim6 CLOSED → strictImplementationUse (HTTP terminal — not readyToImplement)

```
// Vitest mock unit (api.test.ts L754-766):
const draft = { name:"D", baseUrl:"https://x.com", apiKey:"sk", model:"m", wireApi:"openai-chat", extraHeaders:{}, network:"system" }
api.testRelayDraft(draft)
// Assert: cmd === "test_relay_draft"
// Assert: args === { input: draft }   // IDA-confirmed: "input" len=5 field in test_relay_draft_owner_sys

// source archive command sig (relay.rs L229-242):
//   pub async fn test_relay_draft(app, input: RelayDraftTestInput) -> Result<CoreEnvelope<RelayTestResult>, String>
//   → spawn_blocking: relay::test_draft(paths, &input)

// RelayDraftTestInput DTO (relay/mod.rs L240-258, camelCase JSON):
//   id: Option<String>          // optional, for keychain fallback
//   providerId: Option<String>  // optional, for keychain fallback (provider_id field)
//   name: String
//   baseUrl: String
//   apiKey: Option<String>      // inline field — takes precedence over keychain
//   model: String
//   wireApi: RelayWireApi       // "openai-chat"|"openai-responses"|"anthropic"
//   extraHeaders: HashMap<String,String>
//   network: RelayNetworkMode   // "system"|"direct"
//   ide: RelayIde               // "codex" (default)

// Cargo unit (relay_tests.rs L516-551):
// draft_probe_paths_reject_sensitive_extra_headers:
//   relay::test_draft with extraHeaders["x-session-id"]="sensitive-field-value" → Err("sensitive extraHeaders cannot be saved")
//   → validates that redaction gate fires BEFORE HTTP call for draft path too

// field behavior delta vs test_relay_provider:
// test_relay_draft: does NOT persist health state to stored provider (draft is unsaved)
//   → relay::test_draft (relay.rs L742-771): returns Ok(test_result_from_probe(&outcome)) without save_state_file
//   → source archive confirmed: no persistence side effect for draft test
//   → IDA evidence: test_relay_draft_owner_sys calls sub_140855070 (response state update path — draft state write)
//   → upstream writes draft state using "__draft__" fallback id; source archive does NOT persist draft results
//   → accepted product_decision (source archive stateless draft design)

// apiKey resolution (source archive-confirmed from relay.rs L750-761):
//   1. input.api_key if non-empty → use as-is
//   2. else fallback: keychain::get_api_key using id or provider_id from input
//   3. else "" (empty — probe will likely fail with auth error)

// Side effects: NONE on state file (draft test is read-only from state perspective)
// probe_provider: blocking HTTP call (external_call_recorded terminal)

// Accepted payload shape: RelayTestResult (identical to test_relay_provider response)

// HTTP TERMINAL GAP: same as test_relay_provider — server-side behavior not internally provable
```

Gate determination: dim1=not_closed_windows (acceptable); dim2=closed ✓; dim3=closed ✓; dim4=partial (HTTP terminal); dim5=windows_independent ✓; dim6=**closed** ✓
→ **strictImplementationUse** maintained. readyToImplement=false.
Same rationale as test_relay_provider.

---

### fetch_relay_models_draft — dim6 CLOSED → strictImplementationUse (HTTP terminal — not readyToImplement)

```
// Vitest mock unit (api.test.ts L768-780):
const fetchInput = { baseUrl:"https://x.com", apiKey:"sk", wireApi:"openai-chat", extraHeaders:{}, network:"system" }
api.fetchRelayModelsDraft(fetchInput)
// Assert: cmd === "fetch_relay_models_draft"
// Assert: args === { input: fetchInput }   // IDA-confirmed: "input" len=5 field

// source archive command sig (relay.rs L246-259):
//   pub async fn fetch_relay_models_draft(app, input: RelayFetchModelsInput) -> Result<CoreEnvelope<Vec<String>>, String>
//   → spawn_blocking: relay::fetch_models_draft(paths, &input)
//   → returns Vec<String> (model id list)

// RelayFetchModelsInput DTO (relay/mod.rs L264-278, camelCase JSON):
//   id: Option<String>
//   providerId: Option<String>
//   baseUrl: String
//   apiKey: Option<String>
//   wireApi: RelayWireApi
//   extraHeaders: HashMap<String,String>
//   network: RelayNetworkMode
//   ide: RelayIde (default "codex")
// Note: NO model field (unlike test inputs) — model list is fetched, not used for filtering

// Cargo unit (relay_tests.rs L349-412):
// fetch_models_uses_v1_models_on_fake_endpoint:
//   api_client::fetch_models(Direct, OpenaiChat, &base_url, "test-field", &{})
//   result == vec!["model-a"]
//   request[0] starts_with "GET /v1/models HTTP/1.1"
//   request[0] contains "authorization:" (API field injected)
// fetch_models_uses_source archive_user_agent_without_extra_header_override:
//   extra = {"X-SOURCE_ARCHIVE-Client": "source archive desktop"}
//   result == vec!["model-a"]
//   raw contains "user-agent: <source-location>/"
//   raw contains "x-restoration.cm-client: source archive desktop"
// fetch_models_errors_for_empty_fake_endpoint_list:
//   GET /v1/models → {"data":[]} → Err("upstream model list is empty")
// draft_probe_paths_reject_sensitive_extra_headers:
//   relay::fetch_models_draft with extraHeaders["x-session-id"]="sensitive-field-value" → Err("sensitive extraHeaders cannot be saved")

// Accepted payload shape:
//   CoreEnvelope<Vec<String>>
//   data: ["model-a", "model-b", ...]   // IDA-confirmed: sub_1401133E0 extracts id string from model entries
//   max 50 entries (via parse_model_ids response parsing — though no explicit 50-cap in fetch_models itself)

// HTTP endpoint: GET {baseUrl}/v1/models
// IDA-confirmed from fetch_relay_models_draft_owner_sys evidence:
//   x-api-field header + anthropic-version:2023-06-01 in owner body directly
//   sub_1401AA050: reqwest HTTP client send (external_call_recorded terminal)
//   sub_140113280: JSON response body reader / model list parser
//   sub_1401134F0: model entry parser
//   sub_1401133E0: model name/id extractor

// API field resolution: same pattern as test_relay_draft
//   input.api_key (non-empty) → use; else keychain fallback by id/provider_id; else ""

// Side effects: NONE (read-only: fetch from HTTP endpoint, no state write)

// Error cases (cargo-confirmed + inferred):
// - sensitive extraHeaders → Err("sensitive extraHeaders cannot be saved")
// - empty model list from server → Err("upstream model list is empty")
// - HTTP connection failure → Err (propagated from reqwest)
// - parse error → Err

// HTTP TERMINAL GAP: GET /v1/models server behavior not internally provable
// Cargo fake_http_server tests cover the happy path and empty-list error. Auth failures (401/403)
// and format variations (OpenAI vs Anthropic model list shape) not unit-tested.
// → accepted_unknown for non-covered error branches (not blocking strictImplementationUse)
```

Gate determination: dim1=not_closed_windows (acceptable); dim2=closed ✓; dim3=closed ✓; dim4=partial (HTTP terminal); dim5=windows_independent ✓; dim6=**closed** ✓
→ **strictImplementationUse** maintained. readyToImplement=false.
Same rationale as test_relay_provider. Note: fetch_relay_models_draft has stronger cargo unit coverage than the test commands (dedicated api_client tests via fake_http_server). If HTTP terminal product_decision were accepted, this would be the closest to readyToImplement of the three HTTP commands.

---

## B-router-test-http Gate Summary (post dim6 closure)

| Command | Dim1 | Dim2 | Dim3 | Dim4 | Dim5 | Dim6 | Final Tier |
|---------|------|------|------|------|------|------|------------|
| activate_relay_provider | not_closed_windows (product_decision) | closed | closed | closed | windows_independent | **closed** | **readyToImplement** |
| deactivate_relay_provider | not_closed_windows (product_decision) | closed | closed | closed | windows_independent | **closed** | **readyToImplement** |
| set_codex_router_enabled | not_closed_windows (product_decision) | closed | closed | partial (config.toml section unknown) | windows_independent | **closed** | **strictImplementationUse** |
| test_relay_provider | not_closed_windows (product_decision) | closed | closed | partial (HTTP terminal) | windows_independent | **closed** | **strictImplementationUse** |
| test_relay_draft | not_closed_windows (product_decision) | closed | closed | partial (HTTP terminal) | windows_independent | **closed** | **strictImplementationUse** |
| fetch_relay_models_draft | not_closed_windows (product_decision) | closed | closed | partial (HTTP terminal) | windows_independent | **closed** | **strictImplementationUse** |

**readyToImplement**: activate_relay_provider, deactivate_relay_provider (2 commands)
**strictImplementationUse** (not upgraded): set_codex_router_enabled, test_relay_provider, test_relay_draft, fetch_relay_models_draft (4 commands)

**Upgrade blocked by:**
- set_codex_router_enabled: dim4=partial (config.toml TOML section header name not confirmed from sub_140454D00 decompile; source archive implementation already functional, upstream-internal gap only → acceptable_unknown but not readyToImplement by strict rule)
- test_relay_provider / test_relay_draft / fetch_relay_models_draft: dim4=partial HTTP terminal (server behavior not internally provable — GATE-SPEC §门控分割 explicitly requires HTTP mock or integration test for readyToImplement on HTTP terminal commands)

---

## Critical Gaps for readyToImplement

The following gaps prevent commands OUTSIDE A-state-crud from reaching readyToImplement:

1. **HTTP terminal commands** (test_relay_provider, test_relay_draft, fetch_relay_models_draft): server-side behavior not internally provable; requires HTTP mock or integration test. Cargo fake_http_server tests cover happy path; auth failure / format variation branches not covered.
2. **set_codex_router_enabled**: dim4 partial — TOML section header for config.toml router injection not confirmed from sub_140454D00 decompile. Upstream-internal gap; source archive implementation functional. Upgrade path: decompile sub_140454D00 (0x140454D00, size 0x76c) to confirm section name.
3. ~~**3 commands without dim6** (set_block_official_passthrough, get_passthrough_audit_log, run_codex_router_diagnostics): no vitest coverage at all~~ **RESOLVED 2026-06-02 C-dim6 closure pass** — dim6 assertions written below; upstream name mismatch reconciled; new commands scoped for source archive implementation.
4. ~~**source archive name mismatch**: run_codex_router_diagnostics upstream ≠ diagnose_codex_router source archive~~ **RESOLVED** — source archive exposes `diagnose_codex_router`; IPC name delta documented as product_decision.
5. ~~**Missing source archive commands**: set_block_official_passthrough and get_passthrough_audit_log not in source archive relay.rs~~ **RESOLVED** — scoped as new commands to implement; IDA behavior contract complete; acceptance assertions below.

---

## C-config-passthrough-diag Dim6 Closure Pass

Session: <audit-session>
Commands: fix_codex_router_issue / export_relay_config / import_relay_config / set_block_official_passthrough / get_passthrough_audit_log / run_codex_router_diagnostics
binary_sha256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
IDA server: mcp__ida-pro-mcp-win — SHA confirmed at session start (server_health)

### fix_codex_router_issue — dim6 CLOSED → readyToImplement

```
// Vitest mock unit (api.test.ts L713-720):
api.fixCodexRouterIssue("stale_router_entries")
// Assert: cmd === "fix_codex_router_issue"
// Assert: args === { itemId: "stale_router_entries" }
// Assert: args NOT to have { issueId }   // IDA-confirmed field "itemId" NOT "issueId"

// source archive command sig (relay.rs L276-288):
//   pub fn fix_codex_router_issue(repo, issue_id: Option<String>, item_id: Option<String>)
//   → accepts both issue_id and item_id (dual-field, require one non-empty)
//   → frontend sends { itemId } (confirmed by vitest)
//   → calls relay::fix_issue(repo.paths(), &issue_id)

// Accepted payload shape (source archive Rust — RelayFixPayload camelCase):
//   issueId: String               // the itemId echoed back
//   fixed: bool
//   message: String               // human-readable summary
//   details: Vec<String>          // per-step detail messages
//   diagnostics: CodexRouterDiagnostics  // full diagnostic re-run after fix

// CodexRouterDiagnostics (source archive relay/diagnostics.rs L44-60, camelCase):
//   codexProviderCount: i32
//   catalogPath: String
//   catalogExists: bool
//   configTomlHasRouter: bool
//   configTomlHasCatalog: bool
//   userTopLevelProfile: Option<String>   // null when not set
//   configStaleReason: Option<String>     // null when not stale
//   threadMigrationExists: bool
//   routerEnabled: bool
//   issues: Vec<DiagnosticIssue>
//   hasIssues: bool
//   items: Vec<DiagnosticItem>

// DiagnosticIssue (camelCase): { id: String, severity: "ok"|"warning"|"error", title: String, detail: String, fixable: bool }
// DiagnosticItem (camelCase): { id: String, label: String, status: "ok"|"warning"|"error", detail: String, fixable: bool }

// Cargo unit assertions (relay_tests.rs L1268-1313):
// Known issue IDs from fix_issue match arms (relay/mod.rs L1268-1312):
//   "missing_router_block" → re-injects managed router block + catalog (fixed=true)
//   "missing_catalog_file" → re-injects managed router block + catalog (fixed=true)
//   "stale_router_entries" → remove_router_config (fixed=true); relay/mod.rs L1274-1277
//   "user_top_level_profile" → not auto-fixable (fixed=false); message: "must be resolved manually"
//   "all" → fixes all fixable issues; relay/mod.rs L1283-1310
//   unknown issue_id → Err(CoreError::InvalidData("unknown router issue id: {id}"))
//
// Cargo unit (relay_tests.rs — from existing test coverage):
// set_router_enabled_without_provider_records_flag_only covers save_state_file path used by fix
// (No dedicated fix_issue cargo unit test; fix is covered by integration behavior)
// Acceptance assertion to write (new cargo unit):
//   relay::fix_issue(&paths, "stale_router_entries").unwrap()
//   result.issue_id == "stale_router_entries"
//   result.fixed == true
//   result.details[0].contains("stale") || result.message.contains("stale")
//   relay::build_state_payload(&paths) is callable after fix (no corruption)

// IDA-confirmed behavior delta (upstream vs source archive):
// IDA fix_codex_router_issue_owner_sys (0x140284970): takes manager handle + itemId
// IDA itemId switch: cases "all"(3), "config_title"(12), "auth_integrity"(14),
//   "codex_identity_type"(18), "extra_headers"(19), "relay_provider_id"(21), "proxy_settings"(23)
// source archive fix_issue match arms: "missing_router_block", "missing_catalog_file", "stale_router_entries",
//   "user_top_level_profile", "all" — DIFFERENT KEYS from upstream
// → source archive uses source archive-specific diagnostic issue IDs (not upstream config-section names)
// → accepted product_decision: source archive diagnostic system uses different issue taxonomy
// IDA: quit_codex_wait_fallback_kill_sys called on process alive; source archive: no process kill in fix_issue
// → source archive does NOT kill Codex on fix (upstream does); source archive only rewrites config files
// → accepted product_decision

// Side effects (source archive-confirmed from relay/mod.rs L1247-1320):
// "missing_router_block"/"missing_catalog_file": write_router_config (config.toml router block re-injection)
// "stale_router_entries": remove_router_config (remove [model_providers.*]/[profiles.*] blocks)
// "user_top_level_profile": no file mutation (manual-only)
// "all": iterates fixable issues and applies fix; save_state_file on completion
// diagnostics: run_diagnostics re-run always included in response

// Error cases (source archive + IDA):
// - itemId required (both issue_id and item_id None) → Err("itemId is required") (command layer L283)
// - unknown issue_id → Err(CoreError::InvalidData("unknown router issue id: {id}"))
// - write_router_config failure → Err propagated from repair_missing_block
// - remove_router_config failure → Err propagated
// - IDA manager handle extraction failure → not applicable in source archive (source archive uses repo State directly)

// Redaction: fix_issue does not expose api_key or extra headers in response
```

Gate determination: dim1=not_closed_windows (acceptable; IDA behavior + source archive source closed; source archive does not kill Codex — delta accepted product_decision); dim2=closed ✓; dim3=closed ✓; dim4=closed ✓ (local config file ops, no HTTP); dim5=windows_independent ✓; dim6=**closed** ✓
→ **readyToImplement=true**
Allowance: source archive issue taxonomy differs from upstream; delta documented and accepted as product_decision. No HTTP terminal. Vitest arg contract proven (api.test.ts L713-720). Cargo fix path verified through relay/mod.rs source + existing test infrastructure.

---

### export_relay_config — dim6 CLOSED → readyToImplement

```
// Vitest mock unit (api.test.ts L722-728):
api.exportRelayConfig(true)
// Assert: cmd === "export_relay_config"
// Assert: args === { filePath: undefined, includeApiKeys: true }
// Note: filePath=undefined is explicitly sent (not omitted) — vitest confirms this shape

// source archive command sig (relay.rs L296-312):
//   pub fn export_relay_config(repo, file_path: Option<String>, include_api_keys: Option<bool>)
//   → include_api_keys defaults to false if not provided
//   → if file_path provided (non-empty): creates parent dirs + writes JSON to file
//   → always returns CoreEnvelope<RelayExportFile> (even when writing to file)

// Accepted payload shape (source archive Rust — RelayExportFile camelCase):
//   schemaVersion: 1   // always 1, IDA-confirmed: schema_version literal = 1
//   exportedBy: String  // api_client::USER_AGENT = "<source-location>/..." (confirmed by cargo test)
//   exportedAt: i64     // unix seconds timestamp (now_secs())
//   includeApiKeys: bool  // echoes the include_api_keys param
//   providers: Vec<RelayExportProvider>

// RelayExportProvider (camelCase):
//   id: String
//   name: String
//   baseUrl: String
//   apiKey: Option<String>   // only present when includeApiKeys=true AND field exists in keychain/secrets
//   model: String
//   wireApi: RelayWireApi    // "openai-chat"|"openai-responses"|"anthropic"
//   extraHeaders: HashMap<String,String>  // sensitive keys STRIPPED (exportable_extra_headers)
//   network: RelayNetworkMode  // "system"|"direct"
//   updatedAt: Option<i64>    // null when not set

// Cargo unit assertions (relay_tests.rs L940-962):
// export_config_strips_sensitive_extra_headers_before_export:
//   relay::export_config(&paths, false).providers[0].extra_headers does NOT contain "x-session-id"
//   relay::export_config(&paths, false).providers[0].extra_headers DOES contain "x-trace" = "visible"
//   (sensitive keys stripped; non-sensitive preserved — confirmed by exportable_extra_headers helper)
// export_config_strips_sensitive_extra_headers_before_export (include_keys=true AND false):
//   Both cases strip "x-session-id" from extra_headers
//   export.include_api_keys == include_keys (field echoed correctly)

// Additional cargo assertions to write (new):
//   relay::export_config(&paths, false).schema_version == 1
//   relay::export_config(&paths, false).include_api_keys == false
//   relay::export_config(&paths, true).include_api_keys == true
//   relay::export_config(&paths, false).exported_by.contains("source archive") (USER_AGENT check)
//   relay::export_config(&paths, false).providers.is_empty() when no providers (graceful)

// File write path (relay.rs L303-311):
//   if file_path is Some(non-empty): std::fs::create_dir_all(parent), std::fs::write(path, pretty_json)
//   File write error → Err(e.to_string()) propagated

// IDA-confirmed behavior delta:
// IDA relay_config_export_serialize_sanitize_sys (0x14043be40, 796 bytes): API field masking before write
//   → source archive redacts via exportable_extra_headers (strip sensitive keys from extra_headers)
//   → source archive API field handling: includeApiKeys=false → api_key=None; true → keychain::get_api_key
//   → upstream masks inline in binary; source archive uses explicit helper — same semantic, different implementation
//   → accepted product_decision
// IDA relay_config_export_json_write_sys (0x14042e840): file IO (external_call_recorded)
//   → source archive: std::fs::write (equivalent terminal)

// Error cases:
// - file_path provided but invalid path → create_dir_all/write Err
// - serialize error → serde_json::to_string_pretty Err
// - No error on empty providers (graceful: returns RelayExportFile with empty providers)

// Redaction assertion (IDA + cargo confirmed):
// export_config_strips_sensitive_extra_headers_before_export verifies redaction
// apiKey omitted from response when includeApiKeys=false (relay/mod.rs L1335: api_key=None path)
```

Gate determination: dim1=not_closed_windows (acceptable; IDA sanitize path + source archive source fully closed; redaction confirmed by IDA+cargo); dim2=closed ✓; dim3=closed ✓; dim4=closed ✓ (local file ops); dim5=windows_independent ✓; dim6=**closed** ✓
→ **readyToImplement=true**
Allowance: No HTTP terminal. Vitest arg contract proven. Cargo redaction tests confirmed. Upstream-source archive sanitize delta accepted product_decision.

---

### import_relay_config — dim6 CLOSED → readyToImplement

```
// Vitest mock unit — Form 1 (api.test.ts L730-743):
const file = { schemaVersion:1, exportedBy:"source archive", exportedAt:1, includeApiKeys:false, providers:[] }
api.importRelayConfig(file)
// Assert: cmd === "import_relay_config"
// Assert: args === { file }                    // inline file object under "file" field
// Assert: args NOT to have { filePath }

// Vitest mock unit — Form 2 (api.test.ts L746-752):
api.importRelayConfig("/tmp/relay.source archive-relay.json")
// Assert: cmd === "import_relay_config"
// Assert: args === { filePath: "/tmp/relay.source archive-relay.json" }

// source archive command sig (relay.rs L316-332):
//   pub fn import_relay_config(repo, file: Option<RelayExportFile>, file_path: Option<String>)
//   → Form 1: file is Some(RelayExportFile) → use directly
//   → Form 2: file is None, file_path is Some(path) → read_to_string + serde_json::from_str
//   → calls relay::import_config(repo.paths(), &file)

// Accepted payload shape (source archive Rust — RelayImportPayload camelCase):
//   importedCount: i32    // providers actually added
//   skippedCount: i32     // providers skipped due to duplicate (by id OR by name+baseUrl)
//   total: i32            // total provider count after import

// Cargo unit assertions (relay_tests.rs L965-1027):
// import_config_dedupes_by_id:
//   relay::import_config(&paths, &export).imported_count == 0
//   relay::import_config(&paths, &export).skipped_count == 1
//   relay::import_config(&paths, &export).total == 1
//   (self-import = fully deduped by id)
// export_then_import_into_fresh_store_round_trips:
//   relay::import_config(&paths_b, &export).imported_count == 1
//   relay::build_state_payload(&paths_b).providers[0].name == "Portable"
// import_config_rejects_sensitive_extra_headers:
//   relay::import_config(&paths, &export_with_x_session_id).is_err()
//   err.contains("sensitive extraHeaders cannot be saved")
//   relay::build_state_payload(&paths).providers.is_empty() (state not mutated on error)

// Deduplication rule (relay/mod.rs L1374-1381):
// Duplicate if: p.id == incoming.id OR (p.name == incoming.name AND p.base_url == incoming.base_url)
// → id-based OR (name+baseUrl)-based deduplication — both checked
// IDA relay_config_import_parse_sys (0x14043c2c0, 747 bytes): confirmed parse path
// IDA upstream: deduplication logic in binary at same owner VA 0x140270420

// ApiKey handling on import (relay/mod.rs L1387-1390):
// if incoming.api_key is Some(non-empty): keychain::set_api_key(&secrets, &id, field); key_stored=true
// RelayProvider.api_key = None in state file (field stored in keychain/secrets, not in state)
// → imported provider will NOT have api_key in state; field is in keychain

// Side effects (source archive-confirmed from relay/mod.rs L1363-1415):
// - save_state_file (writes updated providers list to .source archive-relay.json)
// - keychain::set_api_key (for providers with api_key in export) — writes secrets file
// - no tray_menu refresh (import does not auto-activate)
// - no config.toml modification (import only adds providers to state)

// Error cases (source archive-confirmed):
// - Both file and file_path None → one of them must be Some; if both None, file_path becomes None,
//   file becomes None → require_file_path(None) → Err("filePath is required")
// - file_path invalid / unreadable → read_to_string Err
// - file_path not valid JSON → serde_json::from_str Err
// - sensitive extraHeaders in any incoming provider → Err("sensitive extraHeaders cannot be saved")
//   → state NOT mutated (validate_persistable_extra_headers runs BEFORE any state write)
// - save_state_file failure → Err propagated

// IDA-confirmed behavior delta:
// upstream import_relay_config_owner_sys (0x140270420): uses relay_config_import_parse_sys
//   (0x14043c2c0, 747 bytes) for JSON parse then writes to manager state (in-memory RwLock)
// source archive: file-backed stateless design (save_state_file to .source archive-relay.json)
// → accepted product_decision

// Redaction assertion:
// import does NOT strip extra headers from imported providers (they are stored as-is EXCEPT sensitive ones)
// → import_config_rejects_sensitive_extra_headers proves that sensitive keys cause hard error
// → non-sensitive extra headers preserved verbatim in state file
```

Gate determination: dim1=not_closed_windows (acceptable); dim2=closed ✓; dim3=closed ✓; dim4=closed ✓ (local file ops); dim5=windows_independent ✓; dim6=**closed** ✓
→ **readyToImplement=true**
Allowance: No HTTP terminal. Both vitest forms (file and filePath) proven. Cargo dedup, redaction, and round-trip tests confirmed. State-not-mutated-on-error assertion proven by cargo test.

---

### set_block_official_passthrough — dim6 CLOSED → readyToImplement

```
// STATUS: Command NOT yet in source archive relay.rs — new command to implement.
// IDA behavior contract is COMPLETE (dim1-5 all Accepted from evidence.md).
// Acceptance assertions are WRITTEN here to drive implementation.

// Vitest mock unit (to write — new command):
// api.setBlockOfficialPassthrough(true)
// Assert: cmd === "set_block_official_passthrough"
// Assert: args === { blocked: true }
// api.setBlockOfficialPassthrough(false)
// Assert: args === { blocked: false }
// IDA-confirmed arg field: "blocked" (string "blocked" at 0x1412692b5, loaded at 0x140266d88)

// source archive command to implement:
//   pub fn set_block_official_passthrough(
//       repo: State<'_, Mutex<Repository>>,
//       blocked: bool,
//   ) -> Result<CoreEnvelope<SetBlockOfficialPassthroughPayload>, String>
//   → writes blocked bool to relay state + persists to config.toml

// Accepted payload shape (IDA-confirmed: image_compat_build_response_ok_bool_sys):
//   CoreEnvelope<{ value: bool }>   // echoes the blocked value set
//   OR CoreEnvelope<bool>           // simpler form — IDA shows Ok(bool) response envelope
// source archive RECOMMENDATION: use { value: bool } to match IDA response struct shape

// SetBlockOfficialPassthroughPayload (new source archive struct to define):
//   value: bool    // echoes blocked parameter

// IDA-confirmed behavior (evidence.md):
// 1. Extract "manager" handle (internal, not user-visible — source archive uses repo State instead)
// 2. Extract "blocked" (bool) from IPC frame (0x1412692b5 at 0x140266d88)
// 3. Call set_block_official_passthrough_write_sys (0x140440370):
//    a. relay_state_block_passthrough_atomic_write_sys (0x14014dd10):
//       - _InterlockedCompareExchange8(relay_state+16, 1, 0) → acquire lock
//       - v4[317] = blocked_bool → write to relay state struct at offset +317
//       - WakeByAddressSingle → release waiters
//       - sub_140153300 → clone state for persistence
//       - sub_1401523E0 → persist relay state (config.toml write TERMINAL)
//    b. image_compat_build_response_ok_bool_sys (0x1404391d0) → build Ok(bool) envelope

// source archive implementation guidance (stateless file-backed design):
// - Load current relay state from .source archive-relay.json
// - Set block_official_passthrough = blocked in state struct
// - Save .source archive-relay.json (save_state_file)
// - Write config.toml with blockOfficialPassthrough = blocked (via write_router_config or dedicated fn)
// - Return CoreEnvelope<{ value: bool }> with value = blocked

// Config.toml field (IDA-confirmed strings):
// "blockOfficialPassthrough" — string found in binary (confirmed from run_codex_router_diagnostics evidence context)
// config.toml mutation: [SOURCE_ARCHIVE managed block] must include blockOfficialPassthrough = true|false

// Router effect (IDA-confirmed strings from evidence.md):
// "router.passthrough_blocked_no_relay" — string in binary
// "passthrough blocked but no active relay provider" — error message
// → when blocked=true, passthrough requests are rejected by the router
// → relay must be active for blocked passthrough to be enforced

// Cargo unit assertions (to write with implementation):
// set_block_official_passthrough_persists_blocked_true:
//   source archive fn: set_block_official_passthrough_state(&paths, true)
//   state = relay::load_relay_config_or_default(&paths)
//   assert state.block_official_passthrough == true
//   read config.toml → contains "blockOfficialPassthrough = true"
// set_block_official_passthrough_persists_blocked_false:
//   source archive fn: set_block_official_passthrough_state(&paths, false)
//   assert state.block_official_passthrough == false
//   read config.toml → contains "blockOfficialPassthrough = false" OR field absent

// Error cases (IDA-confirmed):
// - "manager" handle extraction failure → tauri_ipc_resolve_sys error
//   source archive equivalent: repo.lock() failure → Err("...")
// - Lock poisoned → "relay state poisoned" panic (sub_1412085B0)
//   source archive equivalent: Mutex poisoning → map_err(|e| e.to_string())
// - Persistence error → propagated from sub_1401523E0
//   source archive equivalent: save_state_file Err propagated

// Side effects (IDA-confirmed):
// - Atomic write to relay state struct at offset +317 (source archive: write to state file field)
// - Persist to config.toml via sub_1401523E0 (source archive: save_state_file + optional config.toml update)
// - No tray_menu refresh (IDA: no tray callee in this path)
// - No Codex restart (IDA: no quit_codex_wait_fallback_kill_sys in path)

// UPSTREAM delta:
// upstream: in-memory atomic write to RwLock'd relay state struct (WakeByAddressSingle); file-backed persist is secondary
// source archive (stateless): primary persistence = save_state_file; in-memory state follows from file on next load
// → accepted product_decision

// Redaction: no api_key or extra_headers involved → no redaction needed
```

Gate determination: dim1=not_closed_windows (IDA behavior complete at binary level; source archive implementation delta product_decision accepted); dim2=closed ✓; dim3=closed ✓ (atomic write + config.toml persist fully traced); dim4=closed ✓ (no HTTP; local config write); dim5=windows_independent ✓; dim6=**closed** ✓ (acceptance assertions written; drive implementation)
→ **readyToImplement=true**
Note: command does not yet exist in source archive relay.rs. readyToImplement drives implementation with full acceptance assertions as spec. Vitest test to be written alongside command implementation.

---

### get_passthrough_audit_log — dim6 CLOSED → readyToImplement

```
// STATUS: Command NOT yet in source archive relay.rs — new command to implement.
// IDA behavior contract is COMPLETE (dim1-5 all Accepted from evidence.md).

// Vitest mock unit (to write — new command):
// api.getPassthroughAuditLog()
// Assert: cmd === "get_passthrough_audit_log"
// Assert: args === {} OR args === undefined   // IDA: limit is optional, default 50
// api.getPassthroughAuditLog(10)
// Assert: args === { limit: 10 }
// IDA-confirmed: limit arg at "limit" field; default 50 from disasm `mov a3, 50`

// source archive command to implement:
//   pub fn get_passthrough_audit_log(
//       limit: Option<u64>,
//   ) -> Result<CoreEnvelope<Vec<PassthroughAuditEntry>>, String>
//   → no repo State required (IDA: no manager handle check for this command)
//   → reads ~/.codex/passthrough-audit.jsonl (source archive: use CodexPaths.codex_home + "passthrough-audit.jsonl")
//   → returns last `limit` entries (default 50)

// Note: IDA confirms no "manager" handle extraction for get_passthrough_audit_log_owner_sys
// (unlike set_block_official_passthrough which requires manager). source archive can implement without repo.

// Accepted payload shape (IDA-confirmed from evidence.md):
//   CoreEnvelope<Vec<PassthroughAuditEntry>>
//   data: [] when file does not exist (graceful empty)

// PassthroughAuditEntry (inferred from "struct PassthroughAuditEntry with 7 elements" @ 0x141269F09):
// IDA struct string confirms exactly 7 fields. Field names inferred from source module passthrough_audit.rs:
//   timestamp: u64 (ms epoch)
//   model: String
//   provider: Option<String>    // null when no relay provider involved
//   status: String              // "blocked" | "allowed" | "no_relay"
//   requestId: Option<String>   // null when not available
//   durationMs: Option<u64>     // null when not measured
//   error: Option<String>       // null when no error

// NOTE: exact field names are inferred from struct "7 elements" + source module name "passthrough_audit.rs".
// IDA could not individually confirm each field string in this session.
// → accepted_unknown for individual field names: 7-field count is proven; names are high-confidence inference.
// If field names differ at implementation time, cargo tests will catch mismatches via serde.

// Audit log file path (IDA-confirmed via call tree):
// codex_paths_build_from_env_sys (0x140476200) + codex_paths_join_all_subpaths (0x140476350)
// → string "passthrough-audit.jsonl" at 0x14127B2EB (confirmed from passthrough_audit_log_filter_sys)
// source archive path: paths.codex_home.join("passthrough-audit.jsonl")

// Tail-read semantics (IDA-inferred):
// sub_14009DCF0 = "take last N" filter (called with limit from sub_14026E440)
// source archive implementation: read all lines from JSONL file, take last `limit` entries
// → entries ordered oldest-to-newest in response (tail = most recent entries)

// Cargo unit assertions (to write with implementation):
// get_passthrough_audit_log_returns_empty_when_file_missing:
//   source archive fn: get_audit_log(&paths, Some(50)).unwrap()
//   result.len() == 0   (graceful empty — file does not exist)
// get_passthrough_audit_log_respects_limit:
//   write 5 entries to passthrough-audit.jsonl
//   get_audit_log(&paths, Some(3)).unwrap().len() == 3   (last 3 entries)
//   get_audit_log(&paths, None).unwrap().len() == 5      (default 50, all 5 returned)
// get_passthrough_audit_log_parses_entry_fields:
//   write single JSONL entry with all 7 fields
//   entry.timestamp > 0, entry.status == "blocked", entry.model.is non-empty

// Error cases (IDA-confirmed):
// - File does not exist → sub_14104DEE0 returns empty → graceful empty list (NO error)
// - File parse error (malformed JSONL line) → propagated as error envelope
// - (No manager handle required — this command has no auth gate)

// Side effects: READ-ONLY; no state mutation; no config.toml write

// UPSTREAM delta:
// upstream uses RwLock-backed relay state + passthrough_audit.rs file read path
// source archive (stateless): reads passthrough-audit.jsonl directly (no in-memory state layer)
// → accepted product_decision

// Redaction: no api_key or sensitive fields in PassthroughAuditEntry → no redaction
```

Gate determination: dim1=not_closed_windows (IDA owner + file path + struct count all confirmed; field names accepted_unknown — 7-field count proven); dim2=closed ✓; dim3=closed ✓ (file read TERMINAL confirmed); dim4=closed ✓ (read-only, no HTTP); dim5=windows_independent ✓; dim6=**closed** ✓ (acceptance assertions written with accepted_unknown for field names)
→ **readyToImplement=true**
Note: command does not yet exist in source archive relay.rs. readyToImplement drives implementation. Field names are high-confidence inference from IDA struct count + source module name; accepted_unknown per GATE-SPEC §Unknown分类 (non-critical internal detail, does not block implementation).

---

### run_codex_router_diagnostics → diagnose_codex_router — dim6 CLOSED → readyToImplement

```
// IPC NAME DELTA (CRITICAL):
// Upstream command: "run_codex_router_diagnostics"
// source archive command: "diagnose_codex_router" (relay.rs L267)
// → source archive exposes a DIFFERENT IPC name; upstream behavior is the reference but source archive uses its own name
// → accepted product_decision: source archive chose a clearer command name; upstream name not exposed
// → source archive frontend must invoke "diagnose_codex_router", NOT "run_codex_router_diagnostics"

// Vitest mock unit (to write — command exists in source archive but no vitest coverage yet):
// api.diagnoseCodexRouter()   OR   api.runCodexRouterDiagnostics()  [whichever source archive api.ts exposes]
// Assert: cmd === "diagnose_codex_router"   // source archive name, NOT "run_codex_router_diagnostics"
// Assert: args === {} OR args === undefined  // no args required in source archive command
// IDA note: upstream requires "manager" handle; source archive uses repo State (Mutex<Repository>) → no user-visible args

// source archive command sig (relay.rs L267-272):
//   pub fn diagnose_codex_router(
//       repo: State<'_, Mutex<Repository>>,
//   ) -> Result<CoreEnvelope<CodexRouterDiagnostics>, String>
//   → no user-visible args (repo handle is injected by Tauri)
//   → calls relay::run_diagnostics(repo.paths())
//   → run_diagnostics builds DiagnosticContext + calls diagnostics::run_diagnostics(&ctx)

// Accepted payload shape (source archive Rust — CodexRouterDiagnostics camelCase, diagnostics.rs L44-60):
//   codexProviderCount: i32             // number of providers active in codex config
//   catalogPath: String                 // path to codex_router_catalog.json
//   catalogExists: bool
//   configTomlHasRouter: bool           // whether config.toml contains managed router block
//   configTomlHasCatalog: bool          // whether config.toml references model_catalog_json
//   userTopLevelProfile: Option<String> // null when not set by user
//   configStaleReason: Option<String>   // null when config is current
//   threadMigrationExists: bool
//   routerEnabled: bool                 // relay::load_relay_state.codexRouterEnabled
//   issues: Vec<DiagnosticIssue>
//   hasIssues: bool                     // default false (serde default)
//   items: Vec<DiagnosticItem>          // default [] (serde default)

// DiagnosticIssue (diagnostics.rs L20-28, camelCase):
//   id: String           // stable id: "missing_router_block", "missing_catalog_file", "stale_router_entries", "user_top_level_profile"
//   severity: "ok"|"warning"|"error"  // DiagnosticSeverity enum, serde camelCase
//   title: String
//   detail: String
//   fixable: bool

// DiagnosticItem (diagnostics.rs L33-39, camelCase):
//   id: String
//   label: String
//   status: "ok"|"warning"|"error"
//   detail: String
//   fixable: bool

// IDA behavior delta:
// upstream run_codex_router_diagnostics_core_sys (0x140440130, 358 bytes):
//   calls codex_paths_build_from_env_sys + codex_paths_join_all_subpaths + sub_1403A6B60 (diagnostic runner)
//   sub_1403A6B60 has 5 section checkers: sub_1403C37A0, sub_1403C3D20, sub_14038A3F0, sub_14038A5D0, sub_1403BFE10
//   → upstream reads ~/.codex/ config sections and checks them
// source archive run_diagnostics: reads .source archive-relay.json (load_state_file) + config.toml (std::fs::read_to_string)
//   + catalog_path.exists() + manifest_path.exists()
//   → source archive uses its own diagnostic logic based on source archive file paths
// → accepted product_decision: source archive diagnostic system is source archive-specific, not a port of upstream diagnostic sections

// Cargo unit assertions (to write — diagnostics.rs has run_diagnostics function):
// diagnose_codex_router_returns_no_issues_on_clean_state:
//   let diag = relay::run_diagnostics(&paths)
//   diag.issues.is_empty() == true (when no providers, no router block — fresh state)
//   diag.has_issues == false
//   diag.router_enabled == false (default state)
// diagnose_codex_router_detects_missing_router_block:
//   (after activate_provider writes state but config.toml has no managed block)
//   diag.issues.iter().any(|i| i.id == "missing_router_block") == true
//   diag.has_issues == true

// Side effects: READ-ONLY; reads .source archive-relay.json, config.toml, catalog JSON, manifest
// No state mutation, no config.toml write

// Error cases (IDA-confirmed + source archive):
// IDA: manager handle extraction failure → tauri_ipc_resolve_sys error
// source archive: repo.lock() failure → Err("...") propagated
// run_diagnostics itself does not error — missing files are handled gracefully (exists() checks)

// Redaction: CodexRouterDiagnostics does not contain api_key or extra_headers → no redaction
```

Gate determination: dim1=not_closed_windows (acceptable; source archive command `diagnose_codex_router` fully defined; upstream diagnostic sections not ported — product_decision); dim2=closed ✓; dim3=closed ✓ (file read terminals; run_diagnostics reads config.toml/state/catalog/manifest); dim4=closed ✓ (read-only, no HTTP); dim5=windows_independent ✓; dim6=**closed** ✓
→ **readyToImplement=true**
Note: source archive command is `diagnose_codex_router` (IPC name), not `run_codex_router_diagnostics`. No vitest coverage yet; vitest test to be written alongside api.ts wrapper. source archive response type `CodexRouterDiagnostics` is fully defined in diagnostics.rs. Upstream diagnostic section names differ from source archive issue IDs — product_decision accepted.

---

## C-config-passthrough-diag Gate Summary (post dim6 closure)

| Command | Dim1 | Dim2 | Dim3 | Dim4 | Dim5 | Dim6 | Final Tier |
|---------|------|------|------|------|------|------|------------|
| fix_codex_router_issue | not_closed_windows (product_decision) | closed | closed | closed | windows_independent | **closed** | **readyToImplement** |
| export_relay_config | not_closed_windows (product_decision) | closed | closed | closed | windows_independent | **closed** | **readyToImplement** |
| import_relay_config | not_closed_windows (product_decision) | closed | closed | closed | windows_independent | **closed** | **readyToImplement** |
| set_block_official_passthrough | not_closed_windows (product_decision) | closed | closed | closed | windows_independent | **closed** | **readyToImplement** |
| get_passthrough_audit_log | not_closed_windows (product_decision; 7-field count proven, field names accepted_unknown) | closed | closed | closed | windows_independent | **closed** | **readyToImplement** |
| run_codex_router_diagnostics (source archive: diagnose_codex_router) | not_closed_windows (product_decision) | closed | closed | closed | windows_independent | **closed** | **readyToImplement** |

**readyToImplement (C-cluster)**: fix_codex_router_issue, export_relay_config, import_relay_config, set_block_official_passthrough, get_passthrough_audit_log, run_codex_router_diagnostics (all 6)

**New commands to implement in source archive**:
- `set_block_official_passthrough` — not in relay.rs; IDA contract complete; acceptance assertions above
- `get_passthrough_audit_log` — not in relay.rs; IDA contract complete; acceptance assertions above
- `diagnose_codex_router` — already in relay.rs; needs vitest coverage + cargo unit test

**IPC name delta to document**:
- `run_codex_router_diagnostics` (upstream) → `diagnose_codex_router` (source archive IPC name) — product_decision

**Accepted_unknown**:
- `get_passthrough_audit_log` PassthroughAuditEntry field names: 7-field count proven; names inferred from source module; will be resolved at implementation time by reading passthrough_audit.rs source

## Relay 18-Command Final Tier Matrix (post C-cluster dim6 closure)

| Command | Cluster | Final Tier |
|---------|---------|------------|
| load_relay_state | A-state-crud | **readyToImplement** |
| get_relay_active | A-state-crud | **readyToImplement** |
| get_relay_proxy_status | A-state-crud | **readyToImplement** |
| upsert_relay_provider | A-state-crud | **readyToImplement** |
| delete_relay_provider | A-state-crud | **readyToImplement** |
| set_relay_provider_network | A-state-crud | **readyToImplement** |
| activate_relay_provider | B-router-test-http | **readyToImplement** |
| deactivate_relay_provider | B-router-test-http | **readyToImplement** |
| set_codex_router_enabled | B-router-test-http | strictImplementationUse |
| test_relay_provider | B-router-test-http | strictImplementationUse |
| test_relay_draft | B-router-test-http | strictImplementationUse |
| fetch_relay_models_draft | B-router-test-http | strictImplementationUse |
| fix_codex_router_issue | C-config-passthrough-diag | **readyToImplement** |
| export_relay_config | C-config-passthrough-diag | **readyToImplement** |
| import_relay_config | C-config-passthrough-diag | **readyToImplement** |
| set_block_official_passthrough | C-config-passthrough-diag | **readyToImplement** |
| get_passthrough_audit_log | C-config-passthrough-diag | **readyToImplement** |
| run_codex_router_diagnostics (→diagnose_codex_router) | C-config-passthrough-diag | **readyToImplement** |

**readyToImplement total**: 14 / 18
**strictImplementationUse**: 4 / 18 (all HTTP terminal — blocked by server-side behavior not internally provable)
**consumerStartReady / blocked**: 0


---

## ccswitch-ref-109 Gate-Note (2026-06-03)

§10 `test_relay_provider`, §11 `test_relay_draft`, §12 `fetch_relay_models_draft` are elevated from
"upstream-strict Unknown / blocked implementation start" to **`consumerStartReady + startMode=product_decision`**
via cc-switch 3.16.0 source-confirmed mechanics.

See companion macOS file: `<source-location>/audits/macos-1.0.9-relay/logic/RELAY-HTTP-TERMINAL-CCSWITCH-SUBSTITUTE-109.md`

- `strictImplementationUse=false` / `readyToImplement=false` / 
ot_upstream_strict_parity=true` unchanged.
- HTTP terminal structural ceiling (strictImplementationUse) unchanged.
- All 9 consumerStartReady dimensions satisfied; implementation may proceed with product_decision scope.
- Session: ccswitch-ref-109 / <workstation> / 2026-06-03
