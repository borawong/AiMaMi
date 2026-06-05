# WIN-TEST-RELAY-PROVIDER-CAPFILL-109.md
# Cap-Fill: test_relay_provider — dim4 HTTP-terminal closure via known transport
# Platform: windows-x64 | AiMaMi 1.0.9 | Session: <audit-session>

**produced_at**: 2026-06-03
**machine**: <workstation>
**session**: <audit-session>
**binary_sha256**: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
**idb**: `<source-location>/source-binary/AiMaM 1.0.9 win64.exe.i64`
**ida_server**: mcp__ida-pro-mcp-win
**prior_tier**: strictImplementationUse, dim4=**partial** (HTTP terminal accepted_unknown / external_call_recorded)
**new_tier**: strictImplementationUse, dim4=**closed** · **still_capped=false**
**scope**: relay command layer — single leaf `test_relay_provider`

---

## Owner Matrix (PREWRITE_PRODUCER_COLLISION_GATE_V1)

| Field | Value |
|---|---|
| target | `<source-location>/audits/windows-1.0.9-relay/logic/WIN-TEST-RELAY-PROVIDER-CAPFILL-109.md` |
| canonical scope | `aimami/1.0.9/windows/relay` — relay command layer |
| current producer | <workstation> (owner_basis=index_exact_path lines 1086/1304; same machine as relay-closeout-109) |
| this session | <audit-session> / <workstation> — same machine |
| INDEX relevant | windows-1.0.9-relay bundle; no competing/foreign INDEX owner (foreign_index_path_owners = {}) |
| allowed write mode | **ALLOW(owner)** — same-machine owner; new file in `logic/` whitelist |
| collision status | none |
| takeover sensitive-field | not required |
| gate script | `prewrite-owner-gate.py` exit 0, decision=ALLOW, write_mode=owner (run twice: pre-work + pre-write) |

---

## Why it was capped, and why it now closes

**Prior cap (relay-closeout-109 / B-router-test-http session)**: `test_relay_provider` reached `strictImplementationUse` with dim1-3,5-6 closed but dim4 (interface/error/side-effect) scored **partial**, 
ot_ready_reason = "HTTP terminal — server behavior not internally provable (external_call_recorded). Upgrade: HTTP mock E2E or product_decision for HTTP terminal."` The owner @ 0x1408AF110 and the HTTP-send callee `sub_140825280` had been located and the side-effect helpers named, but the HTTP send (client selection, request-body construction, auth injection, retry loop, response parse) was treated as an opaque terminal — the body past `sub_140825280` was `accepted_unknown`. REVERSE-STATUS line 189 flagged it "genuine external-server POST ICF, not in this agent's scope."

**This cap-fill**: the transport stack was fully mapped by the ceiling-crack wf (reused here, not re-derived). With the transport known, the HTTP core `health_check_test_provider_async_core_sys` @ **0x140825280** was decompiled targeted and bound to that transport. It is **not** an ICF-folded thunk: the owner body (0x158B, #wind=26) and the HTTP core (0x1D58, #wind=39) are both genuine recovered functions with full async state machines. Every dim4 element — client selection, request construction (incl. the previously-Unknown probe body), auth injection, retry gate, response parse, error set, and the distinguishing **state-write side-effect** — is now decompiled. The only externally-determined fact is the remote server's response *content*, inherent to any HTTP client (covered by dim6 cargo probe tests). That is an accepted HTTP boundary, not an unknown owner. → **dim4 closed, still_capped=false.**

Ceiling note: tier stays **strictImplementationUse** (NOT readyToImplement) because dim1 frontend CCF is 
ot_closed_windows` (accepted_unknown product_decision per relay cluster policy), so the `full_leaf_100_definition_v2` six-dim gate is not met. dim4 was the cap; dim4 is now closed. (Identical ceiling to the fetch_relay_models_draft cap-fill — see WIN-FETCH-RELAY-MODELS-DRAFT-CAPFILL-109.md.)

---

## Owner & call graph (Windows IDA, targeted)

