# WIN-TEST-RELAY-DRAFT-CAPFILL-109.md
# Cap-Fill: test_relay_draft — dim4 HTTP-terminal closure via known transport
# Platform: windows-x64 | AiMaMi 1.0.9 | Session: <audit-session>

**produced_at**: 2026-06-03
**machine**: <workstation>
**session**: <audit-session>
**binary_sha256**: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
**idb**: `<source-location>/source-binary/AiMaM 1.0.9 win64.exe.i64`
**ida_server**: mcp__ida-pro-mcp-win
**prior_tier**: strictImplementationUse, dim4=**partial** (HTTP terminal accepted_unknown / external_call_recorded)
**new_tier**: strictImplementationUse, dim4=**closed** · **still_capped=false**
**scope**: relay command layer — single leaf `test_relay_draft`

---

## Owner Matrix (PREWRITE_PRODUCER_COLLISION_GATE_V1)

| Field | Value |
|---|---|
| target | `<source-location>/audits/windows-1.0.9-relay/logic/WIN-TEST-RELAY-DRAFT-CAPFILL-109.md` |
| canonical scope | `aimami/1.0.9/windows/relay` — relay command layer (`test_relay_draft` leaf) |
| current producer | <workstation> (owner_basis=index_exact_path lines 1086/1304/1307; same machine as relay-closeout-109 + provider/fetch cap-fills) |
| this session | <audit-session> / <workstation> — same machine |
| INDEX relevant | windows-1.0.9-relay bundle; `foreign_index_path_owners = {}` (no competing/foreign INDEX owner) |
| allowed write mode | **ALLOW(owner)** — same-machine owner; new file in `logic/` whitelist |
| collision status | none |
| takeover sensitive-field | not required |
| gate script | `prewrite-owner-gate.py` exit 0, decision=ALLOW, write_mode=owner |

---

## Why it was capped, and why it now closes

**Prior cap (relay-closeout-109 / B-router-test-http session)**: `test_relay_draft` reached `strictImplementationUse` with dim1-3,5-6 closed but dim4 (interface/error/side-effect) scored **partial**, 
ot_ready_reason = "dim4 partial: HTTP terminal — server behavior not internally provable. Upgrade: HTTP mock E2E or product_decision."` The owner @ 0x140913E40 and the shared HTTP-send callee `sub_140825280` were located (raw `test_relay_draft/evidence.md`), but the HTTP send was treated as an opaque terminal (`terminated_reason: external_call_recorded`), and three facts were left explicitly **Unknown** in that evidence: (a) exact fields of the `input` draft DTO, (b) whether the `__draft__` fallback id is used in health-metric storage, (c) whether `sub_140855070` is a distinct state-write path from the normal provider update.

**This cap-fill**: the transport stack was fully mapped by the ceiling-crack wf and bound in the sibling `WIN-TEST-RELAY-PROVIDER-CAPFILL-109.md` (reused here, not re-derived). With the transport known, the owner body @ **0x140913E40** was decompiled targeted (0x1451 bytes, #wind=24, multi-phase async coroutine) and confirmed a **genuine recovered body — NOT an ICF-folded thunk or drop-in-place**. Every dim4 element is now resolved:
- the `input` DTO is the **9-field `RelayDraftTestInput`** (deser `sub_1404626C0`, source archive-source-confirmed);
- the `__draft__` fallback id materialization is decompiled (register-built `0x5F74666172645F5F` + `'_'`);
- the shared HTTP core `health_check_test_provider_async_core_sys@0x140825280` is bound to the known transport (client-select, retry, Anthropic auth, response-parse — already byte-proven in the provider cap-fill);
- the **distinguishing side-effect is proven by callee absence**: the owner's full callee set does **NOT** include `relay_state_persist_commit_sys@0x1401523E0` nor `relay_state_write_sys@0x140155830`, so unlike `test_relay_provider`, `test_relay_draft` performs **HTTP POST only with NO relay.json write** — and this matches the source archive source (`core/relay/mod.rs::test_draft` calls `probe_provider` then returns `test_result_from_probe`, with no `save_state_file`).

The only externally-determined fact is the remote server's response *content*, inherent to any HTTP client (covered by dim6 cargo/vitest tests). That is an accepted HTTP boundary, not an unknown owner. → **dim4 closed, still_capped=false.**

Ceiling note: tier stays **strictImplementationUse** (NOT readyToImplement) because dim1 frontend CCF is 
ot_closed_windows` (accepted_unknown product_decision per relay cluster policy), so the `full_leaf_100_definition_v2` six-dim gate is not met. dim4 was the cap; dim4 is now closed. (Identical ceiling to the test_relay_provider and fetch_relay_models_draft cap-fills.)

