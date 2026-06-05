# RELAY-HTTP-TERMINAL-CCSWITCH-SUBSTITUTE-109.md
# cc-switch 3.16.0 Source Mechanics Substitute — 3 HTTP Terminal Relay Commands
# Platform: windows-x64 | AiMaMi 1.0.9 | Session: ccswitch-ref-109

**produced_at**: 2026-06-03
**machine**: <workstation>
**session**: <audit-session>
**gate_boundary**: consumerStartReady + startMode=product_decision
**scope**: relay command layer only (not relay-core)
**strictly_not**: strictImplementationUse / readyToImplement / upstream_strict_parity
**platform_note**: Windows evidence is independent; macOS cc-switch mechanics apply equally (cross-platform Rust). Windows-specific divergence noted per command where known.

---

## Owner Matrix (PREWRITE_PRODUCER_COLLISION_GATE_V1)

| Field | Value |
|---|---|
| target | `<source-location>/audits/windows-1.0.9-relay/logic/RELAY-HTTP-TERMINAL-CCSWITCH-SUBSTITUTE-109.md` |
| canonical scope | `aimami/1.0.9/windows/relay` — relay command layer |
| current producer | <workstation> / relay-closeout-109 (authoritativeProducer per gate-report.json `session: relay-closeout-109`) |
| this session | ccswitch-ref-109 / <workstation> — same machine |
| INDEX relevant | windows relay bundle from relay-closeout-109; no competing INDEX entry |
| allowed write mode | **ALLOW(owner)** — same machine producer; new file in `logic/` whitelist |
| collision status | none |
| takeover sensitive-field | not required (no competing owner) |

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
- `platformPolicy.windowsIndependent = true`
- `platformPolicy.doNotInferWindowsFromMacOS = true`

Windows gate ceiling is `strictImplementationUse` (same HTTP terminal structural rule). cc-switch source mechanics are cross-platform Rust and apply equally. Windows-specific IDA evidence confirming the same HTTP terminal pattern is cited per command.

---

## cc-switch Source Root

```
<source-location>/
# Local archive (<workstation>):
# <source-location>/local-archive bundleGame/Code/tmp/cc-switch-main/
```

**cc-switch version**: 3.16.0 (cross-platform — same Cargo workspace; no Windows-only source path)

---

## Windows Evidence Context

For the 3 HTTP terminal commands, Windows IDA evidence confirms:
- Command handlers exist in the Windows binary (PE format, `a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b`)
- IDB SHA: from windows-1.0.9-relay bundle `idb_sha256` field
- Per `ACCEPTANCE-MAPPING-109.md` Windows pass: test_relay_provider, test_relay_draft, fetch_relay_models_draft all marked `strictImplementationUse` (HTTP terminal ceiling) with dim1-5 `closed`
- Cross-platform behavioral parity: Windows dim4 side-effects (HTTP terminal) identical to macOS — same reqwest client, same structural ceiling
- Windows-specific: no platform-specific HTTP dispatch differences observed between macOS and Windows builds for these 3 commands (confirmed by relay-closeout-109 cross-platform note)

---

## 1. test_relay_provider — Provider Health Probe (Windows)

### Windows Evidence

| Dimension | Status | Note |
|---|---|---|
| dim1 frontend CCF | accepted_unknown | non-blocking per GATE-SPEC |
| dim2 backend owner/IDA | closed | Windows IDA entry confirmed per ACCEPTANCE-MAPPING-109 |
| dim3 DTO | closed | same struct as macOS (`{ providerId }` arg, RelayTestResult response) |
| dim4 HTTP terminal | **structural ceiling** | external_call_recorded same as macOS |
| dim5 Windows platform | confirmed | |
| dim6 acceptance | closed (mock-assertable portion) | same assertions as macOS |

### cc-switch Mechanics (same as macOS — cross-platform Rust)

**retry entry**: `src-tauri/src/proxy/forwarder.rs:275` `forward_with_retry()`
**retry loop**: `src-tauri/src/proxy/forwarder.rs:315-873` — attempt limit, circuit breaker gate, forward dispatch, success/error paths
**error classification**: `src-tauri/src/proxy/forwarder.rs:1897` `categorize_proxy_error()` — Retryable/NonRetryable/ClientAbort
**auth header injection**: `src-tauri/src/proxy/forwarder.rs:1480-1610` — x-api-field, anthropic-version
**circuit breaker**: `src-tauri/src/proxy/circuit_breaker.rs:13-340` — Closed/Open/HalfOpen state machine

