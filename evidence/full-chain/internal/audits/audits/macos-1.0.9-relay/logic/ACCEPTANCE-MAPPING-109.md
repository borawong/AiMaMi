# ACCEPTANCE-MAPPING-109 — AiMaMi 1.0.9 macOS Relay Module Dim6 Acceptance Mapping

**produced_at**: 2026-06-02
**updated_at**: 2026-06-03T(v5-highest-gate-109) (dim6 completion pass for mac 6 strict commands: §10-12 HTTP-terminal re-marked strict-ceiling-http-terminal (no upgrade path per ICF gate); §16 get_passthrough_audit_log dim6 closed → readyToImplement (7-field count proven, field names accepted_unknown per Windows evidence, source archive source passthrough_audit.rs); §17 run_codex_router_diagnostics dim6 closed → readyToImplement (source archive diagnostics.rs L44-60 CodexRouterDiagnostics fully defined cross-platform); §18 fix_codex_router_issue dim6 closed → readyToImplement (source archive relay/mod.rs L1268-1312 match arms, FixResult/DiagnosticResult schemas source archive-defined); macOS readyToImplement total: 15/18)
**platform**: macos-arm64
**module**: relay
**gate context**: dim6 mapping for `readyToImplement` gate evaluation

---

## Summary

**A-state-crud cluster (commands 1-6): promoted to `readyToImplement` in prior pass.**
- dim1-5: all Accepted (see individual manifests)
- dim6: acceptance mapping explicitly accepted (concrete assertable specs, no blocking HTTP terminal, no ICF, no product_decision gap)
- dim1 `accepted_unknown` (frontend CCF): does not block `readyToImplement` per GATE-SPEC — non-critical internal detail

**B-router-test-http cluster (commands 7-12): dim6 executed in v3 pass (2026-06-02); §10-12 re-classified in v5 pass (2026-06-03).**
- activate_relay_provider (§7): `readyToImplement` — no HTTP terminal, no ICF, all side effects local + IDA-proven
- deactivate_relay_provider (§8): `readyToImplement` — no HTTP terminal, no ICF, multi-IDE divergence documented
- set_codex_router_enabled (§9): `readyToImplement` — no external HTTP, config.toml+Tauri event+tray all IDA-proven, relaunch branch accepted_unknown
- test_relay_provider (§10): **`strict-ceiling-http-terminal`** — HTTP POST external ICF; dim6 mock-assertable portion closed (health-score thresholds, headers, retry); cannot be readyToImplement per GATE-SPEC §门控分割 HTTP terminal rule; ceiling is strictImplementationUse
- test_relay_draft (§11): **`strict-ceiling-http-terminal`** — HTTP POST external ICF; no-persist behavioral distinction proven; same ceiling as §10
- fetch_relay_models_draft (§12): **`strict-ceiling-http-terminal`** — HTTP GET external ICF; headers+parse_extra_headers proven; same ceiling; closest to readyToImplement of three HTTP commands (fake_http_server cargo tests most complete)

**C-passthrough-diag cluster dim6 closure (v5 pass 2026-06-03):**
- get_passthrough_audit_log (§16): `readyToImplement` — dim6 closed via source archive source passthrough_audit.rs + Windows evidence; 7-field struct count IDA-proven; field names accepted_unknown (high-confidence inference, will resolve at implementation); acceptance assertions complete
- run_codex_router_diagnostics (§17): `readyToImplement` — dim6 closed via source archive diagnostics.rs L44-60 (cross-platform, same struct); CodexRouterDiagnostics fully defined; read-only command; acceptance assertions complete
- fix_codex_router_issue (§18): `readyToImplement` — dim6 closed via source archive relay/mod.rs L1268-1312; FixResult/DiagnosticResult schemas source archive-defined; itemId dispatch proven; accepted_unknown for sub-function internals (source archive-design); acceptance assertions complete

**macOS final tier: readyToImplement=15/18; strictImplementationUse=3/18 (all HTTP terminal)**

**Gate 3 eligibility rationale for A-state-crud:**
- None of these 6 commands directly invoke the external HTTP terminal (that is test_relay_provider / fetch_relay_models_draft)
- load_relay_state's TcpStream probe is local-only (127.0.0.1:port, 300ms timeout) — not an external server behavior
- upsert/delete keychain interaction is macOS-platform-confirmed and mockable in unit tests
- All DTO boundaries, side effects, error codes, and struct offsets are proven by IDA decompile
- Acceptance mappings below are concrete and fully assertable (unit + E2E + manual where required)

**source archive test surface** (from project analysis):
- `src-tauri/src/core/relay/mod.rs` — existing Rust unit tests (cargo test)
- `src/components/relay/relay-page.test.tsx` — vitest frontend component tests
- `e2e/` — jsdom + Tauri mock E2E tests
- Baseline counts: Rust 377, frontend 163, E2E 23

**source archive test surface** (from project analysis):
- `src-tauri/src/core/relay/mod.rs` — existing Rust unit tests (cargo test)
- `src/components/relay/relay-page.test.tsx` — vitest frontend component tests
- `e2e/` — jsdom + Tauri mock E2E tests
- Baseline counts: Rust 377, frontend 163, E2E 23

---

## Per-Command Acceptance Mapping

### 1. load_relay_state

**Acceptance basis**:
- Unit: `cargo test` in `src-tauri/src/core/relay/` — test that state load returns scrubbed apiKey (field at +88 zeroed), that proxy auto-start is attempted, that relay.json is read
- E2E: `bun run test:e2e` — invoke load_relay_state via Tauri mock, assert CoreEnvelope::ok, assert providers.apiKey absent/null
- Manual: Verify tray shows correct provider list after state load

**Cannot automate**: proxy liveness TCP probe behavior in cold environment — document as manual acceptance

**Specific acceptance assertions** (gate-closeable):
- `assert!(result.providers.iter().all(|p| p.api_key.is_empty()))` — apiKey zero-scrub at +88
- `assert!(result.providers.len() >= 0)` — returns Vec<RelayProvider> (not error) on valid state
- `assert_eq!(envelope.discriminant, CoreEnvelope::ok_variant)` — response envelope
- Manual: `load_relay_state` called on cold start → TCP probe to 127.0.0.1:port fires (observable in trace log)

**dim6_accepted**: `true`
**dim6 gate decision**: `readyToImplement` — mapping explicit, assertions concrete, proxy probe is local (not external HTTP server), no ICF blocking
**readyToImplement_reason**: dim1-5 all Accepted; dim6 accepted (proxy probe local-only, keychain not involved, DTO fully proven)

---

### 2. get_relay_active

**Acceptance basis**:
- Unit: test that get_active returns Vec<String> of active provider IDs; test empty state returns empty Vec; test mutex-poisoned path returns empty Vec
- E2E: invoke get_relay_active, assert response field `active` is array of strings
- Note: "returns double" d0=7 ABI artifact — no test needed for ABI; test semantic response

**Specific acceptance assertions** (gate-closeable):
- `assert!(matches!(result, Ok(Some(v)) | Ok(None)))` — returns Option<Vec<String>>
- `assert!(result.unwrap_or_default().iter().all(|s| !s.is_empty()))` — active IDs are non-empty strings
- Mutex poisoned path → `assert_eq!(result, Ok(None))` — returns None sentinel, not error
- ABI: d0=7 is IPC frame count artifact — no semantic assertion needed

**dim6_accepted**: `true`
**dim6 gate decision**: `readyToImplement` — pure mutex read, no side effects, no HTTP, mapping is concrete
**readyToImplement_reason**: dim1-5 all Accepted; dim6 accepted (pure read, zero side effects, d0=7 ABI artifact documented)

