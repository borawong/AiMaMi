# relay_health_audit — Windows x64 Reduce Evidence
# session: relay-closeout-109 | machine: <workstation> | produced: 2026-06-03
# binary_sha12: a5822387fa3f | gate: strictImplementationUse (dim1-5 closed; dim6 missing)

## Cluster Overview

11 leaves covering two independent sub-clusters:

**Sub-cluster A: health_check / health probe (6 leaves)**
- health_check_test_provider_async_core_sys (0x140825280) — orchestrator
- build_test_request_anthropic_sys (0x140118030) — Anthropic header builder
- health_check_response_parser_sys (0x140118B90) — HTTP response parser NEW
- interpret_response_async_core_sys (0x140827E40) — async response state machine
- build_test_request_shared_sys (0x140122640) — DEFERRED (not in health_check path)
- apply_extra_headers_openai_sys (0x14010EFC0) + variant_b + get_path — LIVE RELAY PROXY path (not health_check direct)

**Sub-cluster B: passthrough_audit (5 leaves)**
- get_passthrough_audit_log_owner_sys (0x14026E440) — IPC owner
- passthrough_audit_log_read_sys (0x14043FC40)
- passthrough_audit_log_filter_sys (0x14042E190)
- append_entry_write_core_sys (0x1408442C0)
- record_passthrough_dispatcher_sys (0x14095B500)
- passthrough_audit_jsonl_append_sys (0x14042D9E0) — JSONL writer NEW
- passthrough_audit_entry_serializer_sys (0x14042E340) — JSON serializer (7 fields confirmed) NEW

## Health Check Call Tree (depth ≥ 9)

```
health_check_test_provider_async_core_sys (0x140825280)
  ├─ build_test_request_anthropic_sys (0x140118030)        [header builder: x-api-field, anthropic-version, Content-Type]
  │    └─ sub_1401163E0                                    [injects extraHeaders from provider config]
  ├─ sub_1401AA050                                         [reqwest client build]
  ├─ sub_1401AA870                                         [reqwest request build]
  ├─ sub_140C31B10                                         [request finalize]
  ├─ sub_140828DB0                                         [reqwest send — retry loop]
  │    └─ build_headers_get_path_sys (0x1401175C0)         [GET path headers — called in send wrapper]
  ├─ sub_140C32FB0                                         [response status read]
  ├─ sub_14088D5D0                                         [should_retry predicate]
  ├─ relay_health_retry_after_classifier_sys (0x140118EB0) [result classifier / retry-after reader]
  └─ interpret_response_async_core_sys (0x140827E40)       [async state machine]
       └─ health_check_response_parser_sys (0x140118B90)   [HTTP status+body parser]
            └─ sub_1401140E0 (0x1401140E0)                 [SSE data extractor / "healthScore" field reader]
                 └─ sub_140118680 (0x140118680)            [JSON error message extractor]
```

Terminal leaves: reqwest client/request (OS TLS), healthScore JSON field parser, retry classifier

## Passthrough Audit Call Chain

```
get_passthrough_audit_log_owner_sys (0x14026E440)           [IPC: "get_passthrough_audit_log"]
  ├─ sub_140460EC0                                           [IPC param extraction: "limit" (5 chars)]
  └─ passthrough_audit_log_read_sys (0x14043FC40)            [default limit=50]
       ├─ codex_paths_build_from_env_sys (0x140476200)
       ├─ codex_paths_join_all_subpaths (0x140476350)
       └─ passthrough_audit_log_filter_sys (0x14042E190)     [reads JSONL + applies limit (tail slice)]
            ├─ sub_141035180                                  [builds path: "passthrough-audit.jsonl" 23 chars]
            └─ sub_14104DEE0                                  [file read → Vec<PassthroughAuditEntry>]

record_passthrough_dispatcher_sys (0x14095B500)              [async poll wrapper dispatch]
  └─ append_entry_write_core_sys (0x1408442C0)               [orchestrates write]
       ├─ sub_141035180                                       [path builder: codex_paths/"passthrough-audit.jsonl"]
       └─ passthrough_audit_jsonl_append_sys (0x14042D9E0)   [JSONL append implementation]
            └─ passthrough_audit_entry_serializer_sys (0x14042E340) [JSON serializer: 7 fields]
```

Write side-effect: fire-and-forget; error logged via sub_140177DE0 but NOT propagated.

## DTO Closures

### RelayTestResult (health probe result)
- healthScore: i64/f64 stored at provider struct offset +200
- Sentinel 0x8000000000000000 = empty body / unresolvable async response
- Successful result: OK path from health_check_response_parser_sys → sub_1401140E0 extracts "healthScore" JSON field
- Error result: Err string from response body or "all retries exhausted" / "no valid responses endpoint found"
- Retry max: *(a2+108) in async frame (inferred ~3 from state machine structure)
- Wire API selector: *(v14+205) byte → 0 = client A (Anthropic path) / else = client B (OpenAI path)