### Windows source archive product_decision

Same as macOS with the following additions:
- Windows keychain equivalent: Windows sensitive-field Manager (same relay.json/keychain read path, Windows-specific sensitive-field store)
- Windows process stop (if needed for codex restart on health failure): same Codex process stop via `is_process_running` Windows equivalent
- No Windows-specific HTTP path differences for provider health probe

### source archive Acceptance Conditions — Windows (product_decision)

All macOS conditions apply. Additional Windows-specific:
1. Windows sensitive-field Manager used for API field retrieval (not macOS Keychain)
2. Codex config path: `%USERPROFILE%\.codex\config.toml` (Windows equivalent of `~/.codex/config.toml`)
3. Manual acceptance: verify test_relay_provider result written to relay.json on Windows build

---

## 2. test_relay_draft — Draft Connection Test (Windows)

### Windows Evidence

| Dimension | Status | Note |
|---|---|---|
| dim1 frontend CCF | accepted_unknown | non-blocking |
| dim2 backend owner/IDA | closed | Windows IDA entry confirmed |
| dim3 DTO | closed | DraftTestInput struct (transport, command, headers, environments, sensitive-field) — Windows same as macOS |
| dim4 HTTP terminal | **structural ceiling** | external_call_recorded |
| dim5 Windows platform | confirmed | |
| dim6 acceptance | closed (mock-assertable portion) | no-persist proven Windows cross-platform |

### cc-switch Mechanics (same as macOS — cross-platform Rust)

**forward dispatch**: `src-tauri/src/proxy/forwarder.rs:918-1299` `forward()` — URL build, header injection, HTTP dispatch
**reasoning_effort detection**: `src-tauri/src/proxy/providers/transform.rs:57-82` `supports_reasoning_effort(model)`
**reasoning_effort inject**: `src-tauri/src/proxy/providers/transform.rs:197-200`

### Windows source archive product_decision

Same as macOS. No platform-specific behavioral differences observed for draft test logic (no-persist is a handler-layer decision, cross-platform identical).

### source archive Acceptance Conditions — Windows (product_decision)

All macOS conditions apply. Additional Windows-specific:
1. API field from keychain via sensitive-field field uses Windows sensitive-field Manager path
2. No persist to relay.json — behavior is platform-independent (relay.json write is skipped in handler regardless of platform)
3. Manual acceptance: verify relay.json unchanged after draft test on Windows build

---

## 3. fetch_relay_models_draft — Draft Model List Fetch (Windows)

### Windows Evidence

| Dimension | Status | Note |
|---|---|---|
| dim1 frontend CCF | accepted_unknown | non-blocking |
| dim2 backend owner/IDA | closed | Windows IDA entry confirmed |
| dim3 DTO | closed | GET /v1/models; x-api-field header; parse_extra_headers; sanitize_api_key; data[].id parse — all Windows-confirmed per ACCEPTANCE-MAPPING-109 |
| dim4 HTTP terminal | **structural ceiling** | external_call_recorded; HTTP GET external ICF |
| dim5 Windows platform | confirmed | fake_http_server cargo tests most complete of 3 HTTP commands |
| dim6 acceptance | closed (mock-assertable portion); closest to readyToImplement | strongest coverage among 3 HTTP commands |

### cc-switch Mechanics (same as macOS — cross-platform Rust)

**Full /v1/models fetch service**: `src-tauri/src/services/model_fetch.rs:53-118`

```
fetch_models(base_url, api_key, is_full_url, models_url_override)
→ build_models_url_candidates()
→ GET {url} Authorization: Bearer {api_key}, timeout 15s
→ 2xx: parse ModelsResponse.data[].id → Vec<FetchedModel> sorted by id
→ 404/405: continue (next candidate)
→ other HTTP: Err immediately
→ all exhausted: Err("All candidates failed")
```

**Response schema**: `model_fetch.rs:19-29`
```rust
ModelsResponse { data: Option<Vec<ModelEntry>> }
ModelEntry { id: String, owned_by: Option<String> }
FetchedModel { id: String, owned_by: Option<String> }
```

