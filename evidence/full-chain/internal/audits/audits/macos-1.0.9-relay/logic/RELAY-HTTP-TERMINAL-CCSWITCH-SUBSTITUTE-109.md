# RELAY-HTTP-TERMINAL-CCSWITCH-SUBSTITUTE-109.md
# cc-switch 3.16.0 Source Mechanics Substitute — 3 HTTP Terminal Relay Commands
# Platform: macos-arm64 | AiMaMi 1.0.9 | Session: ccswitch-ref-109

**produced_at**: 2026-06-03
**machine**: <workstation>
**session**: <audit-session>
**gate_boundary**: consumerStartReady + startMode=product_decision
**scope**: relay command layer only (not relay-core); fetch_models async ICF-fold note inline only
**strictly_not**: strictImplementationUse / readyToImplement / upstream_strict_parity

---

## Owner Matrix (PREWRITE_PRODUCER_COLLISION_GATE_V1)

| Field | Value |
|---|---|
| target | `<source-location>/audits/macos-1.0.9-relay/logic/RELAY-HTTP-TERMINAL-CCSWITCH-SUBSTITUTE-109.md` |
| canonical scope | `aimami/1.0.9/macos/relay` — relay command layer |
| current producer | <workstation> / relay-closeout-109 (EXPLICIT_TAKEOVER from <workstation>, recorded in manifest.json + gate-report.json) |
| this session | ccswitch-ref-109 / <workstation> — same machine as authoritativeProducer |
| INDEX canonical line | latest: `aimami/1.0.9/macos-arm64/relay/acceptance-mapping-109-v5-dim6-completion` (<workstation>); stale: line 598 <workstation> (superseded by takeover) |
| allowed write mode | **ALLOW(owner)** — <workstation> is authoritativeProducer post-takeover; new file in `logic/` whitelist |
| collision status | none — ccswitch-ref-109 is same machine, additive new file, does not overwrite canonical gate-report/manifest/README/AI.md |
| takeover sensitive-field | EXPLICIT_TAKEOVER already recorded in bundle manifest.json + gate-report.json |

---

## Gate Boundary (Mandatory)