| Symbol | VA | Role |
|---|---|---|
| `test_relay_provider_owner_sys` | **0x1408AF110** (size 0x158B, 4-phase async state machine, #wind=26) | A-level Tauri async-command owner |
| `sub_1400DA320` | 0x1400DA320 | manager IPC-state resolver (arg field `"manager"` len 7 @ 0x14129C89B) |
| `sub_1411CE640` | 0x1411CE640 | manager/arg missing-error path |
| `import_remote_device_secret_result_adapter_sys` | 0x14045F6C0 | `providerId` (len 10 @ 0x14129C94C) Result-unwrap adapter (tag 6 = Ok); saves provider id to state buf a1+6152 |
| `health_check_test_provider_async_core_sys` | **0x140825280** (size 0x1D58, #wind=39) | HTTP probe orchestrator (shared with test_relay_draft); POST /v1/messages + retry loop |
| `build_test_request_anthropic_sys` | 0x140118030 | Anthropic header builder (x-api-field + anthropic-version + Content-Type; extraHeaders inject) |
| `sub_140C31BF0 / sub_1401AA870 / sub_140C31B10 / sub_140C32FB0 / sub_14088A9D0` | — | async future-poll HTTP dispatch + state transitions (known transport cluster) |
| `interpret_response_async_core_sys` | 0x140827E40 | response-parse async core → RelayTestResult fields |
| `relay_health_retry_after_classifier_sys` | 0x140118EB0 | retry-after / transient classifier |
| `sub_14088D5D0` | 0x14088D5D0 | should_retry predicate (in URL-candidate loop) |
| `sub_1409645B0` | 0x1409645B0 | health-score / RelayTestResult struct assembler |
| `sub_140BF36A0` | 0x140BF36A0 | date/epoch math for timestamp |
| `sub_140153990` | 0x140153990 | last_successful_test timestamp write |
| `relay_state_persist_commit_sys` | **0x1401523E0** | **health metric persist → relay.json file write** (the side-effect that distinguishes this command from fetch) |
| `tauri_ipc_resolve_sys` | 0x140062230 | resolve `CoreEnvelope<RelayTestResult>` back to frontend |
| `WakeByAddressSingle` | 0x141206B20 | Windows async wake primitive |

### Transport reuse (known, not re-derived)
- **Async client selection**: at HTTP-core entry, `*(a2+96)+205` byte selects the shared reqwest client OnceLock pair — `==1` → `unk_14187C348`/`dword_14187C350` (clientA), else → `unk_14187C358`/`dword_14187C360` (clientB). These are the **ASYNC_CLIENT_DIRECT/SYSTEM** OnceLock pair (network mode `direct`/`system`); the core Arc-clones the chosen client via `_InterlockedIncrement64`. Matches the ceiling-crack transport (mac `respond_async_serialized_inner::{{closure}}@0x100114ab0` client-selection; win Arc-clone idiom identical to fetch owner `sub_1401AA050`).
- **Async wake**: `WakeByAddressSingle` (win async wake, per known transport).
- **Retry**: attempt counter `*(v23+104)` vs max `*(v23+108)` (retry count from provider config); `sub_14088D5D0` should_retry predicate + `relay_health_retry_after_classifier_sys@0x140118EB0` retry-after classifier (mirrors known `is_transient_request_error`/`max_retries` gate).
- **Auth branch**: Anthropic path unconditionally — `x-api-field` + `anthropic-version: 2023-06-01` + `Content-Type: application/json` (known transport Anthropic branch). Relay speaks Anthropic protocol on the wire.

---

## Wrapper-body flow (decompiled, targeted)

### Owner @ 0x1408AF110
1. **Entry / async state** (case on `a1[10832]` ∈ {0,1,2,3}; nested inner state switches on a1[10816]/a1[10800]/a1[10792]): standard Tauri async coroutine. First poll memcpy's the 0x1460-byte command context into the future.
2. **manager resolve**: arg field `"manager"` (len 7 @ 0x14129C89B) via `sub_1400DA320` guard; failure → `sub_1411CE640` error.
3. **providerId deserialize**: arg field `"providerId"` (len 10 @ 0x14129C94C) via `import_remote_device_secret_result_adapter_sys`; enum tag `==6` = Ok → saves provider id into state buffer (a1+6152 / a1+6160). This is the **saved-provider** path — it resolves the provider by `providerId` from relay state (contrast fetch_relay_models_draft which takes an inline draft config).
4. **HTTP probe**: calls `health_check_test_provider_async_core_sys(Dst, v5+9576, a2, a4)` — the HTTP send + retry + parse.
5. **Lock + result merge**: `_InterlockedCompareExchange8` on relay-state lock (+16); `"relay state poisoned"` @ 0x14129E09A on poison.
6. **health-score assemble**: `sub_1409645B0(Dst, v46+24)` builds RelayTestResult fields.
7. **timestamp**: `sub_140BF36A0` date math + `sub_140153990(...)` writes the last_successful_test epoch (`1000 * (sec + 86400*days) + micros/1e6`).
8. **persist**: `relay_state_persist_commit_sys(&v145, v64, Dst)` → writes the updated provider health into relay state file.
9. **resolve**: `tauri_ipc_resolve_sys` returns `CoreEnvelope<RelayTestResult>` to the frontend.

### HTTP core @ 0x140825280 (POST /v1/messages)
1. **client select** (case 0): pick ASYNC_CLIENT pair by `*(a2+96)+205`; Arc-clone via `_InterlockedIncrement64`.
2. **retry loop**: attempt `*(v23+104)` vs max `*(v23+108)`; on exhaustion → Err `"all retries exhausted"` (21B).
3. **URL candidates**: builds `/v1/messages` (`aV1Messages` len 12 @ 0x14129CB5A) on the relay base via `sub_140119020`; iterates response-endpoint candidates; empty candidate set → Err `"no valid responses endpoint found"` (33B). `sub_14088D5D0` decides retry between candidates.
4. **request body** (the previously-Unknown probe body, now fully decompiled — a serde_json::Map built via `sub_1400CF0A0` inserts):
   - `"messages"` → array with one object: `{"role":"user","content":"ping"}` (role/user/content/ping built as inline literals: 1701605234="role", 1919251317="user", 1953394531/1953391988="content", 1735289200="ping").
   - `"max_tokens"` = `1` (qmemcpy "max_tokens",10; value int 1).
   - `"model"` = provider model (1701999731+28001 = "model").
5. **auth headers**: `build_test_request_anthropic_sys@0x140118030` → `Content-Type: application/json` + `x-api-field: <apiKey>` (api_key validated: reject bytes <0x20 except TAB, and 0x7F — control-char sanitize) + `anthropic-version: 2023-06-01`; if streaming flag set also `Accept: text/event-stream` + `Accept-Encoding: identity`; `sub_1401163E0` injects provider `extraHeaders`.
6. **dispatch**: `sub_1401AA050` (request build) → async future poll cluster `sub_140C31BF0`/`sub_1401AA870`/`sub_140C31B10`/`sub_140C32FB0`/`sub_14088A9D0`.
7. **response parse**: `interpret_response_async_core_sys@0x140827E40` → ok/status/latency/health fields; provenance `codexmate_lib::core::relay::health_check` / `src\core\relay\health_check.rs`.

---

## Interface / DTO

**Command**: `invoke("test_relay_provider", { providerId })` (arg keys `"manager"` internal + `"providerId"` IDA-confirmed @ 0x14129C94C)

**Request DTO**:
| field | type | note |
|---|---|---|
| providerId | str (required) | resolves a **saved** relay provider (id + api field + base URL) from relay state; deser via `import_remote_device_secret_result_adapter_sys` (tag 6 = Ok) |

**Difference vs draft commands**: `test_relay_provider` takes only `{ providerId }` and resolves the provider config (incl. api field) from saved relay state; `test_relay_draft` / `fetch_relay_models_draft` take the full inline draft config in `input`. All three share the same HTTP core `health_check_test_provider_async_core_sys@0x140825280` (test_* two) / GET path (fetch).

**Response — `CoreEnvelope<RelayTestResult>`** (RelayTestResult shape per relay_models reduce, REVERSE-STATUS line 355, serde string table 0x100EE000D macOS-confirmed cross-platform; assembled here by `sub_1409645B0`):
| field | type | note |
|---|---|---|
| ok | bool | probe success (byte @ +122 in assembler) |
| errorMessage | Option<String> | error text when probe fails |
| modelsSample | Option<String> | sample of returned model/response |
| healthScore | i64 | computed health score |
| latencyMs | i64 | round-trip latency (status/latency @ +120 word) |

**Auth**: `x-api-field: <provider apiKey>` + `anthropic-version: 2023-06-01` + `Content-Type: application/json`. **HTTP**: `POST {relay_base}/v1/messages`, body `{ model, messages:[{role:"user",content:"ping"}], max_tokens:1 }`.

---

## Error set (all IDA-string-confirmed)

| error | trigger | source |
|---|---|---|
| `all retries exhausted` | attempt count `> max retries` (provider retry config) | HTTP core 0x140825280 (21B literal) |
| 
o valid responses endpoint found` | no usable response-endpoint candidate | HTTP core 0x140825280 (33B literal) |
| `relay state poisoned` | relay-state lock poisoned during result merge / persist | owner 0x1408AF110 @ 0x14129E09A + persist 0x1401523E0 @ 0x14125D823 (20B) |
| `a Display implementation returned an error unexpectedly` | Display formatting fault on error path | owner 0x1408AF110 @ 0x14129F200 |
| transient request error (retried) | `relay_health_retry_after_classifier_sys` classifies retryable; `sub_14088D5D0` should_retry | classifier 0x140118EB0 (known transport transient gate) |
| HTTP non-2xx upstream | server returns error status | interpret_response_async_core_sys 0x140827E40 (recorded into RelayTestResult.ok=false / errorMessage) |
| manager / providerId parse failure | arg deser fails | sub_1411CE640 / import_remote_device_secret_result_adapter_sys path |

---

## Side-effect boundary

**This command WRITES state** (field contrast with fetch_relay_models_draft which is HTTP-GET-only, no write):
- **relay state file write**: `relay_state_persist_commit_sys@0x1401523E0` memcpy's a 296B state record, calls `relay_state_write_sys (sub_140155830)` to **write to the relay.json file**, then under a write lock memcpy's the 0x128B updated state into `state[1]+24`. This persists the provider's updated health metric.
- **timestamp write**: `sub_140153990` writes the last_successful_test epoch (computed via `sub_140BF36A0` date math) into the provider record.
- **health-score**: `sub_1409645B0` computes and folds healthScore/latencyMs into the persisted record.
- HTTP POST to relay server (`/v1/messages`).
- Relay-state lock acquire/release (`_InterlockedCompareExchange8` + `WakeByAddressSingle`); Arc refcount bump on the shared async client (clone, not business-state mutation).

The persisted side-effect makes this a **read-write** health probe: testing a provider mutates that provider's health/timestamp in relay state on disk.

---

## dim matrix (post-cap-fill)

| dim | status | basis |
|---|---|---|
| dim1 frontend CCF | accepted_unknown (not_closed_windows, product_decision) | per relay cluster policy; non-blocking, but blocks readyToImplement |
| dim2 backend owner/pseudocode | **closed** | test_relay_provider_owner_sys @ 0x1408AF110 full 0x158B body decompiled (genuine, not ICF) |
| dim3 call-tree to leaf | **closed** | HTTP core + request-builder + auth + retry/classifier + response-parse + health-assemble + persist + timestamp all reached to leaf; depth ≥ 6 |
| dim4 interface/error/side-effect | **closed** (was partial) | client-select + POST /v1/messages body + Anthropic auth + extraHeaders + retry + response parse + RelayTestResult DTO + 7-entry error set + relay.json state-write side-effect all decompiled; transport bound to known ASYNC_CLIENT stack |
| dim5 platform gate | windows_independent_closed | Windows PE evidence; not inferred from macOS |
| dim6 test/acceptance mapping | closed | Vitest `args={providerId:'p1'}`; Cargo probe_provider_retries_with_stream / health_body_error_detection_and_retry_classification / draft_probe_paths_reject_sensitive_extra_headers; RelayTestResult shape from source archive relay.rs |

**Tier**: `strictImplementationUse` (dim1-5 closed, dim6 closed; dim1 accepted_unknown blocks readyToImplement). **still_capped = false.** `implementation_use=false`, `gate_accepted=false`, `readyToImplement=false` (unchanged — readyToImplement needs same-platform frontend UI-trigger CCF closure, which is absent on Windows per platform redline; line-184/macOS-derived promotions must not be inferred onto Windows).

dim6 is the source archive implementation-side test/acceptance activity; it is mapped (cargo + vitest names above), not produced here.

---

## Linked evidence

| Source | Path |
|---|---|
| Prior tier matrix (capped row) | `<source-location>/audits/windows-1.0.9-relay/data/tier-matrix.json` (test_relay_provider, owner_addr 0x1408AF110) |
| Prior raw leaf (B-router-test-http) | `<source-location>/raw/aimami/1.0.9/windows/relay/test_relay_provider/evidence.md` |
| Interface map | `<source-location>/audits/windows-1.0.9-relay/interfaces/relay-interface-map.md` §test_relay_provider |
| Sibling cap-fill (fetch, same pattern) | `<source-location>/audits/windows-1.0.9-relay/logic/WIN-FETCH-RELAY-MODELS-DRAFT-CAPFILL-109.md` |
| cc-switch substitute (prior ceiling) | `<source-location>/audits/windows-1.0.9-relay/logic/RELAY-HTTP-TERMINAL-CCSWITCH-SUBSTITUTE-109.md` §1 |
| Windows binary | `<source-location>/source-binary/AiMaM 1.0.9 win64.exe` (sha a5822387fa3f) |

---

*No .c / .log / binary / dump in this document. Logic file only (AGENTS.md `logic/*.md` whitelist). Platform: windows-x64 (independent closure; doNotInferWindowsFromMacOS). dim4 closed via known transport; owner + HTTP-core bodies fully recovered (not ICF). Not readyToImplement (dim1 frontend CCF accepted_unknown). IDA comments set on owner@0x1408AF110 + HTTP-core@0x140825280; IDB saved. Session: <audit-session> / <workstation> / 2026-06-03.*
