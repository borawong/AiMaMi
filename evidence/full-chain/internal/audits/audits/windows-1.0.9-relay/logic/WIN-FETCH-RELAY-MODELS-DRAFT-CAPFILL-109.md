# WIN-FETCH-RELAY-MODELS-DRAFT-CAPFILL-109.md
# Cap-Fill: fetch_relay_models_draft — dim4 HTTP-terminal closure via known transport
# Platform: windows-x64 | AiMaMi 1.0.9 | Session: <audit-session>

**produced_at**: 2026-06-03
**machine**: <workstation>
**session**: <audit-session>
**binary_sha256**: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
**idb**: `<source-location>/source-binary/AiMaM 1.0.9 win64.exe.i64`
**ida_server**: mcp__ida-pro-mcp-win
**prior_tier**: strictImplementationUse, dim4=**partial** (HTTP terminal accepted_unknown)
**new_tier**: strictImplementationUse, dim4=**closed**  · **still_capped=false**
**scope**: relay command layer — single leaf `fetch_relay_models_draft`

---

## Owner Matrix (PREWRITE_PRODUCER_COLLISION_GATE_V1)

| Field | Value |
|---|---|
| target | `<source-location>/audits/windows-1.0.9-relay/logic/WIN-FETCH-RELAY-MODELS-DRAFT-CAPFILL-109.md` |
| canonical scope | `aimami/1.0.9/windows/relay` — relay command layer |
| current producer | <workstation> (owner_basis=index_exact_path line 1086; bundle relay-closeout-109) |
| this session | <audit-session> / <workstation> — same machine |
| INDEX relevant | windows-1.0.9-relay bundle; no competing/foreign INDEX owner |
| allowed write mode | **ALLOW(owner)** — same-machine owner; new file in `logic/` whitelist |
| collision status | none (foreign_index_path_owners = {}) |
| takeover sensitive-field | not required |
| gate script | `prewrite-owner-gate.py` exit 0, decision=ALLOW, write_mode=owner (run twice: pre-work + pre-write) |

---

## Why it was capped, and why it now closes

**Prior cap (relay-closeout-109 / B-router-test-http)**: `fetch_relay_models_draft` reached `strictImplementationUse` but dim4 (interface/error/side-effect) was scored **partial** with 
ot_ready_reason = "HTTP terminal — server behavior not internally provable (GET /v1/models external_call_recorded)"`. The HTTP send was an opaque terminal: the transport (client selection, request build, auth injection, retry, response parse) had not been decompiled, so the body past the wrapper was treated as `accepted_unknown`.

**This cap-fill**: the transport stack was fully mapped by the ceiling-crack wf (reused here, not re-derived). With the transport known, the `fetch_relay_models_draft` **owner wrapper body** was decompiled targeted and bound to that transport. The wrapper body is a genuine recovered function (2026 instructions, #wind=60), NOT an ICF-folded thunk or drop-in-place. Every dim4 element — request construction, auth branch, retry gate, response parse, error envelope, side-effect boundary — is now decompiled. The only externally-determined fact is the remote server's response *content*, which is inherent to any HTTP client (covered by dim6 cargo fake_http_server tests). That is an accepted HTTP boundary, not an unknown owner. → **dim4 closed, still_capped=false.**

Ceiling note: tier stays **strictImplementationUse** (NOT readyToImplement) because dim1 frontend CCF is 
ot_closed_windows` (accepted_unknown product_decision per relay cluster policy), so the `full_leaf_100_definition_v2` six-dim gate is not met. dim4 was the cap; dim4 is now closed.

---

## Owner & call graph (Windows IDA, targeted)