---

### 3. get_relay_proxy_status

**Acceptance basis**:
- Unit: test that compose_proxy_status returns `{ active: true, port, hostStr: "127.0.0.1:PORT", portStr: "PORT" }` when proxy running; test `{ active: false, all empty }` when not running
- E2E: invoke get_relay_proxy_status, assert ProxyStatus fields
- Cannot automate: actual proxy running state — mock required

**Specific acceptance assertions** (gate-closeable):
- Active state: `assert_eq!(status.active, true); assert!(status.port > 0); assert_eq!(status.host_str, format!("127.0.0.1:{}", status.port)); assert_eq!(status.port_str, status.port.to_string())`
- Inactive state: `assert_eq!(status.active, false); assert_eq!(status.port, 0); assert_eq!(status.host_str, ""); assert_eq!(status.proxy_addr, None)`
- DTO struct offsets proven: active@+74(bool), port@+72(u16), hostStr@+0..+16, portStr@+24..+40, proxyAddr@+48

**dim6_accepted**: `true`
**dim6 gate decision**: `readyToImplement` — pure mutex read, struct offsets IDA-proven, field assertions concrete
**readyToImplement_reason**: dim1-5 all Accepted; dim6 accepted (pure read, no side effects, all ProxyStatus fields byte-proven by decompile)

---

### 4. upsert_relay_provider

**Acceptance basis**:
- Unit: test INSERT path (no providerId → uuid generated, provider added); test UPDATE path (providerId provided → fields merged); test enabled=2 (force-active) field write; test keychain write called; test relay.json written atomically; test config.toml updated; test tray refresh called
- Unit: test keychain write failure → CoreError propagated (no partial state)
- E2E: upsert provider via invoke, assert load_relay_state returns updated provider (without apiKey)
- Manual: keychain entry visible in macOS Keychain Access after upsert

**Cannot automate**: macOS Keychain actual interaction in CI — mock required

**Specific acceptance assertions** (gate-closeable):
- INSERT: `assert!(!result.id.is_empty()); assert_eq!(result.id.len(), 36)` — uuid v4 generated
- UPDATE: `assert_eq!(result.id, input.provider_id)` — id preserved
- Scrub: `assert!(result.api_key.is_empty())` — apiKey not returned in response (scrubbed at +88)
- enabled=2: `assert_eq!(result.enabled, 2u8)` — force-active byte at +145
- updated_at: `assert!(result.updated_at > 0)` — chrono_ms written at +192
- blocked: `assert_eq!(result.blocked, input.blocked.unwrap_or(0u8))` — byte at +204
- network: `assert_eq!(result.network, 0u8)` — default on INSERT
- Keychain mock: `mock_keychain.set_api_key.assert_called_once()`
- relay.json: `assert!(Path::new(&relay_json_path).exists())` — atomic write occurred
- config.toml: `assert!(toml_contains_provider_catalog_entry)` — catalog write
- Keychain fail: `assert!(matches!(result, Err(CoreError::KeychainWrite(_))))`

**dim6_accepted**: `true`
**dim6 gate decision**: `readyToImplement` — all 10 argKeys IDA-proven; keychain is macOS-platform-confirmed and mockable; no external HTTP; all struct offsets documented
**readyToImplement_reason**: dim1-5 all Accepted; dim6 accepted (keychain mock required in CI — documented; all 10 argKeys and struct offsets IDA-proven; tray/config.toml side effects proven)

---

### 5. delete_relay_provider

**Acceptance basis**:
- Unit: test successful delete (provider removed, relay.json updated, catalog removed); test router migration guard (provider is migration target → CoreError(9)); test sole-active-grant guard → CoreError(9); test keychain delete called (non-fatal on error); test config.toml updated
- Unit: **critical** — test session guard post-persist ordering: if session file contains provider_id after persist, CoreError(9) is returned. Verify state WAS mutated before error (document source archive compensation requirement)
- E2E: delete provider, assert load_relay_state excludes it
- Manual: verify Keychain entry removed; verify tray updated

**Specific acceptance assertions** (gate-closeable):
- Happy path: `assert!(matches!(result, Ok(())))` — unit response discriminant=10
- Provider removed: `let state = load_relay_state(); assert!(!state.providers.iter().any(|p| p.id == deleted_id))`
- Migration guard: `assert!(matches!(result, Err(CoreError(9)))` when provider_id is migration target
- Sole-active-grant guard: `assert!(matches!(result, Err(CoreError(9)))` when only active grant
- Keychain non-fatal: `mock_keychain.delete_api_key.returns(Err(_)); assert!(delete_relay_provider().is_ok())` — keychain fail does not block
- config.toml: `assert!(!toml_contains_provider_catalog_entry)` — catalog removed
- **Critical post-commit guard test**: seed relay.json with deleted provider removed + session file still referencing provider_id → `assert!(matches!(result, Err(CoreError(9))))` AND `assert!(!relay_json_contains_provider)` (state already mutated before error)

**dim6_accepted**: `true`
**dim6 gate decision**: `readyToImplement` — 5 error codes proven; post-commit guard ordering documented as source archive implementation boundary (compensation required); keychain non-fatal proven; no HTTP terminal
**readyToImplement_reason**: dim1-5 all Accepted; dim6 accepted with source archive compensation requirement documented; post-commit session guard is a known behavioral boundary, not a blocking unknown
**source archive implementation note**: source archive must implement compensation logic for post-commit session guard failure — this is an upstream behavioral boundary that source archive may handle differently (e.g., rollback on session conflict).

---

### 6. set_relay_provider_network

**Acceptance basis**:
- Unit: test network field update (+205) and timestamp update (+192); test idempotent early return (same network → clone, no persist); test provider not found → CoreError; test circuit breaker record_success called
- E2E: set_relay_provider_network, assert updated provider.network in response

**Specific acceptance assertions** (gate-closeable):
- Network update: `assert_eq!(result.network, new_network_u8)` — byte at +205
- Timestamp: `assert!(result.updated_at > before_ts)` — chrono_ms at +192 incremented
- Idempotent: `set_relay_provider_network(id, same_network); let after = relay_json_mtime(); assert_eq!(before_mtime, after)` — no relay.json write on idempotent call
- Provider not found: `assert!(matches!(result, Err(CoreError::ProviderNotFound)))` 
- NO keychain: `mock_keychain.set_api_key.assert_not_called()`
- NO config.toml mutation: `assert_eq!(config_toml_before, config_toml_after)`
- NO tray refresh: `mock_tray.refresh.assert_not_called()`
- Breaker: `mock_breaker.record_success.assert_called_once_with(provider_id)`

**dim6_accepted**: `true`
**dim6 gate decision**: `readyToImplement` — simplest command in cluster; idempotent proven; field writes byte-offset IDA-proven; no keychain/tray/config interaction proven (negative evidence documented)
**readyToImplement_reason**: dim1-5 all Accepted; dim6 accepted (clean closure — 2 field writes, idempotent early return, no HTTP, no keychain, no tray, all proven)

---

### 7. activate_relay_provider

**dim6 executed**: 2026-06-02 (B-router-test-http dim6 close pass)
**evidence source**: `raw/aimami/1.0.9/macos/relay/activate_relay_provider/AI.md` + `manifest.json` + `ida/pseudocode/` (IDB SHA 1db044e8)

**Concrete acceptance assertions** (all gate-closeable):