- `consumerStartReady = true` with `startMode = "product_decision"`
- `strictImplementationUse = false`
- `readyToImplement = false`
- `implementation_use = false`
- `gate_accepted = false`
- `full_leaf_100 = false`
- 
ot_upstream_strict_parity = true`

These 3 commands are permanently ceilinged at `strictImplementationUse` per GATE-SPEC §门控分割 (HTTP terminal structural ceiling) as recorded in gate-report.json. This file elevates each from the former "upstream strict Unknown / blocked" status to **`consumerStartReady + startMode=product_decision`** using cc-switch 3.16.0 source-confirmed mechanics. The ceiling does not change.

**Why product_decision**: AiMaMi command roots for test_relay_draft and fetch_relay_models_draft remain unresolved (`relay-unresolved.txt`). test_relay_provider root is resolved (`health_check::test_provider_async` at 0x10008ee30, fix-side IDA), but exact HTTP request body, retry count, and health_score threshold table are upstream evidence. source archive explicitly accepts differences in request body structure, retry semantics, and score computation as product decisions. cc-switch is not a port of AiMaMi — it is a source-confirmed mechanics substitute.

---

## cc-switch Source Root

```
<source-location>/
# Local archive (<workstation>):
# <source-location>/local-archive bundleGame/Code/tmp/cc-switch-main/
```

**cc-switch version**: 3.16.0 (verified `src-tauri/Cargo.toml:3 version = "3.16.0"`)

---

## 1. test_relay_provider — Provider Health Probe

### AiMaMi Evidence Basis

| Evidence | Source |
|---|---|
| Command root | `health_check::test_provider_async` at `0x10008ee30` (fix-side IDA, `relay-selected.jsonl`) |
| Fix-side line count | `test_relay_provider` = 1160 lines (relay-diff-summary.md); baseline = NOT FOUND |
| Callee | `test_provider_async` shrunk `5740→5364` lines in fix |
| HTTP terminal | `external_call_recorded` — POST to `/v1/messages` or `/v1/chat/completions`; structural ceiling |
| Unresolved | exact request body schema; exact health_score threshold table; retry count |

### cc-switch Equivalent Mechanics (source-confirmed)

#### 1a. Retry/failover entry — `forward_with_retry`

**File**: `src-tauri/src/proxy/forwarder.rs:275-313`

```rust
pub async fn forward_with_retry(
    &self,
    app_type: &AppType,
    method: http::Method,
    endpoint: &str,
    body: Value,
    headers: axum::http::HeaderMap,
    extensions: Extensions,
    providers: Vec<Provider>,
) -> Result<ForwardResult, ForwardError>
```

Entry: acquires `ActiveConnectionGuard`, calls `forward_with_retry_inner`.

#### 1b. Per-provider retry loop — `forward_with_retry_inner`

**File**: `src-tauri/src/proxy/forwarder.rs:315-873`

field phases:
- Lines 351–359: attempt limit check (`attempted_providers >= max_attempts`)
- Lines 362–375: circuit breaker gate (`router.allow_provider_request()`)
- Lines 407–418: dispatch to `self.forward()`
- Lines 420–469: success path — record success, update current_providers, failover check
- Lines 1897–1960: `categorize_proxy_error()` — `Retryable` vs `NonRetryable/ClientAbort`
- Lines 876–913: exhaustion path — all providers rejected → return `last_error`

#### 1c. Error categorization — `categorize_proxy_error`

**File**: `src-tauri/src/proxy/forwarder.rs:1897`

```
ProxyError::Timeout(_)       → Retryable
ProxyError::ForwardFailed(_) → Retryable
(4xx auth/client errors)     → NonRetryable
```

Retryable failures record provider health and continue loop; NonRetryable/ClientAbort exits immediately.

#### 1d. Auth header injection — `forward()` phase 2

**File**: `src-tauri/src/proxy/forwarder.rs:1480-1610`

- Lines 1489: `x-api-field` detected and replaced by adapter auth
- Lines 1530-1531: `anthropic-version` transparently forwarded from client value
- Lines 1575-1578: `anthropic-version` default inserted when missing

Auth headers come from `ProviderAdapter::get_auth_headers()` (trait at `src-tauri/src/proxy/providers/adapter.rs:37`).

#### 1e. Circuit breaker state — `circuit_breaker.rs`

**File**: `src-tauri/src/proxy/circuit_breaker.rs:13-23` — `CircuitState { Closed, Open, HalfOpen }`
**Config**: `src-tauri/src/proxy/circuit_breaker.rs:38-73`:

```rust
pub struct CircuitBreakerConfig {
    pub failure_threshold: u32,    // default: 4
    pub success_threshold: u32,    // default: 2
    pub timeout_seconds: u64,      // default: 60
    pub error_rate_threshold: f64, // default: 0.6
    pub min_requests: u32,         // default: 10
}
```

**File**: `src-tauri/src/proxy/circuit_breaker.rs:157-340`:
- `allow_request()` — Closed → allowed; Open → check timeout → HalfOpen probe; HalfOpen → atomic slot check
- `record_failure(used_half_open_permit)` → increment consecutive_failures; if >= threshold → Open
- `record_success(used_half_open_permit)` → reset consecutive_failures; if HalfOpen successes >= threshold → Closed
- `reset()` — force Closed (used by `reset_circuit_breaker` command after manual recovery)

### source archive Implementation Mapping

| AiMaMi behavior (IDA evidence) | cc-switch substitute | source archive product_decision |
|---|---|---|
| Async provider health probe, POST to provider endpoint | `forward_with_retry` + `forward()` skeleton | source archive implements as single-attempt or configurable retry; no multi-provider failover chain needed (Codex-only v1) |
| x-api-field header injection | `forwarder.rs:1489` + `adapter.rs:37 get_auth_headers()` | source archive reads api_key from relay.json (keychain-scrubbed); injects as `x-api-field` and `Authorization: Bearer` |
| anthropic-version header | `forwarder.rs:1530-1578` | source archive forwards client value or injects default `2023-06-01` |
| health_score thresholds (IDA: 100/70/40/20/0 at 100/300/800/2000ms) | cc-switch has no equivalent score table; cc-switch tracks `is_healthy: bool` + `consecutive_failures` only | **product_decision**: source archive implements own health_score table matching IDA thresholds; cc-switch is substitute for request mechanics only, not score computation |
| Retryable vs non-retryable error split | `categorize_proxy_error()` forwarder.rs:1897 | source archive classifies connection/timeout → retryable; 4xx auth → non-retryable |
| Circuit breaker (added in fix, RIZIN-only) | `circuit_breaker.rs:13-340` full state machine | source archive borrows Closed/Open/HalfOpen pattern; maps to `set_relay_provider_network` breaker field |
| persist health result to relay.json on success | not in cc-switch (no relay.json concept) | **product_decision**: source archive writes health_score+latency_ms+lastTestedAt to relay.json after probe |

### source archive Acceptance Conditions (product_decision)

1. POST to configured provider endpoint with correct auth headers (x-api-field or Authorization: Bearer)
2. health_score computed per IDA threshold table (100/70/40/20/0)
3. latency_ms measured end-to-end
4. Result persisted to relay.json (health_score, latency_ms, lastTestedAt, lastError)
5. Retryable network failure retries at least once; auth 4xx exits immediately
6. Provider not found → CoreError::ProviderNotFound (no HTTP attempt)
7. Manual acceptance: test against real provider endpoint; verify load_relay_state reflects result

---

## 2. test_relay_draft — Draft Connection Test

### AiMaMi Evidence Basis

| Evidence | Source |
|---|---|
| Command root | `relay-unresolved.txt` — root/body glue explicitly UNRESOLVED |
| Behavioral proof | test_relay_draft shares `build_test_request` path with test_relay_provider (IDA dim2); DraftTestInput struct proven; NO persist to relay.json proven (`relay-unresolved.txt` note + dim5) |
| HTTP terminal | `external_call_recorded` — same endpoint selection as test_relay_provider; structural ceiling |
| Distinguishing | draft sentinel `__draft__` in request context; API field from keychain (not provider state); relay.json NOT written on result |

### cc-switch Equivalent Mechanics (source-confirmed)

#### 2a. Request dispatch — same `forward()` skeleton as §1

**File**: `src-tauri/src/proxy/forwarder.rs:918-1299`

Phase 1 (lines 929-969): URL + model mapping
- `adapter.extract_base_url(provider)` — base_url from provider config
- endpoint appended to base_url
- GitHub Copilot / Claude Desktop special routing excluded (not relevant for source archive Codex-only)

Phase 2 (lines 970-1050): header preparation — auth header injection via `get_auth_headers()`

Phase 3 (lines 1050-1100): streaming vs non-streaming fork (draft test = non-streaming)

Phase 4: HTTP dispatch via `hyper_client.rs` / `reqwest`

#### 2b. `reasoning_effort` detection and transform

**File**: `src-tauri/src/proxy/providers/transform.rs:57-82`

```rust
/// Detect OpenAI models that support reasoning_effort.
pub fn supports_reasoning_effort(model: &str) -> bool {
    is_openai_o_series(model)
        || model.to_lowercase().starts_with("gpt-5")
}