**Tauri command**: `src-tauri/src/commands/model_fetch.rs:12-25` — `fetch_models_for_config(base_url, api_key, is_full_url, models_url)`

**URL candidate building**: `model_fetch.rs:129-187` `build_models_url_candidates()` — priority: override > base_url+/v1/models > compat-suffix strip variants

### Windows-Specific Notes

- `parse_extra_headers` is an AiMaMi-specific IDA-proven helper (Windows binary confirmed — same as macOS). cc-switch does not have an equivalent. source archive implements cross-platform.
- `sanitize_api_key`: Windows IDA confirms no api_key in logs (same behavioral proof as macOS). cc-switch model_fetch.rs avoids logging api_key (no explicit sanitize fn, but field not logged). source archive must explicitly guarantee no field in any log line.
- fake_http_server cargo tests: Windows build confirms the /v1/models parse path passes the most extensive test suite of the 3 HTTP commands. This makes Windows platform the strongest unit-test evidence holder for this command.

### source archive Acceptance Conditions — Windows (product_decision)

All macOS conditions apply. Additional Windows-specific:
1. API field from Windows sensitive-field Manager via sensitive-field field
2. `parse_extra_headers` cross-platform (no Windows divergence expected)
3. `sanitize_api_key` cross-platform (no Windows divergence expected)
4. Manual acceptance: verify Vec<String> model IDs returned on Windows build against real provider

---

## 4. Summary — consumerStartReady + startMode=product_decision (Windows)

| Command | consumerStartReady | startMode | cc-switch anchor | Windows platform_scope |
|---|---|---|---|---|
| `test_relay_provider` | true | product_decision | `forwarder.rs:275` retry, `circuit_breaker.rs:13-340` | Windows confirmed; Windows sensitive-field Manager for API field |
| `test_relay_draft` | true | product_decision | `forwarder.rs:918` forward, `transform.rs:57-200` reasoning_effort | Windows confirmed; no-persist cross-platform |
| `fetch_relay_models_draft` | true | product_decision | `services/model_fetch.rs:53-118` full fetch, `commands/model_fetch.rs:12-25` wrapper | Windows confirmed; strongest test coverage of 3 |

**platform_scope_declared**: `Windows confirmed; macOS evidence independent (see macos-1.0.9-relay bundle). doNotInferWindowsFromMacOS = true.`

**gate_upgrade_path**: Permanently `strictImplementationUse` ceiling (HTTP terminal structural). `consumerStartReady + product_decision` is the source archive-actionable state. No additional Windows IDA resolves this gate.

**Companion file**: `<source-location>/audits/macos-1.0.9-relay/logic/RELAY-HTTP-TERMINAL-CCSWITCH-SUBSTITUTE-109.md` — full cc-switch source line-by-line detail. Windows file references macOS file for source depth; does not duplicate line-level analysis.

---

## 5. Linked Evidence

| Source | Path |
|---|---|
| Companion macOS file | `<source-location>/audits/macos-1.0.9-relay/logic/RELAY-HTTP-TERMINAL-CCSWITCH-SUBSTITUTE-109.md` |
| cc-switch services/model_fetch.rs | `<source-location>/src-tauri/src/services/model_fetch.rs` |
| cc-switch commands/model_fetch.rs | `<source-location>/src-tauri/src/commands/model_fetch.rs` |
| cc-switch proxy/forwarder.rs | `<source-location>/src-tauri/src/proxy/forwarder.rs` |
| cc-switch proxy/circuit_breaker.rs | `<source-location>/src-tauri/src/proxy/circuit_breaker.rs` |
| cc-switch proxy/providers/transform.rs | `<source-location>/src-tauri/src/proxy/providers/transform.rs` |
| Windows relay gate-report | `<source-location>/audits/windows-1.0.9-relay/gate-report.json` |
| Windows relay acceptance mapping | `<source-location>/audits/windows-1.0.9-relay/logic/ACCEPTANCE-MAPPING-109.md` |
| AiMaMi 1.0.8-fix relay evidence | `<source-location>/upstream/aimami/1.0.8-fix/darwin-arm64/relay-run-bundle-20260531/` |

---

*No .c / .log / binary files in this document. Logic file only. Gate: consumerStartReady + startMode=product_decision. Platform: windows-x64 (independent closure). Not upstream strict proof. Session: ccswitch-ref-109 / <workstation> / 2026-06-03.*