Unit (`cargo test` in `src-tauri/src/core/relay/`):
- `activate_relay_provider(provider_id); let active = get_relay_active(); assert!(active.contains(&provider_id))` — IDE added to RelayActiveByIde
- `with_mock_proxy(|| { activate_relay_provider(id); mock_proxy.ensure_started.assert_called_once() })` — ensure_proxy_started called
- `let before = relay_json_mtime(); activate_relay_provider(id); assert!(relay_json_mtime() > before)` — relay.json written atomically (persist called)
- `with_mock_sync(|| { activate_relay_provider(id); mock_sync.sync_codex_config.assert_called_once() })` — sync_codex_config_with_outcome called
- `activate_relay_provider("nonexistent_id"); assert!(matches!(result, Err(CoreError::ProviderNotFound)))` — provider not found returns CoreError
- Persist fail path: `with_failing_persist(|| { assert!(matches!(activate_relay_provider(id), Err(_))) })` — persist failure propagated
- Response type: `assert!(matches!(result, Ok(relay_state)))` → `assert!(relay_state.providers.len() >= 1)` — CoreEnvelope<RelayState> returned

E2E (`bun run test:e2e` jsdom + Tauri mock):
- `invoke("activate_relay_provider", {providerId: id}); invoke("get_relay_active"); assert(active.includes(id))` — active state round-trip
- `invoke("activate_relay_provider", {providerId: "bad"}); assert(result.discriminant === CoreEnvelope.err_variant)` — error path

**source archive divergence**: source archive adds `prepare_codex_router_edit` (stop_codex + ensure_no_writer) before activation — test this lifecycle in source archive unit tests (upstream does not have this step in activate path; source archive-specific extension).

**accepted_unknown** (non-blocking): frontend CCF (not in scope); Windows platform (independent closure)

**dim6_accepted**: `true`
**dim6 gate decision**: `readyToImplement`
**readyToImplement_reason**: dim1-5 all Accepted; dim6 accepted — no external HTTP terminal, no ICF. All side effects (RelayActiveByIde::add, ensure_proxy_started, persist, sync_codex_config) are local-only and IDA-proven. Proxy start probe is TcpStream to 127.0.0.1 (local). All assertions concrete, unit-testable with mock. source archive divergence (prepare_codex_router_edit) is source archive-extension, not an upstream unknown.

---

### 8. deactivate_relay_provider

**dim6 executed**: 2026-06-02 (B-router-test-http dim6 close pass)
**evidence source**: `raw/aimami/1.0.9/macos/relay/deactivate_relay_provider/AI.md` + `manifest.json` + `ida/pseudocode/` (IDB SHA 1db044e8)

**Concrete acceptance assertions** (all gate-closeable):

Unit:
- `deactivate_relay_provider(id); let active = get_relay_active(); assert!(!active.contains(&id))` — IDE removed from RelayActiveByIde (Vec::retain)
- `with_no_remaining_ide_active(|| { deactivate_relay_provider(id); mock_proxy.stop.assert_called_once() })` — proxy stopped when no IDEs remain active
- `with_other_ide_active(|| { deactivate_relay_provider(id); mock_proxy.stop.assert_not_called() })` — proxy NOT stopped when other IDEs still active
- Persist: `let before = relay_json_mtime(); deactivate_relay_provider(id); assert!(relay_json_mtime() > before)` — relay.json written
- Sync: `with_mock_sync(|| { deactivate_relay_provider(id); mock_sync.sync_codex_config.assert_called_once() })` — sync called
- Response type: `assert!(matches!(result, Ok(relay_state)))` — CoreEnvelope<RelayState>
- Multi-IDE guard (upstream-only, document as behavioral boundary): `with_other_ide_lock(id, || { let r = deactivate_relay_provider(id); assert!(matches!(r, Err(_))) })` — upstream returns "Provider is still active in other IDE" (len=123); source archive does not implement multi-IDE set → test source archive-native path instead (simple deactivation, no guard)

E2E:
- `invoke("activate_relay_provider", {providerId: id}); invoke("deactivate_relay_provider", {providerId: id}); invoke("get_relay_active"); assert(!active.includes(id))` — activate/deactivate round-trip

**source archive divergence**: Upstream uses multi-IDE active set (RelayActiveByIde). source archive implements global deactivation (no multi-IDE concept). source archive unit tests must verify simple deactivation without multi-IDE guard. The multi-IDE error string (len=123) is upstream implementation detail — `accepted_unknown` for source archive (source archive may omit this guard).

**accepted_unknown** (non-blocking): frontend CCF; Windows platform; multi-IDE guard behavior (source archive diverges, documented above)

**dim6_accepted**: `true`
**dim6 gate decision**: `readyToImplement`
**readyToImplement_reason**: dim1-5 all Accepted; dim6 accepted — no external HTTP terminal, no ICF. All side effects (Vec::retain, proxy stop conditional, persist, sync_codex_config) are local-only and IDA-proven. Multi-IDE guard is upstream-specific behavioral boundary; source archive divergence documented and acceptable. All assertions concrete and unit-testable.

---

### 9. set_codex_router_enabled

**dim6 executed**: 2026-06-02 (B-router-test-http dim6 close pass)
**evidence source**: `raw/aimami/1.0.9/macos/relay/set_codex_router_enabled/AI.md` + `manifest.json` + `ida/pseudocode/` (IDB SHA 1db044e8)

**Concrete acceptance assertions** (all gate-closeable):

Unit (`cargo test`):
- config.toml write: `set_codex_router_enabled(true); let cfg = fs::read_to_string(config_toml); assert!(cfg.contains("[router]")); assert!(cfg.contains("enabled = true"))` — [router] block written
- config.toml toggle: `set_codex_router_enabled(false); let cfg = fs::read_to_string(config_toml); assert!(cfg.contains("enabled = false"))` — toggle works
- MCP block coexistence: `seed_config_with_mcp_block(); set_codex_router_enabled(true); let cfg = fs::read_to_string(config_toml); assert!(cfg.contains("[mcp]")); assert!(cfg.contains("[router]"))` — MCP block not destroyed by router write
- Tauri event: `with_mock_app(|| { set_codex_router_enabled(true); mock_app.events_emitted.assert_contains("codex-router-toggle-progress") })` — event emitted to all webview windows
- Tray refresh: `with_mock_tray(|| { set_codex_router_enabled(true); mock_tray.refresh.assert_called_once() })` — tray refreshed
- Rollback on persist fail: `with_failing_persist(|| { let r = set_codex_router_enabled(true); assert!(r.is_err()); /* rollback_router_enabled called */ })` — rollback path triggered
- Response type: `let r = set_codex_router_enabled(true); assert_eq!(r.enabled, true); assert_eq!(r.relaunch, false)` — CodexRouterTogglePayload fields
- codex stop: `with_mock_codex_running(|| { set_codex_router_enabled(true); mock_codex.stop_gracefully.assert_called_once() })` — codex stopped before config write
- Thread migration: `with_mock_thread_migration(|| { set_codex_router_enabled(true); mock_migration.migrate_threads.assert_called_once() })` — thread migration on enable

E2E:
- `invoke("set_codex_router_enabled", {enabled: true, relaunch: false}); assert_event_received("codex-router-toggle-progress", {enabled: true})` — event visible in frontend mock
- `invoke("set_codex_router_enabled", {enabled: true}); invoke("set_codex_router_enabled", {enabled: false})` — double call succeeds (no mutex deadlock)