---

## Owner & call graph (Windows IDA, targeted)

| Symbol | VA | Role |
|---|---|---|
| `test_relay_draft_owner_sys` | **0x140913E40** (size 0x1451, multi-phase async state machine, #wind=24, GENUINE not ICF) | A-level Tauri async-command owner |
| `sub_1400DA320` | 0x1400DA320 | manager IPC-state resolver (arg field `"manager"` len 7 @ 0x14129C89B) |
| `sub_1411CE640` | 0x1411CE640 | manager/arg result adapter (tag 6 = Ok) / missing-error path |
| `sub_1404626C0` | **0x1404626C0** | `input` (arg field `"input"` len 5 @ 0x14129C99A) → **`RelayDraftTestInput` 9-field draft config** deserializer (callees include `import_remote_device_secret_arg_validator_sys@0x14045EFD0`, draft validators, `sub_1412085B0` error) |
| `sub_14105D540` | 0x14105D540 | provider-table entry unwrap (string id) |
| `relay_keychain_get_api_key_sys` | **0x140571180** | api_key fallback: read **saved** field by providerId when inline draft apiKey empty (matches source archive `api_key_store::get_api_key`) |
| `health_check_test_provider_async_core_sys` | **0x140825280** (size 0x1D58, #wind=39) | HTTP probe orchestrator — **SHARED with test_relay_provider**; POST /v1/messages + retry loop + Anthropic auth + response parse (known transport, fully decompiled in WIN-TEST-RELAY-PROVIDER-CAPFILL-109.md) |
| `sub_140854EE0` | 0x140854EE0 | response result unwrap |
| `sub_1401808E0` | 0x1401808E0 | request-context cleanup |
| `sub_140855070` | 0x140855070 | response-state update — **IN-MEMORY only** (callees = unwrap + cleanup + dealloc; NO file write) |
| `sub_140438420` | 0x140438420 | RelayTestResult struct serialize (in-memory; alloc only) |
| `sub_140453790` | 0x140453790 | CoreEnvelope build (serde field serializers; no file IO) |
| `sub_140BF36A0` | 0x140BF36A0 | date/epoch math for timestamp field |
| `sub_140DE5140` / `sub_140882970` | — | Display-impl error path |
| `tauri_ipc_resolve_sys` | 0x140062230 | resolve `CoreEnvelope<RelayTestResult>` back to frontend |
| `WakeByAddressSingle` | 0x141206B20 | Windows async wake primitive (state-lock release) |

### Transport reuse (known, not re-derived)
Bound from `WIN-TEST-RELAY-PROVIDER-CAPFILL-109.md` (the shared HTTP core 0x140825280 is byte-identical for both test_* commands):
- **Async client selection**: at HTTP-core entry, `*(a2+96)+205` byte selects the shared reqwest client OnceLock pair — `==1` → `unk_14187C348`/`dword_14187C350` (ASYNC_CLIENT_DIRECT), else → `unk_14187C358`/`dword_14187C360` (ASYNC_CLIENT_SYSTEM); Arc-clone via `_InterlockedIncrement64`. Network mode `direct`/`system` from the draft's 
etwork` field.
- **Async wake**: `WakeByAddressSingle` (win async wake, per known transport).
- **Retry**: attempt counter `*(v23+104)` vs max `*(v23+108)`; `sub_14088D5D0` should_retry predicate + `relay_health_retry_after_classifier_sys@0x140118EB0` retry-after classifier (known `is_transient_request_error`/`max_retries` gate).
- **Auth branch**: Anthropic path unconditionally — `x-api-field` + `anthropic-version: 2023-06-01` + `Content-Type: application/json` via `build_test_request_anthropic_sys@0x140118030` (known transport Anthropic branch); `extraHeaders` injected via `sub_1401163E0`. POST `{draft_base}/v1/messages`, body `{ model, messages:[{role:"user",content:"ping"}], max_tokens:1 }`.

---

## Wrapper-body flow (decompiled, targeted)

Owner @ 0x140913E40 — phase switch on `a1[13040] ∈ {0,1,2,3}` with nested inner phase switches on a1[13024]/a1[13016]/a1[13008]/a1[13000] (standard Tauri async coroutine, even deeper-nested than test_relay_provider). First poll memcpy's the command context (0x18B0 bytes from a1+392) into the future.

1. **manager resolve** (Phase 0, LABEL_4): arg field `"manager"` (len 7 @ 0x14129C89B) via `sub_1400DA320`; failure → `sub_1411CE640` result adapter (tag `==6` = Ok).
2. **input deserialize**: arg field `"input"` (len 5 @ 0x14129C99A) via `sub_1404626C0(Dst)` → the **9-field `RelayDraftTestInput`** draft config. Fields are folded into the future's state buffer (`*((_OWORD *)v14 + 456..462)` block + `v14[7264]`/`v14[7265..7271]` = tag+len words). This is the **draft-config-in-arg** path — contrast `test_relay_provider` which takes only `{providerId}` and resolves a saved provider.
3. **provider resolve from draft** (Phase 2, LABEL_12/LABEL_15): `v22 = *((_QWORD **)v5 + 1406)` = relay provider registry; copies draft into local buffers (v5+11264, v5+11424). Acquires relay-state lock via `_InterlockedCompareExchange8(*v22[1]+16, 1, 0)`; `WakeByAddressSingle` on release; poison → `"relay state poisoned"` @ 0x14129E09A via `sub_1412085B0`.
4. **provider-table lookup + api_key**: loops the 208-byte provider entries (`208 * v33` stride): `while (*(v24-56) != v28 || memcmp(*(v24-64), v27, v28))` matching by id string. On match: `sub_14105D540` unwraps the id; `relay_keychain_get_api_key_sys@0x140571180` reads the saved api field (fallback when inline draft apiKey is empty). On miss (stride loop overflow `v35 -= 208; if(!v35)` → `0x8000000000000000`).
5. **`__draft__` fallback id** (LABEL after `sub_140BF36A0`): when the saved-provider lookup misses, allocate a 9-byte string register-built as `0x5F74666172645F5F` ("__draft_") + byte `95` ('_') = **"__draft__"** (`v49 = sub_140001360(9, 1); *(_QWORD*)v49 = 0x5F74666172645F5FLL; *(_BYTE*)(v49+8) = 95`), used as the synthetic provider id for the unsaved draft.
6. **timestamp**: `sub_140BF36A0` date math computes `1000 * (sec + 86400*days) + micros/1e6` into the local probe-context record (`*((_QWORD *)v5 + 1470/1471)`).
7. **HTTP probe** (LABEL_64): `health_check_test_provider_async_core_sys((__int64)v132, (__int64)(v5 + 11784), (__int64)v150, (__int64)a4)` — the shared HTTP send + retry + parse. The probe context at `v5+11784` is built **from the draft config** (not from a saved provider's persisted state).
8. **response unwrap / state update**: `sub_140854EE0` (unwrap) → `sub_1401808E0` (cleanup request context) → `sub_140855070(v152)` (**in-memory** response-state update on the local draft buffer `v152`) → `sub_140438420` (serialize RelayTestResult) → `sub_140453790` (CoreEnvelope build) OR on Display fault → `"a Display implementation returned an error unexpectedly"` @ 0x14129F200.
9. **resolve**: `tauri_ipc_resolve_sys` @ 0x140062230 returns `CoreEnvelope<RelayTestResult>` to the frontend.

**No persist step.** The owner never calls `relay_state_persist_commit_sys@0x1401523E0` or `relay_state_write_sys@0x140155830` (proven by callee enumeration below). The flow ends at IPC-resolve directly after the in-memory serialize.

### Shared HTTP core @ 0x140825280 (POST /v1/messages)
Identical to test_relay_provider (see WIN-TEST-RELAY-PROVIDER-CAPFILL-109.md §"HTTP core"): client-select by `*(a2+96)+205`; retry loop `*(v23+104)` vs `*(v23+108)` → `"all retries exhausted"` (21B) / `"no valid responses endpoint found"` (33B); request body `{messages:[{role:"user",content:"ping"}], max_tokens:1, model}`; Anthropic auth headers; async future-poll dispatch cluster; `interpret_response_async_core_sys@0x140827E40` parse. The draft owner feeds this core a probe context derived from the draft config instead of a saved-provider config.

---

## Interface / DTO

**Command**: `invoke("test_relay_draft", { input })` (arg keys `"manager"` internal @ 0x14129C89B + `"input"` IDA-confirmed @ 0x14129C99A)

**Request DTO — `RelayDraftTestInput` (9 fields, source archive `core/relay/mod.rs` L246-260 confirmed; deser `sub_1404626C0`)**:
| field | type | note |
|---|---|---|
| providerId | Option<String> | `#[serde(default)]`; used as fallback field to read a **saved** api_key when inline `apiKey` is empty/absent |
| name | String | draft provider display name |
| baseUrl | String | relay base URL (trimmed; HTTP core appends `/v1/messages`) |
| apiKey | Option<String> | `#[serde(default)]`; inline draft field (preferred); empty → fall back to keychain by providerId |
| model | String | model id placed into probe request body |
| wireApi | RelayWireApi | wire protocol → on-wire Anthropic POST /v1/messages |
| extraHeaders | HashMap<String,String> | `deserialize_extra_headers_draft`; injected via `sub_1401163E0`; sensitive headers rejected (`validate_persistable_extra_headers`) |
| network | RelayNetworkMode | selects ASYNC_CLIENT DIRECT/SYSTEM in HTTP core |
| ide | RelayIde | `#[serde(default)]` |

**Difference vs `test_relay_provider`**: provider takes only `{providerId}` and resolves the full saved config (incl. api field) from relay state; **draft takes the full inline 9-field draft config** in `input` and uses it directly (with optional keychain api_key fallback via providerId). Both share the same HTTP core `health_check_test_provider_async_core_sys@0x140825280`. `fetch_relay_models_draft` takes the sibling `RelayFetchModelsInput` (7 fields, no 
ame`/`model`) and hits GET /v1/models.

**Response — `CoreEnvelope<RelayTestResult>`** (RelayTestResult shape per relay_models reduce, REVERSE-STATUS line 355, serde string table 0x100EE000D macOS-confirmed cross-platform; assembled here by `sub_140438420`):
| field | type | note |
|---|---|---|
| ok | bool | probe success |
| errorMessage | Option<String> | error text when probe fails |
| modelsSample | Option<String> | sample of returned model/response (source archive `test_result_from_probe` populates from `parse_model_ids`) |
| healthScore | i64 | computed health score |
| latencyMs | i64 | round-trip latency |

**Auth**: `x-api-field: <apiKey>` + `anthropic-version: 2023-06-01` + `Content-Type: application/json`. **HTTP**: `POST {draft_base}/v1/messages`, body `{ model, messages:[{role:"user",content:"ping"}], max_tokens:1 }`.

---

## Error set (all IDA-string-confirmed)

| error | trigger | source |
|---|---|---|
| `all retries exhausted` | attempt count `> max retries` | shared HTTP core 0x140825280 (21B literal) |
| 
o valid responses endpoint found` | no usable response-endpoint candidate | shared HTTP core 0x140825280 (33B literal) |
| `relay state poisoned` | relay-state lock poisoned during draft-provider resolve | owner 0x140913E40 @ 0x14129E09A (20B) via sub_1412085B0 |
| `a Display implementation returned an error unexpectedly` | Display formatting fault on error path | owner 0x140913E40 @ 0x14129F200 (55B) |
| transient request error (retried) | retry-after classifier `relay_health_retry_after_classifier_sys` / should_retry | classifier 0x140118EB0 (known transport transient gate) |
| HTTP non-2xx upstream | server returns error status | interpret_response_async_core_sys 0x140827E40 (recorded into RelayTestResult.ok=false / errorMessage) |
| manager / input parse failure | arg deser fails | sub_1411CE640 / sub_1404626C0 path |
| draft extraHeaders sensitive-header reject | draft includes forbidden header | input deser sub_1404626C0 → validator (source archive `validate_persistable_extra_headers`; cargo `draft_probe_paths_reject_sensitive_extra_headers`) |

---

## Side-effect boundary

**This command does NOT write persistent state** (the field contrast with `test_relay_provider`, which DOES persist health to relay.json):
- **HTTP POST** to the draft relay base (`/v1/messages`) — the only external effect.
- **No relay.json file write**: the owner's complete callee set (enumerated below) does **NOT** include `relay_state_persist_commit_sys@0x1401523E0` nor `relay_state_write_sys@0x140155830`. `sub_140855070` (response-state update) is **in-memory only** — its callees are `sub_140854EE0` (unwrap) + `sub_1401808E0` (cleanup) + `sub_140001370` (dealloc), no file IO.
- Relay-state **lock** acquire/release (`_InterlockedCompareExchange8` + `WakeByAddressSingle`) and Arc refcount bump on the shared async client (clone, not business-state mutation) are transient, not persisted writes.
- The `__draft__` fallback id and the timestamp are written only into the **local probe-context buffer** (the async future's stack/heap state), not flushed to disk.

This makes `test_relay_draft` a **read-only-on-disk** health probe: testing an unsaved draft sends an HTTP request but mutates no on-disk relay state. (source archive source agreement: `test_draft` → `probe_provider` → `test_result_from_probe`, no `save_state_file`.)

**Owner callee enumeration (IDA `callees` @ 0x140913E40, complete):** memcpy, sub_1400DA320, sub_1411CE640, sub_1404626C0, memcmp, sub_14105D540, sub_140889870, sub_1400CA020, sub_140001370, relay_keychain_get_api_key_sys, sub_140BF36A0, nullsub_1, sub_140001360, **health_check_test_provider_async_core_sys@0x140825280**, sub_140854EE0, sub_1401808E0, sub_140855070, sub_140438420, sub_14120829B, sub_140453790, sub_140DE5140, sub_140882970, sub_14085A860, **tauri_ipc_resolve_sys**, sub_141206A60, sub_1412077A0, sub_1412085B0, WakeByAddressSingle, sub_141208970, sub_141208950. **(0x1401523E0 and 0x140155830 absent → no persist.)**

---

## dim matrix (post-cap-fill)

| dim | status | basis |
|---|---|---|
| dim1 frontend CCF | accepted_unknown (not_closed_windows, product_decision) | per relay cluster policy; non-blocking, but blocks readyToImplement |
| dim2 backend owner/pseudocode | **closed** | test_relay_draft_owner_sys @ 0x140913E40 full 0x1451 body decompiled (genuine multi-phase async, not ICF/drop-in-place) |
| dim3 call-tree to leaf | **closed** | input-deser + provider-resolve + keychain + shared HTTP core + request-builder + auth + retry/classifier + response-parse + serialize + IPC-resolve all reached to leaf; depth ≥ 6 |
| dim4 interface/error/side-effect | **closed** (was partial) | 9-field RelayDraftTestInput DTO + __draft__ fallback + client-select + POST /v1/messages body + Anthropic auth + extraHeaders + retry + response parse + RelayTestResult DTO + 8-entry error set + **HTTP-POST-only NO-persist side-effect (callee-absence proven + source archive source agreement)**; transport bound to known ASYNC_CLIENT stack |
| dim5 platform gate | windows_independent_closed | Windows PE evidence; not inferred from macOS |
| dim6 test/acceptance mapping | closed | Vitest `args={input:draft}`; Cargo `draft_probe_paths_reject_sensitive_extra_headers`; RelayDraftTestInput shape + no-persist behavior from source archive `core/relay/mod.rs` |

**Tier**: `strictImplementationUse` (dim1-5 closed, dim6 closed; dim1 accepted_unknown blocks readyToImplement). **still_capped = false.** `implementation_use=false`, `gate_accepted=false`, `readyToImplement=false` (unchanged — readyToImplement needs same-platform frontend UI-trigger CCF closure, which is absent on Windows per platform redline; line-183/184/macOS-derived promotions must not be inferred onto Windows).

dim6 is the source archive implementation-side test/acceptance activity; it is mapped (cargo + vitest names above), not produced here.

---

## Linked evidence

| Source | Path |
|---|---|
| Prior tier matrix (capped row) | `<source-location>/audits/windows-1.0.9-relay/data/tier-matrix.json` (test_relay_draft, owner_addr 0x140913E40) |
| Prior raw leaf (B-router-test-http) | `<source-location>/raw/aimami/1.0.9/windows/relay/test_relay_draft/evidence.md` |
| Interface map | `<source-location>/audits/windows-1.0.9-relay/interfaces/relay-interface-map.md` §test_relay_draft |
| Sibling cap-fill (provider, shares HTTP core 0x140825280) | `<source-location>/audits/windows-1.0.9-relay/logic/WIN-TEST-RELAY-PROVIDER-CAPFILL-109.md` |
| Sibling cap-fill (fetch, same draft-in-arg pattern) | `<source-location>/audits/windows-1.0.9-relay/logic/WIN-FETCH-RELAY-MODELS-DRAFT-CAPFILL-109.md` |
| source archive implementation source (DTO + no-persist) | `src-tauri/src/core/relay/mod.rs` L246-260 (RelayDraftTestInput), L914-942 (test_draft) ; `src-tauri/src/commands/relay.rs` L382-386 |
| Windows binary | `<source-location>/source-binary/AiMaM 1.0.9 win64.exe` (sha a5822387fa3f) |

---

*No .c / .log / binary / dump in this document. Logic file only (AGENTS.md `logic/*.md` whitelist). Platform: windows-x64 (independent closure; doNotInferWindowsFromMacOS). dim4 closed via known transport; owner body fully recovered (not ICF); shared HTTP core 0x140825280 bound from provider cap-fill. NO-persist side-effect proven by owner callee-absence of 0x1401523E0/0x140155830 + source archive source agreement. Not readyToImplement (dim1 frontend CCF accepted_unknown). IDA comments set on owner@0x140913E40 + keychain-helper@0x140571180 + response-state-helper@0x140855070; IDB saved. Session: <audit-session> / <workstation> / 2026-06-03.*
