# relay_health_audit / apply_extra_headers_candidate_sys — raw leaf evidence

product: aimami
version: 1.0.9
platform: windows-x64
binary_sha256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
binary_sha256_12: a5822387fa3f
idb: <local-path> 1.0.9 win64.exe.i64
session: win-health-audit-20260602
produced: 2026-06-02
deep_phase_status: COMPLETE — IDA MCP decompiled, xrefs confirmed, renamed, commented, idb_saved
gate: consumerStartReady=true, strictImplementationUse=false, readyToImplement=false

## RECLASSIFICATION (from blocked to confirmed with scope correction)

These three VA candidates are NOT part of the health_check orchestrator path directly.
The health_check orchestrator uses `build_test_request_anthropic_sys` (0x140118030) for header injection.
apply_extra_headers is in the LIVE RELAY PROXY path (forwarding requests from Codex IDE to providers).

## Confirmed (B-level — from decompile + xrefs_to)

### apply_extra_headers_openai_sys (0x14010EFC0) — IDA renamed
- VA: 0x14010EFC0, size 0x8A2 (2210 bytes)
- Callers (code): sub_14056E570 (relay request processor, size 0x1698), sub_1407D1880 (relay forwarder, size 0x466)
- NOT called from health_check orchestrator (0x140825280)
- Calls: build_openai_headers_authorization_sys(0x1401AD5A0) + sub_1401AD970 + sub_1401AD290
- Also calls sub_14010E3B0 (request pre-processor), sub_140380FB0 (request reset)
- Rate-limit detection: sub_140FF5620("rate_limit") in error response body; sub_140099C60 (retry-after parser)
- 2 vtable data xrefs: 0x141536098, 0x141896CE4

### apply_extra_headers_variant_b_sys (0x14010FF80) — IDA renamed
- VA: 0x14010FF80, size 0x77B (1915 bytes)
- Callers (code): sub_140008A70, sub_140110A80, sub_14056B7F0, sub_14056E570
- ICF near-duplicate of apply_extra_headers_openai_sys
- Also calls build_openai_headers_authorization_sys(0x1401AD5A0)
- 2 vtable data xrefs: 0x141536314, 0x141896D5C
- Decompile deferred (lower priority — structurally similar to A)

### build_headers_get_path_sys (0x1401175C0) — IDA renamed
- VA: 0x1401175C0, size 0x6FB (1787 bytes)
- Sole code caller: sub_140828DB0 (reqwest send wrapper) at xref 0x140828E54
- Called as CALLEE of the reqwest send wrapper — not directly from health_check
- Confirms this is a header injection step inside the reqwest send path, not a top-level apply_extra_headers

## Inferred

- The apply_extra_headers family handles runtime relay proxy forwarding, not health-check probes
- Health-check probe header injection uses build_test_request_anthropic_sys (separate, simpler path)
- apply_extra_headers is invoked when Codex IDE sends a real AI API request through the relay proxy

## Unknown (residual)

- apply_extra_headers_variant_b_sys full pseudocode (deferred — structurally similar to A)
- Exact condition distinguishing when A vs B variant is selected (likely provider wire_api type or request type)
- test/acceptance mapping (dim6)

## IDA session record

- decompile: apply_extra_headers_openai_sys OK; variant_b deferred
- xrefs_to confirmed for all 3 VAs (no IDA outage this time)
- rename: sub_14010EFC0 → apply_extra_headers_openai_sys; sub_14010FF80 → apply_extra_headers_variant_b_sys; sub_1401175C0 → build_headers_get_path_sys
- set_comments: apply_extra_headers_openai_sys and build_headers_get_path_sys
- idb_save: OK