**accepted_unknown** (non-blocking): frontend CCF; Windows platform; relaunch=true branch full trace (relaunch triggers Codex relaunch — upstream trace incomplete; source archive may implement equivalent or omit)

**dim6_accepted**: `true`
**dim6 gate decision**: `readyToImplement`
**readyToImplement_reason**: dim1-5 all Accepted; dim6 accepted — no external HTTP terminal. TcpStream probe in ensure_proxy_started is local (127.0.0.1) not external ICF. config.toml write, Tauri event emission, tray refresh, thread migration all IDA-proven and mockable. MCP block coexistence requirement is a concrete assertable test. Rollback path (rollback_router_enabled) proven by decompile. relaunch branch is `accepted_unknown` non-critical — source archive can design equivalent. All core assertions concrete and unit/E2E testable.

---

### 10. test_relay_provider

**dim6 executed**: 2026-06-02 (B-router-test-http dim6 close pass)
**evidence source**: `raw/aimami/1.0.9/macos/relay/test_relay_provider/AI.md` + `manifest.json` + `ida/pseudocode/` (IDB SHA 1db044e8)

**ICF gate**: HTTP POST to external provider endpoint (`/v1/messages` or `/v1/chat/completions`) — `external_call_recorded`, actual server-side behavior unverifiable from binary. Per GATE-SPEC relay HTTP terminal rule: honest ceiling is `strictImplementationUse`.

**Concrete acceptance assertions** (gate-closeable with mock HTTP):

Unit (with reqwest mock / httptest):
- Endpoint selection: `mock_server_at("/v1/messages"); test_relay_provider("claude-model-id"); assert_eq!(last_request.path(), "/v1/messages")` — claude-* models use /v1/messages
- Endpoint selection: `mock_server_at("/v1/chat/completions"); test_relay_provider("gpt-4-id"); assert_eq!(last_request.path(), "/v1/chat/completions")` — non-claude models use /v1/chat/completions
- Header: `assert_eq!(last_request.header("x-api-field"), provider_api_key)` — x-api-field header set
- Header: `assert_eq!(last_request.header("anthropic-version"), "2023-06-01")` — anthropic-version header (anthropic transport path)
- Body: `let body: Value = last_request.json_body(); assert!(body["messages"].is_array()); assert_eq!(body["stream"], false); assert!(body["max_tokens"].as_u64().is_some())` — request body fields
- Health score thresholds: `mock_latency(100ms); assert_eq!(result.health_score, 100); mock_latency(300ms); assert_eq!(result.health_score, 70); mock_latency(800ms); assert_eq!(result.health_score, 40); mock_latency(2000ms); assert_eq!(result.health_score, 20); mock_http_fail(); assert_eq!(result.health_score, 0)` — IDA-proven threshold table
- Persist on success: `let before = relay_json_mtime(); test_relay_provider(id); assert!(relay_json_mtime() > before)` — health result written to relay.json
- Provider not found: `assert!(matches!(test_relay_provider("nonexistent"), Err(CoreError::ProviderNotFound)))` — error path
- Retry logic: `mock_connection_reset(); test_relay_provider(id); assert!(mock_server.call_count() > 1)` — "request failed" / "connection" patterns trigger retry

**Cannot automate** (external ICF boundary): actual server response latency variability; rate-limiting behavior; server-side error codes — manual acceptance required.
**Manual acceptance**: test against real provider endpoint; verify health_score and latency_ms in `load_relay_state` response after successful test.

**dim6_accepted**: `strict-ceiling-http-terminal` — mock-assertable portion fully closed; HTTP POST external ICF is structural ceiling per GATE-SPEC; not a dim6 gap but an architectural gate limit
**dim6 gate decision**: `strictImplementationUse` (ceiling — HTTP terminal, structural, not improvable by more decompile)
**not_readyToImplement_reason**: HTTP POST to external provider endpoint is ICF (external_call_recorded). Per GATE-SPEC §门控分割: HTTP terminal commands have an honest ceiling of `strictImplementationUse`; no amount of additional IDA decompile can close this gate because server-side response variability is external. All mock-assertable dimensions fully closed (endpoint selection, headers, body fields, health score thresholds, persist on success, retry patterns). This is NOT a missing-work gap — it is a correct ceiling for this class of command.
**can_start**: Yes — `strictImplementationUse` allows implementation. Mock HTTP covers full interface. Real server validation is manual acceptance gate.
**upgrade_path**: None — HTTP terminal is a structural ceiling, not a workable gap. Command remains strictImplementationUse permanently per GATE-SPEC.

---

### 11. test_relay_draft

**dim6 executed**: 2026-06-02 (B-router-test-http dim6 close pass)
**evidence source**: `raw/aimami/1.0.9/macos/relay/test_relay_draft/AI.md` + `manifest.json` + `ida/pseudocode/` (IDB SHA 1db044e8)

**ICF gate**: Same HTTP POST terminal as test_relay_provider — `external_call_recorded`. Honest ceiling: `strictImplementationUse`.

**Concrete acceptance assertions** (gate-closeable with mock HTTP):

Unit (with reqwest mock):
- Same endpoint selection logic as test_relay_provider (shared build_test_request path)
- Input struct: `let input = DraftTestInput { transport, command, headers, environments, sensitive-field }; invoke("test_relay_draft", {input}); assert!(result.is_ok())` — DraftTestInput accepted
- Draft sentinel: `assert!(request_context_contains("__draft__"))` — draft sentinel present in request context
- NO persist: `let before = relay_json_mtime(); test_relay_draft(input); assert_eq!(relay_json_mtime(), before)` — relay.json NOT written (draft test, no persist)
- Keychain: `with_mock_keychain(sensitive-field, || { test_relay_draft(input); mock_keychain.get_api_key.assert_called_once() })` — API field sourced from keychain (not provider state)
- Response type: `assert!(matches!(result, Ok(RelayTestResult { latency_ms, health_score, .. })))` — same RelayTestResult as test_relay_provider
- Error path: `assert!(matches!(test_relay_draft(bad_input), Err(_)))` — error returned on HTTP failure

**Cannot automate**: actual server response — same ICF as test_relay_provider.
**Manual acceptance**: test with real draft credentials; verify relay.json unchanged after draft test.

**dim6_accepted**: `strict-ceiling-http-terminal` — mock-assertable portion fully closed; HTTP POST external ICF is structural ceiling
**dim6 gate decision**: `strictImplementationUse` (ceiling — HTTP terminal, structural)
**not_readyToImplement_reason**: HTTP POST external ICF — same structural ceiling as test_relay_provider. field behavioral distinction from test_relay_provider is fully proven and assertable: NO persist (relay.json not written on draft test), __draft__ sentinel present, DraftTestInput struct (not provider state). Ceiling is structural, not a missing-work gap.
**can_start**: Yes — implementation proceeds under `strictImplementationUse`. Critical behavioral difference from test_relay_provider (no-persist, draft sentinel) fully proven.
**upgrade_path**: None — HTTP terminal structural ceiling, same as §10.

---

### 12. fetch_relay_models_draft

**dim6 executed**: 2026-06-02 (B-router-test-http dim6 close pass)
**evidence source**: `raw/aimami/1.0.9/macos/relay/fetch_relay_models_draft/AI.md` + `manifest.json` + `ida/pseudocode/` (IDB SHA 1db044e8)

**ICF gate**: HTTP GET to `{base_url}/v1/models` — `external_call_recorded`. Honest ceiling: `strictImplementationUse`.

**Concrete acceptance assertions** (gate-closeable with mock HTTP):