| Symbol | VA | Role |
|---|---|---|
| `fetch_relay_models_draft_owner_sys` | **0x1408E0870** (size 0x2D3C, 2026 insn, #wind=60) | A-level Tauri async-command owner |
| `sub_1404622C0` | 0x1404622C0 | draft `input` Result/envelope unwrap (dispatches tag 4/5 → calls real DTO deser `sub_140800BE0`) |
| `sub_140800BE0` | 0x140800BE0 | **actual draft DTO map-deserializer** (RelayFetchModelsInput; references field strings baseUrl/apiKey/wireApi/extraHeaders @ 0x14129B9B0) |
| `sub_1400DA320` | 0x1400DA320 | manager IPC-state resolver (arg field `"manager"`) |
| `sub_1411CE640` | 0x1411CE640 | missing/invalid-arg error path (tag 6) |
| `relay_keychain_get_api_key_sys` | 0x140571180 | saved-provider keychain field resolver (available; **draft path uses inline apiKey instead**) |
| `relay_fetch_models_build_url_normalize_sys` | 0x140113280 | base URL normalize (trim trailing `\n`/`\r\n`) |
| `relay_fetch_models_strip_v1_suffix_sys` | 0x140113F50 | strip trailing `/v1` from base URL |
| `sub_1401AA050` | 0x1401AA050 | reqwest GET request builder (Arc-clones shared async client via `_InterlockedIncrement64`) |
| `sub_1401AAE50` | 0x1401AAE50 | header-map insert (called for x-api-field, anthropic-version) |
| `relay_fetch_models_parse_extra_headers_sys` | 0x1401134F0 | inject draft `extraHeaders` |
| `relay_fetch_models_is_transient_request_error_sys` | 0x1401133E0 | retry transient gate |
| `relay_fetch_models_parse_model_ids_sys` | 0x140113100 | parse JSON `data[].id` → model list |
| `tauri_ipc_resolve_sys` | 0x140062230 | resolve `CoreEnvelope<Vec<String>>` back to frontend |
| async future poll cluster | sub_140C31BF0 / sub_140C31B10 / sub_140C32FB0 / sub_14088A9D0 | HTTP dispatch + state transitions folded into future |

### Transport reuse (known, not re-derived)
- **Async client**: shared reqwest client via OnceLock pair (ASYNC_CLIENT_DIRECT/SYSTEM); the owner Arc-clones it at `sub_1401AA050` (`_InterlockedIncrement64`). Matches ceiling-crack mac core `respond_async_serialized_inner::{{closure}}@0x100114ab0`; win owner is ICF-inlined at this same 0x1408E0870.
- **Async wake**: `WakeByAddressSingle` (win async wake, per known transport).
- **Retry**: `is_transient_request_error` gate, transient-error loop `max_retries=2` (known transport).
- **Auth branch**: Anthropic path = `x-api-field` + `anthropic-version: 2023-06-01` (known transport). This owner takes the Anthropic path unconditionally for the draft fetch (relay speaks Anthropic protocol on the wire).

---

## Wrapper-body flow (decompiled, targeted disasm)

1. **Entry / async state** (0x1408E0870–0x1408E08BC): Tauri async-command future; switch on state byte `[ctx+0x2630]` (jpt_1408E08BC, 4 cases). First poll (case 0) memcpy's the 0x1250-byte deserialized command context into the future.
2. **manager resolve** (0x1408E0987): `sub_1400DA320(... "manager", "fetch_relay_models_draft")` → manager handle. Failure → manager error path.
3. **`input` deserialize** (0x1408E09ED–0x1408E0A29): loads arg field `"input"` (len 5), calls `sub_1404622C0` to deserialize the **draft** config. Error tag `==6` → `sub_1411CE640` (arg-parse error). This is the unsaved-draft path: it reads the inline draft fields, it does **not** resolve a saved provider by `providerId`.
4. **URL build** (0x1408E19FF–0x1408E1A67): `aUstedV1Models+5` = `/v1/models` (len 0x0A); `strip_v1_suffix` trims a trailing `/v1` on the draft `baseUrl`; `build_url_normalize` trims CRLF; `sub_1401AA050` builds a **GET** request (method descriptor `unk_14125AFF8` tag=1; URL = normalized base + `/v1/models`) on the Arc-cloned shared async client.
5. **Auth header inject (in-owner, unconditional)**:
   - 0x1408E1AA8: `x-api-field` (len 9) ← draft `apiKey`, via `sub_1401AAE50`.
   - 0x1408E1B01: `anthropic-version` (len 0x11=17) = `"2023-06-01"` (len 0x0A=10), via `sub_1401AAE50`.
6. **extraHeaders inject**: `parse_extra_headers` merges draft `extraHeaders` into the header map.
7. **Dispatch + retry**: HTTP send folded into the async future poll states (sub_140C31BF0/C31B10/C32FB0); `is_transient_request_error` gates retry (max 2); 404/405 → try next URL candidate; other non-2xx → Err; success → body.
8. **Response parse** (`parse_model_ids` 0x140113100): reads JSON `data` array (tag==4), iterates 32-byte-stride entries, builds the model-ID `Vec`. Empty array → `"upstream model list is empty"`; `data` not an array → `"upstream did not return a standard model list"`.
9. **Resolve** (`tauri_ipc_resolve_sys` 0x140062230): returns `CoreEnvelope<Vec<String>>` to the frontend.

---

## Interface / DTO

**Command**: `invoke("fetch_relay_models_draft", { input })`  (arg keys `"manager"` internal + `"input"` IDA-confirmed @ 0x14129C99A)

**Request DTO — `input: RelayFetchModelsInput`** (draft/unsaved provider config; field strings @ 0x14129B9B0 cluster + 0x14129BA3D + providerId @ 0x14129C94C; deser `sub_140800BE0` via Result-unwrap `sub_1404622C0`):
| field | type | note |
|---|---|---|
| providerId | str (optional) | which saved provider the draft is based on (field string @ 0x14129C94C in owner's DTO region); fetch still uses inline config below, not a saved-state lookup |
| baseUrl | str | relay base URL; `/v1` suffix stripped then `/v1/models` appended |
| apiKey | str | inline draft field → `x-api-field` header (NO keychain lookup on draft path) |
| wireApi | str | wire protocol selector (vitest: `"openai-chat"`); draft fetch uses Anthropic x-api-field auth on the wire regardless |
| extraHeaders | map<str,str> | merged into request headers via parse_extra_headers |
| network | RelayNetworkMode | `system`(0) / `direct`(1); selects ASYNC_CLIENT_SYSTEM vs ASYNC_CLIENT_DIRECT |

DTO matches the macOS cap-fill (`{providerId,baseUrl,apiKey,wireApi,extraHeaders,network}`, session <audit-session> macOS lane) — cross-platform Rust struct, fields agree.

**Difference vs saved-provider commands**: saved commands (e.g. test_relay_provider with `{ providerId }`) resolve the provider + field from relay state / keychain (`relay_keychain_get_api_key_sys`). `fetch_relay_models_draft` takes the full inline draft config in `input` and uses it directly — no relay-state lookup, no providerId.

**Response**: `CoreEnvelope<Vec<String>>` — `data` = sorted list of model IDs from upstream `data[].id`. (Upstream-inference `Vec<ModelInfo>` collapses to `Vec<String>` of ids in source archive.)

**Auth**: `x-api-field: <apiKey>` + `anthropic-version: 2023-06-01` (in-owner, unconditional for draft). HTTP: `GET {normalized_base}/v1/models`.

---

## Error set (all IDA-string-confirmed)

| error | trigger | source |
|---|---|---|
| `upstream model list is empty` | HTTP 2xx but `data[]` empty | parse_model_ids 0x140113100 |
| `upstream did not return a standard model list` | `data` field absent / not an array | parse_model_ids 0x140113100 |
| transient request error (retried, max 2) | err msg contains `request failed` / `timed out` / `timeout` / `connection` | is_transient_request_error 0x1401133E0 |
| input parse failure | `input` arg deser fails (tag 6) | sub_1411CE640 |
| manager resolve failure | manager IPC-state unavailable | sub_1400DA320 path |
| HTTP non-2xx (not 404/405) | upstream returns other status | candidate loop (known transport: 404/405 continue, else Err) |
| all URL candidates exhausted | every candidate failed | known transport `"All candidates failed"` |

---

## Side-effect boundary

- **HTTP GET only.** No state write. The owner does **not** call `relay_atomic_write_file_sys`, `relay_manager_reset_codex_config_impl_sys`, any config.toml writer, or relay.json persistence (callee list @ 0x1408E0870 confirms absence — contrast test_relay_provider which writes a health metric via sub_1401523E0).
- Read-only against relay/codex config; the draft config never touches persisted relay state.
- Arc refcount bump on the shared async client (`_InterlockedIncrement64`) is a clone, not a mutation of business state.

---

## dim matrix (post-cap-fill)

| dim | status | basis |
|---|---|---|
| dim1 frontend CCF | accepted_unknown (not_closed_windows, product_decision) | per relay cluster policy; non-blocking, but blocks readyToImplement |
| dim2 backend owner/pseudocode | **closed** | fetch_relay_models_draft_owner_sys @ 0x1408E0870 full body decompiled |
| dim3 call-tree to leaf | **closed** | URL/auth/retry/parse helpers + async dispatch all reached to leaf |
| dim4 interface/error/side-effect | **closed** (was partial) | request build + auth + extraHeaders + retry + data[].id parse + error set + no-side-effect all decompiled; transport bound to known stack |
| dim5 platform gate | windows_independent_closed | Windows PE evidence; not inferred from macOS |
| dim6 test/acceptance mapping | closed | Vitest `args={input:fetchInput}`; Cargo fetch_models_uses_v1_models_on_fake_endpoint / fetch_models_uses_source archive_user_agent / fetch_models_errors_for_empty_fake_endpoint_list / draft_probe_paths_reject_sensitive_extra_headers (strongest HTTP cargo coverage of the 3 HTTP commands) |

**Tier**: `strictImplementationUse` (dim1-5 closed, dim6 closed; dim1 accepted_unknown blocks readyToImplement). **still_capped = false.** `implementation_use=false`, `gate_accepted=false`, `readyToImplement=false` (unchanged — readyToImplement needs frontend CCF closure).

dim6 is the source archive implementation-side test/acceptance activity; it is mapped (cargo + vitest names above), not produced here.

---

## Linked evidence

| Source | Path |
|---|---|
| Prior tier matrix (capped row) | `<source-location>/audits/windows-1.0.9-relay/data/tier-matrix.json` (fetch_relay_models_draft) |
| Interface map | `<source-location>/audits/windows-1.0.9-relay/interfaces/relay-interface-map.md` §fetch_relay_models_draft |
| cc-switch substitute (prior, consumerStartReady ceiling) | `<source-location>/audits/windows-1.0.9-relay/logic/RELAY-HTTP-TERMINAL-CCSWITCH-SUBSTITUTE-109.md` §3 |
| Windows binary | `<source-location>/source-binary/AiMaM 1.0.9 win64.exe` (sha a5822387fa3f) |

---

*No .c / .log / binary / dump in this document. Logic file only (AGENTS.md `logic/*.md` whitelist). Platform: windows-x64 (independent closure; doNotInferWindowsFromMacOS). dim4 closed via known transport; wrapper body fully recovered. Not readyToImplement (dim1 frontend CCF accepted_unknown). IDA comment set on owner; IDB saved. Session: <audit-session> / <workstation> / 2026-06-03.*