### PassthroughAuditEntry — 7 CONFIRMED FIELDS
Confirmed via passthrough_audit_entry_serializer_sys (0x14042E340) IDA decompile:

| # | JSON field      | struct offset | type                   | confirmed |
|---|---------------|---------------|------------------------|-----------|
| 1 | "at"          | +8/+16        | String (ptr/len)       | A-level   |
| 2 | "model"       | +32/+40       | String (ptr/len)       | A-level   |
| 3 | "endpoint"    | +56/+64       | String (ptr/len)       | A-level   |
| 4 | "body_bytes"  | +120          | u32/u64 integer        | A-level   |
| 5 | "input_types" | +72           | Vec<_>                 | A-level   |
| 6 | "status"      | +128 (flag u16) / +130 (code u16) | Option<u16> | A-level |
| 7 | "rewritten_to"| +96           | Option<String> (len at +96, ptr at +104) | A-level |

Entry struct total size: 96 bytes (confirmed from cleanup loop in get_passthrough_audit_log_owner_sys: 96*v33)
Drop/cleanup layout (sub_140182650): frees String at a1[0..1], a1[3..4], a1[6..7]; Vec at a1[10..11]; Option<String> at a1[12..13]

JSON format: `{"at":"..","model":"..","endpoint":"..","body_bytes":N,"input_types":[..],"status":N,"rewritten_to":".."}`

### IPC Interface: get_passthrough_audit_log
- Command string: "get_passthrough_audit_log" (25 chars) confirmed at 0x1412690FA
- Parameters: `{ limit?: number }` (optional integer; default 50 if absent)
- Response: `{ ok: "ok", entries: PassthroughAuditEntry[] }` (up to limit, most recent first)
- Dispatcher: auto_switch_multiplex_dispatcher_sys (0x1402663E0)
- Response envelope keys: "ok" (2B at a1+8/16), "entries" (7B at a1+32/40) confirmed from decompile

## Build Request Headers (health probe — Anthropic path)
- Content-Type: application/json (constant)
- x-api-field: <provider.api_key> (from provider config offset a2[10]=ptr, a2[11]=len)
  - Validation: rejects byte < 0x20 (except TAB=9) or == 0x7F; silently skips header on invalid field
- anthropic-version: 2023-06-01
- streaming flag (a3 != 0):
  - Accept: text/event-stream
  - Accept-Encoding: identity
- extraHeaders: injected via sub_1401163E0 from provider config

## Error Paths Confirmed
- "all retries exhausted" (21 bytes) — emitted when retry count >= max (*(a2+108))
- "no valid responses endpoint found" (33 bytes) — emitted when provider endpoint list empty
- "no response data received" (25 bytes) — emitted from interpret_response_async when body empty after poll
- sub_140177DE0 = error logger (passthrough audit write failure; fire-and-forget)
- JSONL append: write errors NOT propagated; logged only

## Scope Notes
- build_test_request_shared_sys (0x140122640): 9 callers across relay stack; NOT in health_check direct path; deferred
- apply_extra_headers family (0x14010EFC0, 0x14010FF80): LIVE RELAY PROXY path, NOT health-check probe path
- build_openai_headers_authorization_sys (0x1401AD5A0): used by apply_extra_headers (proxy path)
  - Authorization: Bearer <api_key>; error codes 4 (dup header) and 5 (sensitive-field resolution failure)
- provider_entry_serializer_sys (0x140433EC0): serializes full provider JSON with 14 fields including healthScore

## Gate Dimensions
- dim1 (frontend CCF): product_decision — Windows CCF not independently analyzed; macOS evidence confirms UI trigger; consistent with all other windows-1.0.9-relay-core clusters
- dim2 (backend owner/pseudocode): CLOSED — 11 leaves: 9 fully decompiled; 2 deferred per scope (build_test_request_shared, apply_extra_headers_variant_b as ICF near-dup)
- dim3 (call-tree ≥5 to implementation leaves): CLOSED — health_check orchestrator: 9+ edges; passthrough chain: 5+ edges each
- dim4 (interface/DTO/error/side-effect): CLOSED — PassthroughAuditEntry 7 fields confirmed; RelayTestResult sentinel+healthScore; error strings confirmed; side-effects documented
- dim5 (same-platform gate): CLOSED — all evidence Windows-only, independent
- dim6 (test/acceptance mapping): missing

gate: strictImplementationUse (dim1-5 closed; dim6=missing)
consumerStartReady: true
strictImplementationUse: true
readyToImplement: false
gate_accepted: false
implementation_use: false