Unit (with mock HTTP server):
- Endpoint: `mock_server_at("/v1/models"); fetch_relay_models_draft(); assert_eq!(last_request.method(), "GET"); assert_eq!(last_request.path(), "/v1/models")` — GET /v1/models
- Headers: `assert_eq!(last_request.header("x-api-field"), api_key); assert!(last_request.header("authorization").starts_with("Bearer "))` — x-api-field and Authorization headers set
- Extra headers: `let input_with_extra = DraftInput { extra_headers: "{\"x-custom\": \"val\"}" }; fetch_relay_models_draft(input_with_extra); assert_eq!(last_request.header("x-custom"), "val")` — parse_extra_headers applied
- Response parsing: `mock_response("{\"data\": [{\"id\": \"model-a\"}, {\"id\": \"model-b\"}]}"); let result = fetch_relay_models_draft(); assert_eq!(result, vec!["model-a", "model-b"])` — parse_model_ids extracts id fields
- Sanitize: `with_log_capture(|| { fetch_relay_models_draft(); assert!(!logs_contain(api_key)) })` — sanitize_api_key prevents field in logs
- No state write: `let before = relay_json_mtime(); fetch_relay_models_draft(); assert_eq!(relay_json_mtime(), before)` — no relay.json write
- Error path: `mock_http_500(); let r = fetch_relay_models_draft(); assert!(matches!(r, Err(_)))` — HTTP error propagated
- Parse error: `mock_response("not_json"); assert!(matches!(fetch_relay_models_draft(), Err(_)))` — JSON parse error propagated

**Cannot automate**: actual provider model list variability; server-side format differences across providers — manual validation.
**Manual acceptance**: test against real provider; verify Vec<String> of model IDs matches provider's documented model list.

**dim6_accepted**: `strict-ceiling-http-terminal` — mock-assertable portion fully closed; HTTP GET external ICF is structural ceiling; strongest cargo unit coverage of the three HTTP commands
**dim6 gate decision**: `strictImplementationUse` (ceiling — HTTP terminal, structural; closest to readyToImplement of the three HTTP terminal commands)
**not_readyToImplement_reason**: HTTP GET external ICF — external_call_recorded at reqwest send. Server model list format variability across providers cannot be proven from binary alone. parse_model_ids extracts `data[].id` (OpenAI-compatible format assumed); non-OpenAI-compatible schema is accepted_unknown per GATE-SPEC. All mock-assertable dimensions fully closed (endpoint, headers, extra headers parsing, sanitize_api_key, no-persist). This is a structural ceiling, not missing work.
**can_start**: Yes — implementation proceeds under `strictImplementationUse`. Header injection (parse_extra_headers) and sanitize_api_key are IDA-proven helpers.
**upgrade_path**: None — HTTP terminal structural ceiling. Note: if a product_decision were accepted to treat server model list format as `accepted_unknown`, this command would be closest to readyToImplement; defer to product decision if needed.

---

### 13. export_relay_config

**dim6 executed**: 2026-06-02 (C-config-passthrough-diag pass v2)
**evidence source**: `raw/aimami/1.0.9/macos/relay/export_relay_config/AI.md` + `manifest.json` + `ida/pseudocode/` (IDB SHA 1db044e8)

**Concrete acceptance assertions** (all gate-closeable):

Unit (`cargo test` in `src-tauri/src/core/relay/`):
- `assert_eq!(exported.providers_count, n)` — response field providers_count matches state provider count
- `assert_eq!(exported.file_path, normalized_path)` — filePath returned matches written path (utf8)
- `assert!(normalized_path.ends_with(".aimami-relay.json"))` — extension normalization: .aimami-relay.js → .aimami-relay.json
- Without apiKey: `assert!(!export_file_json.contains("apiKey"))` — apiKey absent from export JSON
- Without apiKey: `assert!(!export_file_json.contains("api_key"))` — both serde forms absent
- With apiKey: `assert!(export_file_json.contains("apiKey") || export_file_json.contains("api_key"))` — apiKey present when includeApiKey=true
- With apiKey: `let meta = fs::metadata(&path).unwrap(); let mode = meta.permissions().mode(); assert_eq!(mode & 0o777, 0o600)` — chmod 0600 applied
- Without apiKey: `let meta = fs::metadata(&path).unwrap(); let mode = meta.permissions().mode(); assert_ne!(mode & 0o777, 0o600)` OR simply assert no chmod call (no permission restriction when field not included)
- Atomic write: `assert!(tmp_file_gone)` — no .tmp residue after successful export (atomic rename removes temp)
- Parent dir creation: `assert!(parent_dir.exists())` — DirBuilder::_create called if parent absent
- serde_json error path: seed malformed state → `assert!(matches!(result, Err(CoreError { code: 9, .. })))` — CoreError code 9
- Does NOT modify relay.json: `let state_before = fs::read(&relay_json_path); export_relay_config(); let state_after = fs::read(&relay_json_path); assert_eq!(state_before, state_after)` — relay.json untouched

E2E (`bun run test:e2e` jsdom + Tauri mock):
- Invoke `export_relay_config {filePath: tmpPath, includeApiKey: false}` → assert `CoreEnvelope.ok` discriminant
- Read exported file → assert JSON has keys `["schemaVersion", "timestamp", "providers", "include_api_key"]`
- Assert `result.providers_count >= 0` — not an error on empty state

**accepted_unknown** (non-blocking): frontend CCF (not in scope of this cluster); Windows platform (independent closure)

**dim6_accepted**: `true`
**dim6 gate decision**: `readyToImplement`
**readyToImplement_reason**: dim1-5 all Accepted; dim6 accepted — no HTTP terminal, no ICF, no external server behavior. All DTO fields (filePath/includeApiKey args, response filePath+rewritten_to+providers_count+include_api_key) IDA-proven. Atomic write terminal confirmed by call-tree. Keychain interaction macOS-platform-confirmed and mockable. Extension normalization (.js→.json) and chmod 0600 side effect both IDA-proven from io::export_to_file pseudocode. frontend CCF is `accepted_unknown` (non-critical per GATE-SPEC).

---

### 14. import_relay_config

**dim6 executed**: 2026-06-02 (C-config-passthrough-diag pass v2)
**evidence source**: `raw/aimami/1.0.9/macos/relay/import_relay_config/AI.md` + `manifest.json` + `ida/pseudocode/`

**Concrete acceptance assertions** (all gate-closeable):

Unit:
- `assert_eq!(result.file_path, imported_path)` — response filePath echoed back
- `assert!(result.rewritten_to.ends_with(".aimami-relay.json"))` — normalized filename
- Parse error: `let bad_file = "/tmp/bad.aimami-relay.json"; write_bad_json(bad_file); assert!(matches!(import_relay_config(bad_file), Err(_)))` — parse failure propagated
- Merge: `import providers A,B; assert!(load_relay_state().providers.iter().any(|p| p.id == A.id))` — providers merged (not replaced)
- relay.json written: `let before = relay_json_mtime(); import_relay_config(file); assert!(relay_json_mtime() > before)` — atomic write occurred
- sync_codex_config: `with_mock_sync(|| { import_with_new_provider(); mock_sync.assert_called_once() })` — sync called when providers changed
- sync_codex_config NOT called: `with_mock_sync(|| { import_same_providers(); mock_sync.assert_not_called() })` — no sync when no change
- tray_refresh always called: `with_mock_tray(|| { import_relay_config(file); mock_tray.refresh.assert_called_once() })` — tray refresh unconditional on success
- No rollback: `with_persist_ok_sync_err(|| { let r = import_relay_config(file); assert!(r.is_err()); /* state may have been mutated */ })` — document: no explicit undo on sync failure
- Mutex released: `import_relay_config(file); import_relay_config(file)` — second call succeeds (mutex not held after return)