/// Resolve appropriate reasoning_effort from Anthropic request body.
pub fn resolve_reasoning_effort(body: &Value) -> Option<&'static str>
// → maps thinking.budget_tokens / output config to "low"/"medium"/"high"
```

**File**: `src-tauri/src/proxy/providers/transform.rs:197-200`

```rust
// Writes reasoning_effort to request when model supports it
```

#### 2c. No-persist behavioral distinction

cc-switch itself does not implement a "draft" concept. The no-persist distinction is entirely <source-location>/product: draft tests are not committed to `relay.json` state. cc-switch `forward()` mechanics apply equally to draft and live requests — the draft distinction is in the calling layer (source archive relay command handler), not in the forwarder.

### source archive Implementation Mapping

| AiMaMi behavior | cc-switch substitute | source archive product_decision |
|---|---|---|
| DraftTestInput struct (transport, command, headers, environments, sensitive-field) | No equivalent; cc-switch uses Provider struct | **product_decision**: source archive defines DraftTestInput accepting transport+command+headers+environments+sensitive-field; api_key fetched from keychain via `sensitive-field` |
| Draft sentinel `__draft__` in request context | No cc-switch equivalent | **product_decision**: source archive may include sentinel as a custom header or log field; upstream semantics Unknown |
| Endpoint selection (same as test_relay_provider) | `forwarder.rs:929-969` URL build + `adapter.extract_base_url` | source archive selects `/v1/messages` (claude models) or `/v1/chat/completions` (other) |
| reasoning_effort when model supports it | `transform.rs:57-200` supports_reasoning_effort + resolve | source archive applies reasoning_effort to draft request body when model is o-series/gpt-5 |
| NO persist to relay.json | Not in cc-switch (no relay.json) | **product_decision**: source archive command handler does NOT call persist after draft test; relay.json mtime unchanged |
| Response = RelayTestResult (latency_ms, health_score) | No equivalent struct | **product_decision**: source archive reuses same RelayTestResult as test_relay_provider; health_score computed same way |
| Error path: return Err, not persist | `categorize_proxy_error` retryable/non-retryable | source archive propagates error without writing relay.json |

### source archive Acceptance Conditions (product_decision)

1. DraftTestInput accepted with transport, command, extra headers, sensitive-field
2. API field sourced from keychain via sensitive-field field (not from provider state)
3. reasoning_effort included in request body when model is o-series or gpt-5
4. relay.json NOT modified after draft test (no persist — verify by mtime check)
5. Error path: HTTP failure returns Err; relay.json unchanged
6. Response: RelayTestResult with latency_ms, health_score (same schema as test_relay_provider)
7. Manual acceptance: run draft test with real credentials; verify relay.json unchanged after

---

## 3. fetch_relay_models_draft — Draft Model List Fetch

### AiMaMi Evidence Basis

| Evidence | Source |
|---|---|
| Command root | `relay-unresolved.txt` — root/body glue UNRESOLVED |
| HTTP terminal | GET to `{base_url}/v1/models`; `external_call_recorded`; structural ceiling |
| Proven (IDA dim2-4) | GET /v1/models URL; x-api-field header; parse_extra_headers helper; sanitize_api_key (no field in logs); NO relay.json write; parse_model_ids extracts `data[].id` |
| Closest to readyToImplement | Strongest cargo unit test coverage of 3 HTTP commands (fake_http_server tests most complete) |

### cc-switch Equivalent Mechanics (source-confirmed)

This command has the strongest cc-switch source-confirmed substitute via `services/model_fetch.rs`.

#### 3a. Full `/v1/models` fetch service

**File**: `src-tauri/src/services/model_fetch.rs:53-118`

```rust
pub async fn fetch_models(
    base_url: &str,
    api_key: &str,
    is_full_url: bool,
    models_url_override: Option<&str>,
) -> Result<Vec<FetchedModel>, String>
```

field mechanics:
- Line 59-61: api_key empty check → early error `"API field is required to fetch models"`
- Lines 63-64: `build_models_url_candidates()` + `crate::proxy::http_client::get()` (shared reqwest client)
- Lines 67-80: GET request with `Authorization: Bearer {api_key}` header, 15s timeout
- Lines 82-101: 2xx → parse `ModelsResponse { data: Option<Vec<ModelEntry>> }` → extract `id` + `owned_by`; sort by id alphabetically
- Lines 104-108: 404/405 → `last_err = Some(format!("HTTP {status}: {body}"))` → `continue` (try next candidate)
- Lines 110-111: other HTTP errors → immediate `Err(format!("HTTP {status}: {body}"))` (non-retryable terminal)
- Lines 114-117: all candidates exhausted → `Err("All candidates failed: ...")`

#### 3b. URL candidate building — `build_models_url_candidates`

**File**: `src-tauri/src/services/model_fetch.rs:129-187`

Candidate priority:
1. `models_url_override` if non-empty → single candidate
2. `base_url` + `/v1/models` (or `/models` if base_url ends with `/v1`)
3. Strip known compat suffix (e.g., `/anthropic`, `/api/anthropic`) → root + `/v1/models`
4. Same stripped root + `/models`

Candidates deduplicated, max 3.

For AiMaMi relay context: source archive relay only needs candidate 1 or 2 (Codex-only, no compat suffix stripping needed). The multi-candidate fallback is a cc-switch extension for third-party providers.

#### 3c. Response schema

**File**: `src-tauri/src/services/model_fetch.rs:19-29`

```rust
struct ModelsResponse {
    data: Option<Vec<ModelEntry>>,
}
struct ModelEntry {
    id: String,
    owned_by: Option<String>,
}
pub struct FetchedModel {
    pub id: String,
    pub owned_by: Option<String>,
}
```

Parses standard OpenAI-compatible `/v1/models` response: `{ "data": [{"id": "...", ...}] }`.

#### 3d. Tauri command wrapper

**File**: `src-tauri/src/commands/model_fetch.rs:1-25`

```rust
#[tauri::command(rename_all = "camelCase")]
pub async fn fetch_models_for_config(
    base_url: String,
    api_key: String,
    is_full_url: Option<bool>,
    models_url: Option<String>,
) -> Result<Vec<FetchedModel>, String>
```

This is the cc-switch equivalent of AiMaMi's `fetch_relay_models_draft`. Note differences: cc-switch accepts raw base_url + api_key from the UI config form; AiMaMi's draft version takes a DraftInput with extra headers and reads api_key from keychain.

#### 3e. Extra headers (parse_extra_headers)

cc-switch does not implement `parse_extra_headers` in `model_fetch.rs`. This is an AiMaMi-specific feature (IDA-proven). source archive must implement a `parse_extra_headers(input: &str) -> HashMap<String, String>` that parses a JSON string of extra header field-value pairs and injects them into the GET request.

#### 3f. API field sanitization (sanitize_api_key)

cc-switch `model_fetch.rs` uses the api_key directly in the Authorization header without an explicit sanitize step (no logging of the field in the fetch function). AiMaMi has an explicit `sanitize_api_key` helper proven by IDA (dim4 accepted). source archive must not log the api_key in any log message produced by the fetch function.

#### 3g. ICF-fold context for relay-core `fetch_models` (inline note only — do not write to relay-core bundle)

The `relay_fetch_models` / `fetch_openai_async` function in relay-core is ICF-folded with the main forward path. Its cc-switch equivalent is the same `forward_with_retry` + `forward()` in `forwarder.rs:275-1299` (async, full provider routing). The `fetch_models_for_config` command in cc-switch (`commands/model_fetch.rs:1-25` → `services/model_fetch.rs:53-118`) is the closest structural match: direct async GET /v1/models + parse. The ICF fold means relay-core's `fetch_models` owner cannot be independently confirmed — this note is returned inline per task spec; do not add to relay-core bundle (closeout workflow owns that).

### source archive Implementation Mapping

| AiMaMi behavior (IDA proven) | cc-switch substitute | source archive product_decision |
|---|---|---|
| GET `{base_url}/v1/models` | `model_fetch.rs:67-80` — GET with `Authorization: Bearer` + 15s timeout | source archive builds URL as `{provider.base_url}/v1/models`; timeout configurable |
| x-api-field header | `model_fetch.rs:70`: `header("Authorization", format!("Bearer {api_key}"))` | source archive also injects `x-api-field: {api_key}` (AiMaMi uses both; cc-switch uses Bearer only) |
| parse_extra_headers(input) | No cc-switch equivalent in model_fetch | **product_decision**: source archive parses `extra_headers` JSON string → inject as additional request headers |
| sanitize_api_key (no field in logs) | cc-switch implicitly avoids logging; no explicit sanitize fn | **product_decision**: source archive must explicitly not log api_key in any fetch log message |
| parse `data[].id` → Vec<String> | `model_fetch.rs:85-101` — `ModelsResponse.data[].id` extraction | source archive parses same OpenAI-compatible schema; returns `Vec<String>` model IDs |
| 404/405 → continue / non-404 → Err | `model_fetch.rs:104-111` error classification | source archive adapts: 404/405 → Err (single-URL context, no multi-candidate); other HTTP → Err |
| JSON parse error → Err | `model_fetch.rs:85-90` `.json().await.map_err(...)` | source archive propagates parse error as Err |
| NO relay.json write | Not in cc-switch | **product_decision**: source archive command handler does NOT write relay.json after draft model fetch |
| DraftInput (transport, headers, sensitive-field) | cc-switch uses raw base_url+api_key args | **product_decision**: source archive DraftInput struct; api_key from keychain via sensitive-field |

### source archive Acceptance Conditions (product_decision)

1. GET `{base_url}/v1/models` with `Authorization: Bearer {api_key}` and `x-api-field: {api_key}` headers
2. Extra headers from `parse_extra_headers(extra_headers_str)` injected into request
3. API field NOT logged (sanitize_api_key: no field in any log line produced by this function)
4. Success: parse `data[].id` → return `Vec<String>` model IDs
5. Empty data array → return `Ok(vec![])` (not an error)
6. Non-2xx (non-404/405) → return `Err` immediately
7. JSON parse error → return `Err`
8. relay.json NOT modified (no persist — verify by mtime check)
9. Manual acceptance: test against real provider; verify Vec<String> model IDs in response

---

## 4. Summary — consumerStartReady + startMode=product_decision

All three commands are elevated from "upstream strict Unknown / blocked" to **`consumerStartReady + startMode=product_decision`** per GATE-SPEC §Gate 1.

| Command | consumerStartReady | startMode | cc-switch file:line anchor | product_decisions_required |
|---|---|---|---|---|
| `test_relay_provider` | true | product_decision | `forwarder.rs:275` (retry entry), `forwarder.rs:1897` (error categorization), `circuit_breaker.rs:13-340` (state machine) | health_score table, retry count, persist schema |
| `test_relay_draft` | true | product_decision | `forwarder.rs:918` (forward), `transform.rs:57-200` (reasoning_effort) | DraftTestInput struct, draft sentinel, no-persist enforcement |
| `fetch_relay_models_draft` | true | product_decision | `services/model_fetch.rs:53-118` (full fetch service), `commands/model_fetch.rs:1-25` (command wrapper) | parse_extra_headers, sanitize_api_key, DraftInput binding |

**gate_upgrade_path**: These 3 commands are permanently at `strictImplementationUse` ceiling (HTTP terminal structural rule). `consumerStartReady + product_decision` is the source archive-actionable working state. No amount of additional IDA decompile changes this — it is a structural gate rule, not a missing-work gap.

**can_start_implementation**: Yes — all 9 `consumerStartReady` dimensions are satisfied:
- `renderSurfaceReady`: relay provider UI / models list UI / draft form — upstream frontend CCF accepted_unknown (non-blocking per GATE-SPEC); source archive frontend confirmed in prior closure
- `uiCallEntryReady`: invoke("test_relay_provider") / invoke("test_relay_draft") / invoke("fetch_relay_models_draft") — proven by IDA dim1
- `dtoBoundaryReady`: request/response DTOs documented above; accepted_unknown for unresolved upstream fields
- `happyPathReady`: HTTP send → parse → result or persist — cc-switch mechanics confirmed
- `boundaryPathReady`: retryable/non-retryable split, no-persist on draft, error propagation — proven
- `sideEffectReady`: test_relay_provider persists to relay.json; test_relay_draft and fetch_relay_models_draft do NOT persist
- `frontendConsumptionReady`: relay state cache invalidation / models cache / status transitions — prior frontend closure
- `acceptanceDraftReady`: acceptance conditions listed per-command above
- `platformScopeDeclared`: macOS confirmed; Windows independent (see windows bundle)

---

## 5. Linked Evidence

| Source | Path |
|---|---|
| cc-switch services/model_fetch.rs | `<source-location>/src-tauri/src/services/model_fetch.rs` |
| cc-switch commands/model_fetch.rs | `<source-location>/src-tauri/src/commands/model_fetch.rs` |
| cc-switch proxy/forwarder.rs | `<source-location>/src-tauri/src/proxy/forwarder.rs` |
| cc-switch proxy/circuit_breaker.rs | `<source-location>/src-tauri/src/proxy/circuit_breaker.rs` |
| cc-switch proxy/providers/transform.rs | `<source-location>/src-tauri/src/proxy/providers/transform.rs` |
| cc-switch proxy/providers/adapter.rs | `<source-location>/src-tauri/src/proxy/providers/adapter.rs` |
| AiMaMi 1.0.8-fix relay evidence | `<source-location>/upstream/aimami/1.0.8-fix/darwin-arm64/relay-run-bundle-20260531/` |
| Legacy 1.0.8 cc-switch source evidence | `<source-location>/_legacy-archive/<source-location>/audits/macos-1.0.8-fix-relay/logic/CCSWITCH-SOURCE-EVIDENCE.md` |
| Legacy 1.0.8 acceptance map | `<source-location>/_legacy-archive/<source-location>/audits/macos-1.0.8-fix-relay/logic/RELAY-CCSWITCH-source archive-ACCEPTANCE-MAP.md` |
| 1.0.9 macos dim6 acceptance mapping | `<source-location>/audits/macos-1.0.9-relay/logic/ACCEPTANCE-MAPPING-109.md` (§10-12) |
| AiMaMi fix ccswitch fusion analysis | `<source-location>/_legacy-archive/<source-location>/audits/macos-1.0.8-fix-relay/logic/CCSWITCH-FUSION-ANALYSIS.md` |

---

*No .c / .log / binary files in this document. Logic file only. Gate: consumerStartReady + startMode=product_decision. Not upstream strict proof. Session: ccswitch-ref-109 / <workstation> / 2026-06-03.*