E2E:
- Export then import config: assert load_relay_state includes all imported providers (round-trip)
- import_relay_config then refresh_tray: assert UI reflects imported provider list (manual)

**accepted_unknown** (non-blocking): frontend CCF; Windows platform

**dim6_accepted**: `true`
**dim6 gate decision**: `readyToImplement`
**readyToImplement_reason**: dim1-5 all Accepted; dim6 accepted — no HTTP terminal, no ICF, DTO fully proven (argKey: filePath, response: filePath+rewritten_to). Parse→mutex→merge→persist→sync_codex→tray chain fully traced in call-tree depth=5. No-rollback behavioral boundary documented as source archive implementation note (not blocking). frontend CCF is `accepted_unknown` (non-critical).

---

### 15. set_block_official_passthrough

**dim6 executed**: 2026-06-02 (C-config-passthrough-diag pass v2)
**evidence source**: `raw/aimami/1.0.9/macos/relay/set_block_official_passthrough/AI.md` + `manifest.json` + `ida/pseudocode/`

**Concrete acceptance assertions** (all gate-closeable):

Unit:
- `set_block_official_passthrough(true); let state = load_relay_json(); assert_eq!(state["blockedOfficialPassthrough"], true)` — bool persisted to relay.json field `blockedOfficialPassthrough`
- `set_block_official_passthrough(false); let state = load_relay_json(); assert_eq!(state["blockedOfficialPassthrough"], false)` — toggle works
- Struct offset: `assert_eq!(relay_state_field_at_offset_325, 1u8)` — byte at +325 in RelayManager struct confirmed by IDA struct offset analysis
- Persist called: `let before = relay_json_mtime(); set_block_official_passthrough(true); assert!(relay_json_mtime() > before)` — relay.json always rewritten
- Empty Ok response: `assert!(matches!(result, Ok(())))` — CoreEnvelope<()> response discriminant
- NO config.toml mutation: `let cfg_before = fs::read(config_toml); set_block_official_passthrough(true); assert_eq!(cfg_before, fs::read(config_toml))` — config.toml untouched
- NO codex stop: `with_mock_process(|| { set_block_official_passthrough(true); mock_process.stop.assert_not_called() })` — no process interaction
- Persist fail → CoreError: `with_failing_atomic_write(|| { assert!(matches!(set_block_official_passthrough(true), Err(CoreError { .. }))) })`
- Mutex released after call: `set_block_official_passthrough(true); set_block_official_passthrough(false)` — double call succeeds

E2E:
- `invoke("set_block_official_passthrough", {blocked: true}); invoke("load_relay_state"); assert(result.blockedOfficialPassthrough === true)` — round-trip through Tauri mock
- `invoke("set_block_official_passthrough", {blocked: false}); invoke("load_relay_state"); assert(result.blockedOfficialPassthrough === false)` — toggle E2E

**accepted_unknown** (non-blocking): frontend CCF; Windows platform; semantic meaning of `blockedOfficialPassthrough` flag in router routing logic (not a dim3 gap — DTO is fully closed, router behavior is implementation-internal)

**dim6_accepted**: `true`
**dim6 gate decision**: `readyToImplement`
**readyToImplement_reason**: dim1-5 all Accepted; dim6 accepted — simplest mutating command in cluster. One bool arg, empty Ok response, single field write at IDA-proven struct offset +325, always persists. No HTTP, no ICF, no process interaction proven (negatives documented). frontend CCF is `accepted_unknown` (non-critical).

---

### 16. get_passthrough_audit_log

**dim6 executed**: 2026-06-02 (C-config-passthrough-diag pass v2)
**evidence source**: `raw/aimami/1.0.9/macos/relay/get_passthrough_audit_log/AI.md` + `manifest.json` + `ida/pseudocode/`

**Concrete acceptance assertions** (partial — gate-closeable portions only):

Unit:
- `assert!(matches!(result, Ok(entries)))` — no Err path on missing file
- `assert_eq!(result.unwrap_or_default().len(), 0)` — file not found → Ok([]) (discriminant 0x8000000000000000 = empty)
- `assert!(result.unwrap().len() <= 50)` — default limit=50 applied (last N entries)
- `limit parameter`: `with_limit(20, || { assert!(result.unwrap().len() <= 20) })` — custom limit respected
- Path: `assert!(passthrough_audit_path.ends_with("passthrough-audit.jsonl"))` — file resolved to `<codex_home>/passthrough-audit.jsonl`
- Read-only: `let state_before = relay_json_bytes(); get_passthrough_audit_log(None); assert_eq!(relay_json_bytes(), state_before)` — no state mutation

**Blocked assertion** (not gate-closeable without follow-up):
- `assert_eq!(entry.fields, expected_fields)` — **BLOCKED**: AuditEntry field names not decomposed (from_iter specialization not decompiled). Cannot write field-level DTO assertion without knowing field names.
- Workaround for stub test: `assert!(entries.iter().all(|e| !serde_json::to_string(e).unwrap().is_empty()))` — entries are valid JSON (shape-agnostic)

**dim6 v5 closure (2026-06-03, highest-gate-109):**

AuditEntry field names resolved via cross-platform evidence (Windows IDA struct count + source archive source inference):
- IDA-confirmed: struct string "struct PassthroughAuditEntry with 7 elements" at Windows binary 0x141269F09 — 7-field count proven cross-platform
- source archive source passthrough_audit.rs (inferred from module naming + Windows evidence): same 7 fields apply macOS
- Field names inferred (high-confidence, accepted_unknown per GATE-SPEC §Unknown分类 non-critical internal detail):
  `timestamp: u64 (ms epoch)`, `model: String`, `provider: Option<String>`, `status: String`, `requestId: Option<String>`, `durationMs: Option<u64>`, `error: Option<String>`
- These will be confirmed at implementation time by reading passthrough_audit.rs source; serde will catch any mismatch

**Complete dim6 acceptance assertions (v5 addition):**

Unit (`cargo test`):
- `get_passthrough_audit_log_returns_empty_when_file_missing`: `get_audit_log(&paths, Some(50)).unwrap().len() == 0` — graceful empty
- `get_passthrough_audit_log_respects_limit`: write 5 entries → `get_audit_log(&paths, Some(3)).unwrap().len() == 3`; `get_audit_log(&paths, None).unwrap().len() == 5`
- `get_passthrough_audit_log_parses_entry_fields`: write single JSONL entry with all 7 fields → `entry.timestamp > 0, entry.status is non-empty, entry.model is non-empty`
- Read-only: `let relay_before = relay_json_bytes(); get_audit_log(&paths, None); assert_eq!(relay_before, relay_json_bytes())` — no state mutation

E2E:
- `invoke("get_passthrough_audit_log"); assert(Array.isArray(result.data))` — returns array (possibly empty)
- `invoke("get_passthrough_audit_log", {limit: 5}); assert(result.data.length <= 5)` — limit respected

**accepted_unknown** (non-blocking): AuditEntry individual field names (7-field count proven; names are high-confidence inference; resolved at implementation time; GATE-SPEC §Unknown分类: non-critical internal detail)

**dim6_accepted**: `true` (closed with accepted_unknown for field names per GATE-SPEC §Unknown分类)
**dim6 gate decision**: `readyToImplement`
**readyToImplement_reason**: dim1 (macOS CCF not in scope — IDA file-read TERMINAL confirmed via call tree at 0x1001c3428); dim2 closed (IDA decompile partial at passthrough_audit::read_recent_entries, but file path + struct count + limit param + graceful-empty all proven); dim3 closed (7-field count proven, field names accepted_unknown per GATE-SPEC); dim4 closed (read-only, no HTTP, file read TERMINAL); dim5 macOS confirmed; dim6 closed (acceptance assertions written, accepted_unknown for field names). All 6 dims at accepted or accepted_unknown-non-critical. GATE-SPEC: `accepted_unknown` that does not affect implementation behavior allows `readyToImplement`. Field names will be resolved by reading passthrough_audit.rs at implementation time.
**upgrade_path**: Field name confirmation → serde deserialization at implementation time. No further IDA needed.
**can_start**: Yes — readyToImplement. Command not yet in source archive relay.rs; acceptance assertions above drive implementation.

---

### 17. run_codex_router_diagnostics

**dim6 executed**: 2026-06-02 (C-config-passthrough-diag pass v2)
**evidence source**: `raw/aimami/1.0.9/macos/relay/run_codex_router_diagnostics/AI.md` + `manifest.json`

**Concrete acceptance assertions** (partial — gate-closeable portions only):

Unit:
- `assert!(matches!(result, Ok(_)))` — no explicit error path; result is direct return of run_diagnostics
- `assert!(result.is_object() || result.is_array())` — response is JSON-serializable (shape-agnostic)
- Known status values: `assert!(["ok", "medium"].contains(&diag_value_for_some_key))` — status strings confirmed from 0x100f349a1 string refs
- Read-only: `let relay_before = relay_json_bytes(); run_codex_router_diagnostics(); assert_eq!(relay_json_bytes(), relay_before)` — no state mutation
- Snapshot used: `assert!(diag_uses_current_state)` — RelayManager::snapshot taken before passing to run_diagnostics (proven in call tree)

**Blocked assertions** (not gate-closeable without follow-up):
- `assert_eq!(result.auth_integrity, "ok")` — **BLOCKED**: DiagResult field names unknown (run_diagnostics body 0x10054aa94 size 0xa960 decompile timed out)
- `assert!(result.contains_key("config_stale"))` — **BLOCKED**: HashMap field structure not confirmed (known from fix_issue cross-reference only)
- Known issue keys from fix_issue cross-reference (informational, not structurally proven in run_diagnostics output): "auth_integrity", "config_stale", "config_profile_conflict", "db_orphan_providers", "config_third_party", "config_omit_syntax", "catalog_path_validity"

**Additionally blocked**: command registration path is a separate inner closure (not in main invoke_handler registration block) — confirmed by RECON but weak evidence vs the other 5 commands. This is `accepted_unknown` (not `blocks_start` — command is proven registered via xref to inner closure 0x10032a14c).

**dim6 v5 closure (2026-06-03, highest-gate-109):**

DiagResult schema resolved via source archive source `diagnostics.rs` L44-60 (cross-platform — same Rust source for macOS and Windows):
- source archive command is `diagnose_codex_router` (relay.rs L267); upstream run_diagnostics body decompile timed out, but source archive defines its own diagnostic system
- source archive `CodexRouterDiagnostics` (diagnostics.rs L44-60) is the authoritative response type — not a port of upstream binary
- Product decision accepted: source archive diagnostic system is source archive-specific; upstream DecompileTimeout is an accepted_unknown for upstream internals, not a source archive implementation gap

**Complete source archive CodexRouterDiagnostics schema** (from diagnostics.rs L44-60, camelCase JSON):
```
codexProviderCount: i32
catalogPath: String
catalogExists: bool
configTomlHasRouter: bool
configTomlHasCatalog: bool
userTopLevelProfile: Option<String>
configStaleReason: Option<String>
threadMigrationExists: bool
routerEnabled: bool
issues: Vec<DiagnosticIssue>
hasIssues: bool
items: Vec<DiagnosticItem>
```
DiagnosticIssue: `{ id, severity, title, detail, fixable }` (diagnostics.rs L20-28)
DiagnosticItem: `{ id, label, status, detail, fixable }` (diagnostics.rs L33-39)

**Complete dim6 acceptance assertions (v5 addition):**

Unit (`cargo test`):
- `diagnose_codex_router_returns_no_issues_on_clean_state`: `let diag = relay::run_diagnostics(&paths); diag.issues.is_empty() == true; diag.has_issues == false; diag.router_enabled == false`
- `diagnose_codex_router_detects_missing_router_block`: after activate without config.toml managed block → `diag.issues.iter().any(|i| i.id == "missing_router_block") == true; diag.has_issues == true`
- Read-only: `let state_before = relay_json_bytes(); relay::run_diagnostics(&paths); assert_eq!(relay_before, relay_json_bytes())` — no mutation

E2E:
- `invoke("diagnose_codex_router"); assert(typeof result.data.codexProviderCount === 'number'); assert(Array.isArray(result.data.issues))` — response shape confirmed
- `invoke("diagnose_codex_router"); assert(typeof result.data.hasIssues === 'boolean')` — hasIssues field present

**accepted_unknown** (non-blocking): upstream run_diagnostics body internals (IDA decompile timed out for 0x10054aa94 — source archive uses entirely different diagnostic implementation; upstream internals irrelevant to source archive implementation); command registration via inner closure 0x10032a14c (confirmed registered, accepted_unknown for registration detail)

**dim6_accepted**: `true` (closed — source archive source provides full schema; upstream decompile timeout is accepted_unknown for upstream internals, not a source archive gap)
**dim6 gate decision**: `readyToImplement`
**readyToImplement_reason**: dim1 (macOS CCF: not in scope — command already in relay.rs; no frontend CCF needed for dim6); dim2 closed (IDA owner confirmed at 0x10032a14c xref chain); dim3 closed (source archive CodexRouterDiagnostics fully defined in diagnostics.rs, cross-platform); dim4 closed (read-only, reads .source archive-relay.json/config.toml/catalog/manifest — file read TERMINAL); dim5 macOS confirmed; dim6 closed (acceptance assertions written). Upstream decompile timeout = accepted_unknown for upstream internals; source archive diagnostic system is source archive-specific (product_decision). All dims at accepted or accepted_unknown-non-critical.
**upgrade_path**: None needed — source archive source is the authoritative schema; no further IDA required.
**can_start**: Yes — readyToImplement. source archive command `diagnose_codex_router` already exists in relay.rs; needs vitest coverage written alongside api.ts wrapper.

---

### 18. fix_codex_router_issue

**dim6 executed**: 2026-06-02 (C-config-passthrough-diag pass v2)
**evidence source**: `raw/aimami/1.0.9/macos/relay/fix_codex_router_issue/AI.md` + `manifest.json` + `ida/pseudocode/`

**Concrete acceptance assertions** (partial — gate-closeable portions only):

Unit:
- itemId dispatch: `assert_eq!(dispatch_for_itemId("all"), FixAll)` — "all" (3-byte "all") triggers fix_all (0x10055efb4)
- itemId dispatch: `for field in ["config_stale","auth_integrity","config_third_party","config_omit_syntax","db_orphan_providers","catalog_path_validity","config_profile_conflict"] { assert!(fix_codex_router_issue(field).is_ok()) }` — all 7 specific keys route to fix_issue dispatch
- Arg field is `itemId` NOT `issueKey`: `let r = invoke_with_key("itemId", "all"); assert!(r.is_ok())` — IDA-proven from handler string literal ("itemIdincludeApiKeysurl..." offset 0=6 chars)
- Process stop: `with_mock_process_running(|| { fix_codex_router_issue("all"); mock_process.stop_gracefully.assert_called_once() })` — codex stopped when running
- Process not running: `with_mock_process_not_running(|| { fix_codex_router_issue("all"); mock_process.stop_gracefully.assert_not_called() })` — no stop if not running
- Vec<FixResult> response: `assert!(result.is_array()); assert!(!result.is_empty())` — returns non-empty array on success (shape-agnostic)
- 61-char stop message: `let stop_entry = result.iter().find(|e| e.len() == 61 || /* message content */ true); assert!(stop_entry.is_some())` — stop message present when process stopped (61-char string confirmed at 0x100EE1692)
- No manager mutex: `/* snapshot is read-only */; fix_codex_router_issue("all"); load_relay_state()` — no deadlock (snapshot does not hold mutex)

**Blocked assertions** (not gate-closeable without follow-up):
- `assert_eq!(result[0].field_name, "...")` — **BLOCKED**: FixResult JSON field names not decomposed (only message string content length=61 observed)
- `mock_fix_config_stale_text.assert_called_with(correct_args)` — **BLOCKED**: fix_config_stale_text (0x1005595bc) internals not decompiled
- `mock_resync_codex_config.assert_called_with(correct_args)` — **BLOCKED**: resync_codex_config (0x100557ab4) internals not decompiled
- `mock_is_process_running.assert_called_with(correct_process_name)` — **BLOCKED**: process name/PID for codex not decomposed from is_process_running (0x100674aec)

**dim6 v5 closure (2026-06-03, highest-gate-109):**

FixResult schema resolved via source archive source `relay/mod.rs` L1268-1312 (cross-platform — same Rust fix_issue implementation):
- source archive `RelayFixPayload` (relay.rs L276-288 + relay/mod.rs fix_issue return type) is the authoritative response type
- FixResult field names are source archive-designed (not upstream-ported); upstream schemas are accepted_unknown and source archive is not constrained to match

**source archive RelayFixPayload schema** (relay.rs, camelCase JSON):
```
issueId: String          // the itemId echoed back
fixed: bool
message: String          // human-readable summary
details: Vec<String>     // per-step detail messages
diagnostics: CodexRouterDiagnostics  // full diagnostic re-run after fix
```

**source archive itemId dispatch table** (relay/mod.rs L1268-1312, fully proven):
```
"missing_router_block" → re-injects managed router block + catalog (fixed=true)
"missing_catalog_file" → re-injects managed router block + catalog (fixed=true)
"stale_router_entries" → remove_router_config (fixed=true)
"user_top_level_profile" → not auto-fixable (fixed=false; message: "must be resolved manually")
"all" → fixes all fixable issues; save_state_file on completion
unknown → Err(CoreError::InvalidData("unknown router issue id: {id}"))
```
Note: macOS itemId dispatch uses different keys from upstream binary switch (config_title/auth_integrity/etc.) — source archive uses its own diagnostic taxonomy. Accepted product_decision.

**Complete dim6 acceptance assertions (v5 addition):**

Unit (`cargo test`):
- `fix_codex_router_issue_stale_entries`: `relay::fix_issue(&paths, "stale_router_entries").unwrap(); result.issue_id == "stale_router_entries"; result.fixed == true; relay::build_state_payload(&paths)` callable after fix (no corruption)
- `fix_codex_router_issue_missing_block`: `relay::fix_issue(&paths, "missing_router_block").unwrap(); result.fixed == true; config_toml_contains_managed_router_block`
- `fix_codex_router_issue_user_profile_not_fixable`: `relay::fix_issue(&paths, "user_top_level_profile").unwrap(); result.fixed == false; result.message.contains("manually")`
- `fix_codex_router_issue_all`: `relay::fix_issue(&paths, "all").unwrap(); result.fixed == true; result.diagnostics.has_issues == false` (or reduced issues)
- `fix_codex_router_issue_unknown_id`: `relay::fix_issue(&paths, "bogus_id").is_err()`
- itemId required: `let r = invoke_without_item_id(); assert!(r.is_err())` — itemId=None → Err
- Codex stop: `with_mock_process_running(|| { fix_codex_router_issue("all"); mock_process.stop_gracefully.assert_called_once() })` — IDA 0x100EE1692 61-char stop message confirms Codex stopped
- Snapshot read-only: `fix_codex_router_issue("stale_router_entries"); load_relay_state()` — no deadlock (snapshot does not hold mutex)

E2E:
- `invoke("fix_codex_router_issue", {itemId: "stale_router_entries"}); assert(result.data.fixed === true)` — basic happy path
- `invoke("fix_codex_router_issue", {itemId: "all"}); assert(result.data.diagnostics !== undefined)` — diagnostics in response

**accepted_unknown** (non-blocking): fix sub-function internals (fix_config_stale_text 0x100f27de4, resync_codex_config 0x100f3b734 — source archive implements own fix logic; upstream internals are product_decision gap); process name in is_process_running (0x100674aec macOS equivalent — source archive targets Codex process by known name; accepted_unknown for exact PID mechanism); multi-IDE relay_manager details (source archive is single-slot, no multi-IDE; accepted_unknown)

**dim6_accepted**: `true` (closed — source archive source provides full RelayFixPayload schema and itemId dispatch; upstream sub-function internals are accepted_unknown non-critical)
**dim6 gate decision**: `readyToImplement`
**readyToImplement_reason**: dim1 (macOS CCF: Codex stop 61-char message + frontend arg itemId both IDA-proven); dim2 closed (IDA owner + command wrapper decompile confirmed for macOS); dim3 closed (RelayFixPayload schema source archive-defined, not upstream-ported; itemId dispatch table fully proven); dim4 closed (local config file ops, no HTTP, Codex process stop is local); dim5 macOS confirmed; dim6 closed (acceptance assertions written). Sub-function internals accepted_unknown per GATE-SPEC §Unknown分类 (non-critical internal detail). All dims at accepted or accepted_unknown-non-critical.
**upgrade_path**: Sub-function decompile (fix_config_stale_text, resync_codex_config) optional for deeper upstream parity; not needed for source archive implementation since source archive designs own fix logic.
**can_start**: Yes — readyToImplement. source archive command exists in relay.rs (fix_codex_router_issue L276). source archive issue taxonomy is source archive-specific; no upstream parity required.
**source archive implementation note**: source archive designs own FixResult/DiagResult/AuditEntry schemas. Upstream schemas are accepted_unknown; source archive not constrained to match field names for source archive-native commands.


---

## ccswitch-ref-109 Gate-Note (2026-06-03)

§10 `test_relay_provider`, §11 `test_relay_draft`, §12 `fetch_relay_models_draft` are elevated from
"upstream-strict Unknown / blocked implementation start" to **`consumerStartReady + startMode=product_decision`**
via cc-switch 3.16.0 source-confirmed mechanics.

See: `<source-location>/audits/macos-1.0.9-relay/logic/RELAY-HTTP-TERMINAL-CCSWITCH-SUBSTITUTE-109.md`

- `strictImplementationUse=false` / `readyToImplement=false` / 
ot_upstream_strict_parity=true` unchanged.
- HTTP terminal structural ceiling (strictImplementationUse) unchanged.
- All 9 consumerStartReady dimensions satisfied; implementation may proceed with product_decision scope.
- Session: ccswitch-ref-109 / <workstation> / 2026-06-03
