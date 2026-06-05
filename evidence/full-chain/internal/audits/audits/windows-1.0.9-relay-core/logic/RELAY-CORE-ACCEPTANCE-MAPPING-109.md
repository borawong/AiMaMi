# relay-core Acceptance Mapping — AiMaMi 1.0.9
# Session: relay-closeout-109 (reasserted from aborted highest-gate-109) | Machine: <workstation> | Date: 2026-06-03
# Scope: cross-platform (macOS arm64 + Windows x64)

> **Purpose**: dim6 test/acceptance mapping for every relay-core leaf, cross-referenced
> to the source archive implementation that must be verified. Reads behavior conclusions from gate-reports
> and logic files only — no new IDA work here. Outputs per-cluster dim6 status and a verdict
> on whether dim1-5 + dim6 now jointly permit `readyToImplement`.
>
> **Coverage**: 14 macOS clusters + 12 Windows clusters (26 total; some shared cross-platform).
> **Reference bundles**: audits/macos-1.0.9-relay-core/ + audits/windows-1.0.9-relay-core/
> **Binary SHAs**: mac=1db044e8efab / win=a5822387fa3f

---

## Acceptance Mapping Schema

Each leaf entry follows:

```
### <cluster_name> — <platform(s)>
dim6_basis: <what evidence grounds the acceptance>
leaves:
  - <leaf_name>: <acceptance condition> [unit|e2e|manual|not-automatable]
dim6_status: closed | partial | pending-deep
readyToImplement_verdict: YES | NO — <reason>
```

---

## 1. relay_translator_stream — macOS (strictImplementationUse)

**dim1–5 status (from gate-report)**: dim1=product_decision (internal, no Tauri command), dim2=closed (4 state machines fully decompiled), dim3=closed (call-tree depth≥5), dim4=closed (ToolItemState struct, DTO, error, side-effect all documented), dim5=macOS confirmed / Windows not-started.

**dim6_basis**: 4 stream converter state machines decompiled with 15.3KB–16.3KB pseudocode each; ToolItemState 4-field struct confirmed; SSE event type dispatch fully traced; no persistent side effects (in-memory only).

**leaves**:
- `ChatToResponsesStream::handle_chunk`: Unit test — feed synthetic chat completion SSE events; assert mapped responses-API delta events with correct `type`, `delta`, `index`. [unit]
- `ChatToResponsesStream::close_reasoning_block`: Unit test — trigger reasoning close; assert final event emitted. [unit]
- `AnthropicDirectToResponsesStream::handle_event`: Unit test — feed Anthropic SSE `content_block_delta` / `message_delta`; assert responses-API stream equivalents emitted. [unit]
- `AnthropicDirectToResponsesStream::close_thinking_block`: Unit test — assert thinking block closed correctly. [unit]
- `OpenAiToAnthropicStream::handle_chunk`: Unit test — feed OpenAI chat delta; assert Anthropic `content_block_delta` output. [unit]
- `AnthropicToOpenAiStream::handle_event`: Unit test — feed Anthropic SSE; assert OpenAI chat delta emitted. [unit]
- `AnthropicToOpenAiStream::role_chunk / ensure_role / flush / feed_line / final_chunk`: Unit tests per method — role injection, buffer flush, final chunk emission. [unit × 5]
- `ToolItemState` struct layout (4 Option<String> fields): Unit test — instantiate, set each field, assert correct field assignment via serialization round-trip. [unit]
- Additional support fns (close_text_block, close_tool_blocks, emit_completed, feed_line × 2): Unit tests — trigger each close/emit path; assert correct SSE event emitted. [unit × 6]
- Windows platform: **not-automatable until Windows gate opened** — mark pending-deep for Windows.

**dim6_status**: closed (macOS); pending-deep (Windows not-started)

**readyToImplement_verdict**: NO — dim5 Windows not-started. macOS dim1-6 all closed → macOS-only `readyToImplement` would be valid if scope explicitly limited to macOS. Per cross-platform policy, mark `strictImplementationUse` until Windows dim5 closed or product_decision accepted.

---

## 2. relay_web_executor — macOS + Windows (strictImplementationUse both)

**dim1–5 status**: dim1=product_decision (internal), dim2=closed (7 mac Tier-A / 9 win: 7 decompiled + 2 named + 1 accepted_unknown), dim3=closed (call-tree: proxy_server→execute_with_web_tools→execute_proxy_tools→fetch_raw_text→reqwest terminal), dim4=closed (tool_calls/choices/summary_text/tool_call_id/call_id; in-memory side effects only), dim5=macOS confirmed + Windows independent confirmed.

**dim6_basis**: Full call chain to terminal `reqwest::Client` / Windows ICF-folded async (accepted_unknown). DTO fully closed. No persistent writes. Accepted unknown: send_request HTTP terminal (async ICF).

**leaves** (both platforms unless noted):
- `execute_with_web_tools::closure` (mac 0x1000a2098 / win 0x1401DFC70): E2E test — invoke relay proxy with a message containing web_search tool call; assert tool results accumulated and passthrough JSON assembled. [e2e]
- `execute_proxy_tools::closure` (mac 0x10009efb0 / win implicit in dispatch): Unit test — mock HTTP; assert search_yahoo routed and result assembled. [unit]
- `build_passthrough_response` (mac 0x10067331c / win 0x1401F9D60): Unit test — supply tool_calls + choices + summary_text; assert JSON output matches DTO schema. [unit]
- `append_assistant_and_tool_results` (mac 0x1006734cc / win 0x1402395C0): Unit test — append assistant message + tool_result messages; assert conversation history correct. [unit]
- `fetch_raw_text::closure` (mac 0x10009eedc / win 0x1401DFC70 chain): Unit test with mock HTTP — assert raw text returned, truncation respected. [unit]
- `RequestBuilder::send` / HTTP terminal (accepted_unknown ICF on Windows): Not-automatable for unit testing the terminal itself — verify via integration test that HTTP request is dispatched with correct headers. [manual-integration]
- Cross-platform DTO parity: Integration test — run both macOS + Windows relay proxy with web_search; assert identical JSON response structure. [e2e]
- `web_dispatch_loop_owner_sys` (win 0x140840650): E2E — exercise full dispatch loop with >1 tool calls; assert all dispatched and aggregated. [e2e]

**dim6_status**: closed (macOS + Windows)

**readyToImplement_verdict**: NO — dim6 is now closed for both platforms, but the gate-report lists `readyToImplement=false` pending dim6. With dim6 now mapped: **macOS dim1-6 all closed → macOS readyToImplement eligible**. **Windows dim1-6 all closed → Windows readyToImplement eligible**. Both can be promoted upon this mapping being written. **Upgradeable to readyToImplement for both platforms** (dim1=product_decision is an accepted substitute per GATE-SPEC).

---

## 3. relay_web_tools — macOS + Windows (strictImplementationUse both)

**dim1–5 status**: dim1=product_decision, dim2=closed (mac 12 leaves all Tier-A/B; win 16 leaves all decompiled), dim3=closed (fetch pipeline + search pipeline + inject guard closed), dim4=closed (truncate=8000, tool schemas, SSE headers, inject prompt, skip_tags, UA, search backends all confirmed), dim5=macOS + Windows independent confirmed.

**dim6_basis**: All behavioral constants confirmed independently on both platforms. Accepted unknowns: format_results/extract_ddg_url inlined (not locatable as standalone), SearchResult struct layout (name known, layout not independently confirmed). These accepted unknowns do not block implementation.

**leaves** (both platforms):
- `fetch::extract_text_from_html` / `collect_text_from_element`: Unit test — supply HTML with nav/style/script tags; assert those tags skipped, body text extracted. [unit]
- `fetch::truncate` (mac: Unicode-safe 8000 chars; win: 8000 bytes byte count): Unit test — supply string >8000 boundary; assert truncation at correct boundary without panic. Assert macOS cuts at char boundary, Windows at byte boundary. [unit × 2 platform-divergent]
- `fetch::try_convert_github_to_raw` / `is_github_raw_url` / `is_raw_text_url`: Unit test — supply github.com URL; assert conversion to raw.githubusercontent.com. [unit]
- `fetch::fetch_raw_text::closure` (full pipeline): Integration test — mock HTTP GET; assert URL→GET→extract→truncate chain. [unit-integration]
- `definitions::web_fetch_tool` / `web_search_tool`: Unit test — call builder; assert JSON schema matches `{type:"web_search_20250305", name:"web_search", max_uses:5}` and web_fetch shape. [unit]
- `definitions::inject_tool_definitions`: Unit test — supply serde_json::Value with discriminant==5 (Object); assert tools injected. Supply discriminant!=5; assert no injection. [unit]
- `inject prompt` literal (`"You have a web_search tool available."` 37B + cache_control:ephemeral): Manual acceptance — verify system prompt in relay proxy output contains exact string. [manual]
- SSE headers (`text/event-stream`, 
o-cache`, `X-Accel-Buffering:no`): Integration test — assert response headers. [integration]
- User-Agent hardcoded `"MacOS Chrome/125"`: Unit test — inspect built HTTP request UA header. [unit]
- `search_yahoo` (embedded in execute_proxy_tools): Integration test with mock Yahoo endpoint; assert search query formatted and result parsed. [integration]
- `format_results` / `extract_ddg_url` (accepted_unknown inlined): Not-automatable as standalone — verify via integration test that DuckDuckGo search returns parsed URLs. [manual-integration]
- Two-cluster mirror (win: cluster1 stream_path / cluster2 forward_path): E2E — exercise both paths; assert identical tool schemas injected. [e2e]
- `github_raw_url_convert` shared function (win 0x140157230): Unit test — same as mac. [unit]
- Cross-platform truncate divergence: Integration test — verify macOS implementation uses Unicode char boundary, Windows uses byte count; both produce ≤8000 unit output. [integration]

**dim6_status**: closed (macOS + Windows)

**readyToImplement_verdict**: **Upgradeable to readyToImplement for both platforms**. dim1-6 all closed; accepted unknowns (format_results/extract_ddg_url/SearchResult layout) are not blocking implementation. Windows independent.

---

## 4. relay_models — macOS (consumerStartReady) + Windows (strictImplementationUse)

**dim1–5 status**:
- macOS: dim1=product_decision, dim2=partial (3 logic fns + 12 struct shapes; RelayTestResult level-D only), dim3=partial (RelayActiveByIde::add depth=5 ok; struct deser fns are leaf-terminal), dim4=partially confirmed (struct shapes, corrections applied; RelayTestResult fields Unknown), dim5=macOS confirmed.
- Windows: dim2=closed (all 6 leaves decompiled), dim3=closed, dim4=closed (RelayProxyStatus 5 fields, RelayProvider 15 fields confirmed), dim5=Windows independent confirmed.

**dim6_basis**: Struct layout corrections (RelayProxyStatus=struct not enum, RelayProvider=15 fields, RelayIde=1 variant) confirmed independently on Windows. macOS provides logic function behavior. RelayTestResult fields remain Unknown on macOS (level-D only).

**leaves** (macOS + Windows combined):
- `error_hint` / `relay_models_error_hint_sys`: Unit test — supply known error strings; assert user-facing hint strings returned. [unit]
- `sanitize_error_for_display`: Unit test — supply error string with mock API field; assert field redacted in output. [unit]
- `RelayActiveByIde::add` / `relay_models_relay_active_by_ide_add_sys`: Unit test — add IDE entry; assert Vec appended (stride=24 bytes mac; win calls persist_commit/reset_codex_config/ensure_proxy_started). [unit]
- `RelayProvider` struct deserialization (15 fields, mac 208 bytes): Unit test — deserialize JSON with all 15 fields; assert all fields populated. [unit]
- `RelayProxyStatus` deserialization (struct, 5 fields: running/port/baseUrl/codexBaseUrl/lastError): Unit test — deserialize; assert struct variant, assert 5 fields. **Important**: verify it is NOT treated as an enum. [unit]
- `RelayIde` enum — 1 variant (`codex`) only: Unit test — deserialize `{"ide":"codex"}`; assert only `codex` variant accepted; assert unknown variant returns error or fallback. [unit]
- `RelayTestResult` (level-D, unknown fields): Manual acceptance — implement as opaque struct with at minimum `success: bool` and optional `error: Option<String>`; verify deserialization does not panic on unknown fields. [manual + not-automatable for field coverage]
- `CodexRouteDiagnostic` (6 Option<String> fields): Unit test — deserialize; assert 6 optional fields. [unit]
- `RelayUpsertInput` (9 serde string elements): Unit test — round-trip serialize/deserialize. [unit]
- `RelayFetchModelsInput` (6 fields): Unit test — serialize with all 6 fields; assert field names match upstream. [unit]
- Cross-platform struct parity: Integration test — assert RelayProvider deserialized from real relay config has 15 fields; assert RelayProxyStatus serialized from relay state has running/port/baseUrl/codexBaseUrl/lastError. [integration]

**dim6_status**: closed (macOS + Windows combined; RelayTestResult is not-automatable but documented)

**readyToImplement_verdict**:
- macOS: NO — dim2 partial (RelayTestResult Unknown blocks strictImplementationUse). macOS remains consumerStartReady.
- Windows: **Upgradeable to readyToImplement**. dim1-6 all closed (dim1=product_decision accepted). Windows independent.

---

## 5. relay_breaker — macOS (consumerStartReady) + Windows (strictImplementationUse)

**dim1–5 status**:
- macOS: dim1=product_decision (internal), dim2=closed (5/5 leaves decompiled), dim3=closed (call sites: relay_manager→new_store, relay_proxy_server→select_candidates/record_success/record_failure), dim4=closed (BreakerStore/BreakerState layouts, backoff ladder 5s/30s/300s), dim5=macOS confirmed / Windows not fully started at macOS gate time.
- Windows: dim2=closed (11 functions; 3 .c files + 8 manifest), dim3=closed (candidate selection, partition, sort pipeline fully traced), dim4=closed (BreakerState stride=208, open_until_ms_offset=144, active_flag_offset=204, backoff ladder confirmed, sentinel 0x8000000000000000), dim5=Windows independent confirmed.

**dim6_basis**: Backoff ladder confirmed independently on both platforms (5s/30s/300s). BreakerState struct independently verified on Windows (stride=208 differs from macOS stride=40 — layout differs, behavior identical). new_store blocked on Windows (no VA anchor). Accepted unknown: new_store Windows (likely inside relay_manager bootstrap).

**leaves** (both platforms):
- `select_candidates` / `relay_breaker_pick_candidates_for_sys`: Unit test — populate store with entries including one with retry_after > now; assert that entry excluded from candidates list. [unit]
- `is_open` / `relay_breaker_is_open_sys`: Unit test — entry with failure_count<1 → assert open=true; entry with retry_after>now → assert open=false (breaker closed). [unit]
- `record_success` / `relay_breaker_record_result_sys` (status=200): Unit test — insert failure state; call record_success; assert failure_count=0 and retry_after=0. [unit]
- `record_failure` / `relay_breaker_record_failure_sys`: Unit test ×3 — call once → retry_after=now+5s; call twice → now+30s; call 3+ → now+300s. Assert backoff ladder exact. [unit]
- 
ew_store` (mac confirmed VA 0x1001597bc): Unit test — call new_store; assert empty HashMap returned. [unit]
- 
ew_store` (Windows, blocked): Not-automatable — verify via integration test that relay_manager initializes breaker store at startup (relay_manager_new calls it). [manual-integration]
- `relay_breaker_partition_eligible_sys` + `relay_breaker_partition_sort_candidates_sys`: Unit test — supply mixed eligible/ineligible providers; assert correct partition. [unit]
- `relay_breaker_sort_by_timestamp_sys` + `relay_breaker_collect_sorted_list_sys`: Unit test — assert available providers sorted before open-breaker providers. [unit]
- `relay_breaker_reorder_provider_front_sys`: Unit test — supply provider list; call reorder for specific provider; assert it moves to front. [unit]
- `relay_breaker_hashmap_upsert_sys` (SIMD SwissTable, Windows): Unit test — insert new field; assert retrieval returns inserted value. [unit]
- Platform-divergent struct layout (mac stride=40 vs win stride=208): Not-automatable from outside — document as internal representation detail; source archive implementation uses Rust HashMap/stdlib and does not replicate stride manually. [not-automatable]
- BreakerState sentinel (Windows 0x8000000000000000 = not-found): Unit test — query non-existent provider; assert None / open=true returned (not panic). [unit]

**dim6_status**: closed (macOS + Windows; new_store Windows is documented not-automatable)

**readyToImplement_verdict**:
- macOS: **Upgradeable to readyToImplement**. dim1-6 all closed (dim1=product_decision accepted; macOS dims 2-4 all confirmed; dim5=macOS confirmed; dim6=now closed).
- Windows: NO — new_store VA not found (dim2 partial for that one leaf). All other 10 Windows leaves: readyToImplement eligible. **Windows readyToImplement eligible for 10/11 leaves; new_store=pending-deep**.

---

## 6. relay_fetch_models — macOS (gap_needs_reducer) + Windows (strictImplementationUse)

**dim1–5 status**:
- macOS: dim2=partial (5/7 leaves; 2 async blocked — fetch_async/fetch_openai_async VAs resolve to drop_in_place, not async poll bodies; IDA MCP offline), dim3=partial (5 leaves ok; async terminal not traced), dim5=macOS confirmed.
- Windows: dim2=closed_10_of_12 (fetch_async/fetch_openai_async accepted_unknown ICF), dim3=closed, dim4=partial (async terminals ICF-blocked), dim5=Windows independent confirmed.

**dim6_basis**: 5 macOS + 10 Windows utility leaves fully decompiled. Async terminal behavior: accepted_unknown (ICF-merged) on Windows; blocked on macOS (IDA MCP timeout). HTTP terminal behavior inferred from reqwest chain.

**leaves** (both platforms; macOS utility leaves fully mapped, async leaves pending):
- `parse_model_ids` / `relay_fetch_models_parse_model_ids`: Unit test — supply JSON array of model ID strings; assert Vec<String> returned correctly. [unit]
- `sanitize_api_key`: Unit test — supply API field string; assert last N chars replaced with `***` or similar redaction. [unit]
- `is_transient_error` / `relay_fetch_models_is_transient_request_error`: Unit test — HTTP 429 → assert transient=true; HTTP 400 → assert transient=false; HTTP 503 → assert transient=true. [unit]
- `parse_extra_headers` / `relay_fetch_models_parse_extra_headers`: Unit test — supply `"K1:V1\nK2:V2"`; assert Vec<(String,String)> with 2 entries. [unit]
- `build_url` / `relay_fetch_models_build_url_normalize`: Unit test — supply base URL with/without trailing slash + path; assert normalized URL. [unit]
- `relay_fetch_models_strip_v1_suffix`: Unit test — supply URL ending in `/v1`; assert suffix stripped. [unit]
- `apply_extra_headers_openai` / `relay_fetch_models_apply_extra_headers_openai`: Unit test — supply request builder + extra headers; assert headers applied. [unit]
- `build_openai_headers_authorization` / `relay_fetch_models_build_openai_headers_authorization`: Unit test — supply API field; assert `Authorization: Bearer <field>` header constructed. [unit]
- `classify_error` / `relay_fetch_models_classify_error` (= relay_models error_hint): Unit test — supply known error patterns; assert correct user-facing hint returned. [unit]
- `keychain_get_api_key` / `relay_fetch_models_keychain_get_api_key`: Integration test — store test API field in macOS Keychain / Windows CredentialManager; call fn; assert field retrieved. [integration, platform-divergent]
- `fetch_async` (macOS): **pending-deep** — async poll body VA not found; IDA MCP offline. Cannot write unit test without knowing state machine transitions. Mark blocked_unknown. [not-automatable until IDA reconnect]
- `fetch_openai_async` (macOS): Same as above. [pending-deep]
- `fetch_async` / `fetch_openai_async` (Windows, accepted_unknown ICF): Manual acceptance — verify via integration test that relay model fetch populates RelayProvider.modelsSample from API response. Terminal HTTP transport behavior accepted as ICF-unknown. [manual-integration]
- Cross-platform keychain divergence (macOS Keychain vs Windows CredentialManager): Manual acceptance — document platform-divergent implementation; test separately on each platform. [manual]

**dim6_status**: partial — 10 utility leaves closed; fetch_async/fetch_openai_async macOS = pending-deep

**readyToImplement_verdict**:
- macOS: NO — gap_needs_reducer; fetch_async/fetch_openai_async blocked.
- Windows: NO for full_leaf_100 (2 async leaves accepted_unknown). However: for the 10 non-async leaves → **Upgradeable to readyToImplement** individually. Async leaves remain `accepted_unknown / strictImplementationUse` — implement as tokio async HTTP fetch without needing to replicate exact poll body.

---

## 7. relay_codex_writer — macOS (consumerStartReady) + Windows (strictImplementationUse)

**dim1–5 status**:
- macOS: dim1=accepted_unknown (internal module, no Tauri command, product_decision), dim2=closed (24 functions all decompiled), dim3=closed (apply_codex_state depth≥5: fs::read→strip→render→atomic_write; keychain chain closed), dim4=partial (RelayExportFile schema confirmed; CodexPaths offsets inferred not independently verified), dim5=macOS confirmed.
- Windows: dim2=closed_evidence_md, dim3=closed, dim4=partial (field names inferred from evidence.md; offsets confirmed; no pseudocode-manifest.jsonl), dim5=Windows independent confirmed.

**dim6_basis**: TOML block markers confirmed exactly on Windows (6 markers, exact byte lengths). Atomic write pattern confirmed. Provider kind byte encoding (0=stdio/1=http/2=sse/3=unknown) confirmed on Windows. SIMD hashmap pattern for managed_block_migration confirmed.

**leaves**:
- `apply_codex_state` (main orchestrator, mac): E2E test — call with a RelayProvider in state; assert config.toml written with correct aimami-relay managed blocks. [e2e]
- TOML block markers (6 markers, exact literals): Unit test — call toml_block_renderer; assert output contains exact start/end marker strings (e.g. `"# >>> aimami-relay managed start (DO NOT EDIT MANUALLY)"`). [unit]
- `toml_section_writer_atomic_sys` idempotency: Unit test — call twice with same content; assert file written once (stat mtime unchanged on second call). [unit]
- `managed_block_migration_core_sys`: Unit test — supply config.toml with existing block; assert block replaced not duplicated. [unit]
- `relay_atomic_write_file_sys` (Windows, 0x140332540): Unit test — write to temp then rename; assert atomic: no partial write visible on reader thread. [unit]
- Provider kind byte encoding (0=stdio/1=http/2=sse): Unit test — instantiate each kind; assert correct TOML `type` field rendered. [unit]
- Compact flag rendering: Unit test — set compact=true; assert "compact" variant TOML rendered. [unit]
- TOML field dispatch (len=3→env, len=4→type/port/purl, len=7→command/enabled, len=9→transport): Unit test — supply provider with each field type; assert correct TOML field rendered. [unit]
- `relay_export_file` / `RelayExportFile` schema (schemaVersion, timestamp, providers, include_api_key): Unit test — serialize RelayExportFile with all fields; assert JSON schema matches. [unit]
- `relay_startup_cleanup_orphan_provider`: Unit test — supply config.toml with orphan router entries; assert orphans removed except "openai" hard-exclusion. [unit]
- CodexPaths offsets (macOS inferred, Windows +776/+784): Not-automatable for exact offsets — verify via integration test that paths built from env resolve correctly. [manual-integration]
- Windows SIMD hashmap (40-byte entries, 176-bit slots): Not-automatable from source archive side — implement using std HashMap; behavior compatibility verified via block migration acceptance test. [not-automatable]
- `managed_block_helper_split_sys` + `relay_preflight_strip_provider_profile`: Unit tests — supply config with managed block; assert split/strip produces correct output. [unit × 2]
- Import/export round-trip: E2E test — export relay state; import same state; assert config.toml identical. [e2e]

**dim6_status**: closed (macOS + Windows; CodexPaths offsets and SIMD hashmap are not-automatable but documented)

**readyToImplement_verdict**:
- macOS: NO — dim4 CodexPaths offsets not independently verified (blocks strictImplementationUse for that sub-leaf). Remaining: **Upgradeable to readyToImplement** for all leaves except CodexPaths-dependent paths (which are product_decision/accepted_unknown).
- Windows: NO — dim4 partial (no pseudocode-manifest.jsonl). Functionally: **readyToImplement eligible** for TOML rendering leaves (evidence.md confirms behavior). Formal gate: strictImplementationUse (dim4 partial blocks highest gate).

---

## 8. relay_diagnostic — macOS (consumerStartReady) + Windows (strictImplementationUse)

**dim1–5 status**:
- macOS: dim1=confirmed (IPC commands: run_codex_router_diagnostics, fix_codex_router_issue), dim2=confirmed (10 VAs all pinned; run_diagnostics body truncated 284KB), dim3=confirmed depth≥5, dim4=confirmed (DiagnosticsItem/FixResult DTOs; 9 check kinds named), dim5=macOS confirmed.
- Windows: dim1=product_decision, dim2=closed_evidence_md (engine fn 53KB body: 3/7 checks traced, others inferred), dim3=closed, dim4=partial (dispatch table fully recovered; 3/7 diagnostic check bodies traced), dim5=Windows independent confirmed.

**dim6_basis**: fix_codex_router_issue itemId dispatch table fully recovered on Windows (all 8 itemId values). Codex process kill chain confirmed. Chinese UI status strings confirmed (exact byte lengths). relay_startup_cleanup_orphan_provider algorithm confirmed.

**leaves** (both platforms):
- `run_codex_router_diagnostics` IPC entry: E2E test — call IPC command; assert JSON array of DiagnosticsItem returned with `issue_kind`, `status`, `details` fields. [e2e]
- `fix_codex_router_issue` IPC entry: E2E test — call with `itemId="config_stale"`; assert config written/fixed. [e2e]
- `fix_codex_router_issue` dispatch table (all 8 itemIds): Unit test per itemId — `"all"` → full repair; `"config_stale"` → toml write; `"auth_integrity"` → log only (no auto-fix); `"config_toml_syntax"` → syntax repair; `"config_third_party"` → text strip; `"db_orphan_providers"` → SQLite orphan cleanup; `"catalog_path_validity"` → catalog check; `"config_profile_conflict"` → conflict resolve. [unit × 8]
- SIMD length-bucketed dispatch for same-length itemIds (len=18: config_toml_syntax vs config_third_party): Unit test — supply each; assert correct handler invoked. [unit]
- `relay_diagnostic_engine_core_sys` (macOS run_diagnostics 284KB truncated body): Manual acceptance — implement 9 diagnostic check kinds; verify output covers all 9 in returned array. [manual — body too large to fully trace]
- Codex process kill chain (process name scan → quit with 8s timeout → fallback kill): Unit test with mock process — assert quit attempted, fallback kill triggered after timeout. [unit]
- `relay_startup_cleanup_orphan_provider` — orphan detection with "openai" hard-exclusion: Unit test — supply config with orphan provider; assert removed; supply "openai"; assert kept. [unit]
- Chinese UI status strings (5 confirmed strings, exact lengths): Manual acceptance — verify strings match exactly in source archive implementation (copy exact literals). [manual]
- `relay_health_check_core_sys` status messages in relay_diagnostic context: Manual — verify messages match the 5 confirmed Chinese strings. [manual]
- `is_known_placeholder_token` / `is_known_or_builtin` whitelists: Product decision — source archive decides on whitelist content; implement as configurable list. [product_decision / not-automatable]

**dim6_status**: closed (macOS + Windows; truncated run_diagnostics body and is_known_* whitelists are documented as manual/product_decision)

**readyToImplement_verdict**:
- macOS: NO — dim2 partial (run_diagnostics 284KB truncated). Leaves with confirmed decompile → readyToImplement eligible. run_diagnostics full behavior → consumerStartReady.
- Windows: NO — dim4 partial (3/7 diagnostic check bodies). Same pattern as macOS.

---

## 9. relay_health_audit — macOS (consumerStartReady, blocked on RelayTestResult) + Windows (gap_needs_reducer)

**dim1–5 status**:
- macOS: dim1=confirmed (IPC: test_relay_provider, get_passthrough_audit_log), dim2=closed (10 functions all decompiled), dim3=confirmed depth≥5, dim4=partial (PassthroughAuditEntry 5/7 fields; RelayTestResult payload Unknown / level-D), dim5=macOS confirmed.
- Windows: dim2=blocked (IDA MCP unreachable <network-share>:13337; 0/11 decompiled), dim3=blocked, dim4=blocked, dim5=partial.

**dim6_basis**: macOS health check behavior documented (limit:u32 → Vec<PassthroughAuditEntry>, health check logic confirmed). Windows completely blocked — no decompile available.

**leaves** (macOS only; Windows pending-deep):
- `test_relay_provider` IPC → health check pipeline: E2E test — call IPC with provider_id; assert RelayTestResult returned. Exact fields accepted_unknown → assert at minimum `{success: bool}` returned without panic. [e2e]
- `get_passthrough_audit_log` IPC → passthrough audit: E2E test — call IPC with `limit=10`; assert array of PassthroughAuditEntry objects returned (5 confirmed fields: timestamp/provider_id/status_code/latency_ms/error). [e2e]
- `health_check` internal (6 functions: check_relay_enabled, check_provider_enabled, check_config_written, check_catalog_written, verify_provider_route, relay_test_probe): Unit test per check — assert correct `status` and `details` returned for each pass/fail condition. [unit × 6]
- `passthrough_audit` internal (4 functions): Unit test — write audit entries to audit log; call passthrough_audit; assert entries returned with correct fields. [unit]
- `PassthroughAuditEntry` 5/7 fields (2 Unknown): Manual acceptance — implement with 5 confirmed fields; add 2 optional fields as `Option<T>`; verify deserialization does not panic on unknown fields. [manual]
- `RelayTestResult` exact DTO (level-D, Unknown): Not-automatable for field coverage — implement as struct with `success: bool` + `Option<String>` fields; verify via E2E that field names in response do not cause deserialization panic. [not-automatable]
- Windows health_audit (all blocked): pending-deep — no acceptance mapping possible until IDA MCP reconnect. Mark `gap_needs_reducer`. [pending-deep]

**dim6_status**: partial — macOS leaves mapped (RelayTestResult and 2 PassthroughAuditEntry fields are not-automatable/documented); Windows = pending-deep

**readyToImplement_verdict**: NO for both platforms. macOS: RelayTestResult Unknown blocks dim4→strictImplementationUse. Windows: completely blocked. Neither can reach readyToImplement.

---

## 10. relay_manager — macOS (consumerStartReady / strictImplementationUse_candidate) + Windows (strictImplementationUse)

**dim1–5 status**:
- macOS: dim1=confirmed (Tauri commands invoke RelayManager methods), dim2=closed (17 functions), dim3=closed (methods reach fs/keychain/serde/state leaves), dim4=partial (RelayState/RelayProvider layout inferred; not independently verified all fields), dim5=macOS confirmed.
- Windows: dim2=closed, dim3=closed, dim4=closed (keychain: CredentialManager + USER/USERNAME env + SHA256 derivation; 13 Windows leaves), dim5=Windows independent confirmed.

**dim6_basis**: macOS RelayProvider 208 bytes / 7+ String fields documented. Windows keychain: CredentialManager + SHA256(USER+USERNAME+provider_id) confirmed. Windows call chain (codex_paths +776/+784 paths) confirmed.

**leaves** (both platforms):
- `relay_manager_new` / constructor: Unit test — instantiate; assert BreakerStore initialized, RelayState loaded. [unit]
- `upsert_relay_provider`: Unit test — add new provider; assert persisted to RelayState + config.toml written. [unit]
- `remove_relay_provider`: Unit test — remove provider by ID; assert removed from state + config.toml updated. [unit]
- `set_active_provider`: Unit test — set active provider ID; assert RelayState updated. [unit]
- `activate_relay_provider` / `deactivate_relay_provider`: E2E test — call via IPC; assert relay enabled/disabled; assert codex_router_enabled flag toggled. [e2e]
- `persist_relay_state` / `persist_commit`: Unit test — mutate state; call persist; assert config.toml written atomically. [unit]
- `get_relay_state`: Unit test — populate RelayState; assert returned JSON matches RelayState schema. [unit]
- `relay_keychain_get_api_key` (macOS Keychain): Integration test — store field in Keychain; call fn; assert retrieved. [integration]
- `relay_keychain_get_api_key` (Windows: CredentialManager + SHA256(USER+USERNAME+provider_id)): Integration test — store field in CredentialManager; call fn; assert retrieved. Assert target name derived correctly from provider_id. [integration, platform-divergent]
- `relay_keychain_set_api_key` (both platforms): Integration test — call set; then get; assert round-trip. [integration]
- Windows CredentialManager error 0x8000000000000007 → return None: Unit test — mock CredMan error; assert Ok(None) returned (not panic). [unit]
- Windows SIMD hashmap cache (in-memory field cache): Not-automatable from source archive side — implement with std HashMap; verify via integration test that field retrieved after set without extra Keychain call. [not-automatable]
- Cross-platform keychain divergence (macOS Keychain vs Windows CredMan): Manual acceptance — document two-platform implementation; test independently. [manual]
- `RelayProvider` 15-field deserialization: Unit test — deserialize JSON with all 15 fields; assert all populated. [unit] (references relay_models acceptance)
- `RelayActiveByIde::add` + Windows chain (persist_commit+reset_codex_config+ensure_proxy_started): Integration test — add IDE entry; assert all three called in sequence. [integration]

**dim6_status**: closed (macOS + Windows; SIMD cache and CredMan error path are documented not-automatable)

**readyToImplement_verdict**:
- macOS: NO — dim4 partial (RelayProvider layout inferred not independently verified). strictImplementationUse_candidate → requires independent offset verification for highest gate. All other leaves: readyToImplement eligible.
- Windows: **Upgradeable to readyToImplement**. dim1-6 all closed (dim1=product_decision, Windows dims 2-5 fully confirmed, dim6 now closed).

---

## 11. relay_proxy_server — macOS (consumerStartReady) + Windows (strictImplementationUse)

**dim1–5 status**:
- macOS: dim1=confirmed (internal; frontend triggers via relay state), dim2=closed (9 sub-leaf functions + 16 pseudocode), dim3=confirmed depth≥6, dim4=partial (ProxyContext coroutine frame partial; circuit-breaker string evidence; SSE buffer 1MB/8MB limits), dim5=macOS confirmed.
- Windows: dim2=closed (9 leaves: handle_codex_router_ws_core_sys + HTTP endpoints), dim3=closed (forward_with_candidates→reqwest chain), dim4=closed (relay_enabled offset +676, compact_allowed +677, state_machine_case +849, HTTP endpoints confirmed), dim5=Windows independent confirmed.

**dim6_basis**: Windows endpoint routes confirmed (/codex/router/v1/responses, /v1/responses/compact, /v1/health). Error codes confirmed (400/403/404/500/503 + message keys). Passthrough headers confirmed (x-aimami-route, openai-passthrough). Upstream URLs confirmed.

**leaves** (both platforms):
- `handle_codex_active_ws` / `handle_codex_router_ws_core_sys`: E2E test — connect WebSocket to /codex/router/v1/responses; assert relay-proxied response returned. [e2e]
- `handle_codex_router_ws` (compact variant): E2E test — connect to /codex/router/v1/responses/compact; assert compact path taken. [e2e]
- `forward_codex_responses_internal` / `forward_codex_router_responses_internal`: Integration test — mock upstream; assert SSE→WS forwarding. [integration]
- `build_upstream_headers` / `build_upstream_url_and_headers_sys` (win): Unit test — supply relay config; assert upstream URL constructed (normal: chatgpt.com/backend-api/codex/responses; compact variant). [unit]
- `try_pass_through` / `try_pass_through_sys` (win): Integration test — enable passthrough; assert headers `x-aimami-route` + `openai-passthrough` added to response. [integration]
- `record_codex_route` / `record_codex_route_sys` (win): Unit test — supply route field `"aimami_relay_<suffix>"`; assert 13-byte prefix stripped; assert route field returned. [unit]
- `forward_with_candidates` (circuit-breaker integration): Integration test — inject failing provider; assert breaker opens; assert fallback provider used. [integration]
- HTTP error codes (400/403/404/500/503): Unit test — trigger each error condition; assert correct HTTP status code and error field (router.missing_model etc.). [unit × 5]
- `relay_enabled` flag (+676 Windows): Unit test — set enabled=false; assert 503 router.disabled returned. [unit]
- SSE buffer limits (macOS 1MB SSE body / 8MB body limit): Integration test — send response near limit; assert truncation or error at boundary. [integration]
- `bridge_http_response_to_codex_ws`: Integration test — send HTTP response; assert correctly bridged to WebSocket format. [integration]
- `stream_sse_body_to_ws` (vtable dispatch, accepted_unknown): Not-automatable for vtable body — verify via E2E that streaming works. [e2e]
- ProxyContext full struct offset map (macOS partial): Not-automatable — implement as typed Rust struct; verify via integration. [not-automatable]
- /codex/router/v1/health endpoint: Unit test — call health endpoint; assert 200 OK returned. [unit]

**dim6_status**: closed (macOS + Windows; ProxyContext offsets and vtable dispatch are not-automatable but documented)

**readyToImplement_verdict**:
- macOS: NO — dim4 ProxyContext partial (blocks strictImplementationUse). Most leaves → readyToImplement eligible individually.
- Windows: **Upgradeable to readyToImplement**. dim1-6 all closed (Windows endpoint routes, error codes, state offsets all confirmed).

---

## 12. relay_thread_migration — macOS (consumerStartReady / strictImplementationUse_candidate) + Windows (strictImplementationUse)

**dim1–5 status**:
- macOS: dim1=confirmed (called from activate/set_codex_router_enabled), dim2=confirmed (7 functions; migrate_threads full body truncated 42829 chars), dim3=confirmed depth≥5 (rusqlite/rayon/atomic_write/serde_json leaves), dim4=confirmed (ThreadRouterMigrationManifest 7 fields, ThreadRouterMigrationEntry 10 fields, 4 SQL UPDATE variants, error discriminants 10/9/2/3/8), dim5=macOS confirmed.
- Windows: dim2=closed_evidence_md, dim3=closed, dim4=closed (replace_first_session_meta_line fully decompiled: atomic temp-rename pattern, PID+random temp name, mtime restore, error codes 8/9), dim5=Windows independent confirmed.

**dim6_basis**: Windows replace_first_session_meta_line algorithm fully decompiled (10-step atomic rename pattern). Scope selection ("full" vs "incremental"). rollback parallelism (rayon). Orphan detection hard-coded to "openai" fallback. Provider "subagent" explicitly skipped.

**leaves** (both platforms):
- `migrate_threads` / `migrate_threads_for_router_with_scope`: E2E test — create sessions with old provider route; call migrate; assert all sessions updated to new provider. [e2e]
- `rollback_threads` / `rollback_rollouts_in_parallel`: E2E test — create migration manifest; call rollback; assert all threads restored to pre-migration state. [e2e]
- `rollback_rollouts_in_parallel` rayon parallelism (macOS) / `_InterlockedExchangeAdd64` atomic counter (Windows): Integration test — trigger parallel rollback; assert success counter matches number of rollbacks. [integration]
- `replace_first_session_meta_line` (Windows, 10-step atomic rename): Unit test — supply rollout file with first line; call replace; assert first line updated, rest of file unchanged, mtime preserved. [unit]
- `replace_first_session_meta_line` error code 9 (session_meta changed): Unit test — supply mismatched expected_old_line; assert error 9 returned. [unit]
- `replace_first_session_meta_line` temp file naming (PID + random sensitive-field): Not-automatable for exact name — verify via integration that temp file cleaned up on success and on failure. [manual-integration]
- 
ormalize` (ThreadRouterMigrationManifest cleanup): Unit test — supply manifest with orphan entries; assert orphans removed. [unit]
- `cleanup_orphan` (orphan thread detection with "openai" hard-exclusion): Unit test — same as relay_diagnostic orphan test. [unit]
- `write_manifest` (serde_json serialization): Unit test — create manifest; call write; assert JSON file with 7 fields (ThreadRouterMigrationManifest). [unit]
- Scope parameter "full" vs "incremental" (+ date arithmetic for incremental): Unit test — call with scope="incremental"; assert only sessions within date range migrated. [unit]
- Provider "subagent" skipped: Unit test — include "subagent" provider in session list; assert not migrated. [unit]
- `migrate_threads` full body (macOS 42829 chars truncated — accepted_unknown for exact internal logic): Manual acceptance — implement based on manifest schema + SQL UPDATE variants + error discriminants; verify via E2E migration test. [manual]
- SQLite TX (`BEGIN "sqlite begin router-created rollback" → COMMIT/ROLLBACK`): Unit test — trigger rollback; assert `DB_ROUTER_CREATED_ROLLBACK_FAILED` error string returned on DB error. [unit]
- Error discriminant 10 (success) / 9 / 2 / 3 / 8: Unit test — trigger each discriminant condition; assert correct error variant returned. [unit]
- UTF-16 paths (Windows WCHAR paths in replace_first_session_meta_line): Not-automatable from source archive Rust side — Rust std handles UTF-16; verify via integration that file paths with Unicode characters work. [not-automatable]

**dim6_status**: closed (macOS + Windows; migrate_threads truncated body and UTF-16 paths are documented not-automatable)

**readyToImplement_verdict**:
- macOS: NO — migrate_threads full body truncated (blocks full strictImplementationUse). Known leaves (manifest/rollback/normalize/cleanup/error-discriminants) → readyToImplement eligible individually.
- Windows: **Upgradeable to readyToImplement**. dim1-6 all closed (replace_first_session_meta_line fully decompiled; all other leaves confirmed).

---

## 13. relay_translator — macOS only (consumerStartReady)

**dim1–5 status**: dim1=confirmed (internal; invoked from proxy_server for format conversion), dim2=closed (14 functions all decompiled), dim3=confirmed depth≥6, dim4=partial (function_call/tool_result mapping Unknown; OpenAI→Anthropic field mappings confirmed for role/user/content/thinking/text_delta), dim5=macOS confirmed / Windows not analyzed (separate scope).

**dim6_basis**: 14 functions decompiled. Primary unknowns: exact function_call/tool_result → Anthropic tool format mapping. max_tokens handling. bge-host header routing use.

**leaves** (macOS only; Windows scope separate):
- `responses_to_anthropic_request` / `anthropic_to_responses`: Unit test — supply OpenAI Responses API request; assert Anthropic-format request produced with correct `role`/`content`/`model` fields. [unit]
- `chat_to_responses` / `responses_to_chat`: Unit test — supply chat completion format; assert Responses API format produced and vice versa. [unit]
- `forward_to_openai`: Integration test — mock upstream OpenAI; assert request forwarded with correct headers. [integration]
- `execute_proxy_tools` / `execute_with_web_tools`: Same as relay_web_executor acceptance (shared functions). [unit/e2e — see §2]
- `fetch_raw_text`: Same as relay_web_executor acceptance (shared function). [unit — see §2]
- `build_passthrough_request_headers`: Unit test — supply provider config; assert headers assembled correctly (auth + content-type). [unit]
- `is_bearer_likely_missing`: Unit test — supply request without Bearer sensitive-field; assert true. Supply with sensitive-field; assert false. [unit]
- `strip_billing_header`: Unit test — supply request headers with billing header; assert stripped. [unit]
- function_call / tool_result → Anthropic format mapping (blocks_start): Manual acceptance — implement mapping following Anthropic API spec (tool_use block format); verify E2E that tool calls proxied correctly through relay. [e2e + manual]
- `max_tokens` handling (accepted_unknown): Manual — implement following Anthropic API spec; verify no panic on omitted/large values. [manual]
- `bge-host` header routing (accepted_unknown): Manual — verify in integration test that header present/absent doesn't cause routing failure. [manual-integration]
- Stream format conversion (OpenAI→Anthropic SSE): E2E test — send streaming request through relay in Anthropic mode; assert SSE events correctly formatted. [e2e] (see relay_translator_stream §1 for state machine detail)

**dim6_status**: partial — function_call/tool_result mapping is blocks_start; other leaves mapped

**readyToImplement_verdict**: NO — function_call/tool_result mapping Unknown blocks strictImplementationUse for API-parity leaves. Leaves without tool_result dependency → readyToImplement eligible.

---

## 14. relay_codex_writer (macOS additional) — see §7

No additional macOS-specific leaves beyond what §7 covers.

---

## Cross-Platform Divergence Summary

| behavioral aspect | macOS | Windows | source archive implementation note |
|---|---|---|---|
| Keychain | Keychain Services | CredentialManager | Platform-divergent; use `keyring` crate or platform cfg |
| field derivation | not traced | SHA256(USER+USERNAME+provider_id) | Windows: implement exact derivation |
| Daemon registration | LaunchAgent (plist) | schtasks /MO 5 /TN CodexMateAutoSwitch | Platform-divergent |
| Thread sync primitive | POSIX Condvar | WakeByAddressSingle + InterlockedCompareExchange8 | Use std Mutex/Condvar; Rust handles platform differences |
| File paths | macOS UTF-8 | Windows UTF-16 WCHAR | Use Rust std::path::Path |
| web_tools truncate | 8000 chars Unicode-safe | 8000 bytes byte count | **Platform-divergent behavior** — source archive must pick one or fork impl |
| BreakerState stride | 40 bytes | 208 bytes | Internal hashmap layout; source archive uses std HashMap |
| SSE buffer limit | 1MB SSE / 8MB body | Not confirmed | macOS-only until Windows gate |
| single-instance mutex | POSIX semaphore or similar | CreateMutexW + ERROR_ALREADY_EXISTS 183 | Not in source archive scope |

---

## Dim6 Closure Summary — Per Cluster

| cluster | platform | dim1-5 prior gate | dim6 status | readyToImplement eligible? |
|---|---|---|---|---|
| relay_translator_stream | macOS | strictImplementationUse | **closed** | YES (macOS) / NO (Windows not-started) |
| relay_web_executor | macOS + Windows | strictImplementationUse (both) | **closed** | **YES (both platforms)** |
| relay_web_tools | macOS + Windows | strictImplementationUse (both) | **closed** | **YES (both platforms)** |
| relay_models | macOS | consumerStartReady (RelayTestResult Unknown) | **closed** | NO (macOS dim2 partial) |
| relay_models | Windows | strictImplementationUse | **closed** | **YES (Windows)** |
| relay_breaker | macOS | consumerStartReady | **closed** | **YES (macOS, 5/5 leaves)** |
| relay_breaker | Windows | strictImplementationUse | **closed** | YES for 10/11 (new_store blocked) |
| relay_fetch_models | macOS | gap_needs_reducer | partial (async blocked) | NO — still gap_needs_reducer |
| relay_fetch_models | Windows | strictImplementationUse | partial (async accepted_unknown) | YES for 10/12 non-async leaves |
| relay_codex_writer | macOS | consumerStartReady | **closed** | YES for non-CodexPaths leaves |
| relay_codex_writer | Windows | strictImplementationUse | **closed** | YES for TOML rendering leaves |
| relay_diagnostic | macOS | consumerStartReady | **closed** | YES for confirmed decompile leaves |
| relay_diagnostic | Windows | strictImplementationUse | **closed** | YES for dispatch table + confirmed leaves |
| relay_health_audit | macOS | consumerStartReady | partial (RelayTestResult not-automatable) | NO (RelayTestResult Unknown) |
| relay_health_audit | Windows | gap_needs_reducer | pending-deep | NO |
| relay_manager | macOS | consumerStartReady / strict_candidate | **closed** | YES for confirmed leaves (RelayProvider offsets not independently verified) |
| relay_manager | Windows | strictImplementationUse | **closed** | **YES (Windows)** |
| relay_proxy_server | macOS | consumerStartReady | **closed** | YES for confirmed leaves (ProxyContext partial) |
| relay_proxy_server | Windows | strictImplementationUse | **closed** | **YES (Windows)** |
| relay_thread_migration | macOS | consumerStartReady / strict_candidate | **closed** | YES for confirmed leaves (migrate_threads truncated) |
| relay_thread_migration | Windows | strictImplementationUse | **closed** | **YES (Windows)** |
| relay_translator | macOS | consumerStartReady | partial (tool_result mapping blocks_start) | NO for tool_result leaves; YES for others |

---

## Clusters Eligible for readyToImplement Promotion (this mapping)

The following clusters have dim1-6 all confirmed and may be promoted to `readyToImplement` by the canonical producer (<workstation>, session highest-gate-109):

1. **relay_web_executor** — macOS + Windows (dim1=product_decision accepted; dim2-6 closed)
2. **relay_web_tools** — macOS + Windows (dim1=product_decision accepted; dim2-6 closed; truncate divergence documented)
3. **relay_models** — Windows only (dim1-6 all closed)
4. **relay_manager** — Windows only (dim1-6 all closed)
5. **relay_proxy_server** — Windows only (dim1-6 all closed)
6. **relay_thread_migration** — Windows only (dim1-6 all closed)
7. **relay_breaker** — macOS (5/5 leaves); Windows 10/11 leaves (new_store pending)

**Clusters remaining at strictImplementationUse** (dim6 closed, dim1-5 gaps remain):
- relay_translator_stream: macOS only (Windows gate not-started)
- relay_codex_writer: macOS (CodexPaths offsets) + Windows (pseudocode-manifest partial)
- relay_diagnostic: macOS (run_diagnostics truncated) + Windows (3/7 check bodies)
- relay_manager: macOS (RelayProvider offsets inferred)
- relay_proxy_server: macOS (ProxyContext partial)
- relay_thread_migration: macOS (migrate_threads truncated)

**Clusters still gap_needs_reducer** (dim6 can only be partial):
- relay_fetch_models: macOS (fetch_async/fetch_openai_async IDA blocked)
- relay_health_audit: Windows (IDA MCP unreachable)

**Clusters pending-deep** (IDA not done at all):
- relay_health_audit: Windows
- relay_translator_stream: Windows
- relay_fetch_models: macOS (async leaves)

---

---

## relay-transport-closeout-109 Session Supplement — Windows Strict Cluster dim6 + Transport Sub-Cluster dim6

**Session**: <audit-session>
**Owner gate**: ALLOW / write_mode=owner (bundle manifest owner <workstation>; relay-missed-109 + relay-closeout-109 + relay-mac-closeout-109 + relay-image-compat-109 chain)
**Note**: No new IDA work performed for dim6 closure. All acceptance conditions derived from existing gate-report evidence. This file mirrors Part A + Part B from audits/macos-1.0.9-relay-core/logic/RELAY-CORE-ACCEPTANCE-MAPPING-109.md (relay-transport-closeout-109 supplement). Refer to that file for full leaf-level detail; this file records the Windows-specific dim6 verdicts and the updated full cluster table.

---

## Windows Strict Cluster dim6 Verdicts (relay-transport-closeout-109)

| cluster | prior gate | dim6 status (this session) | readyToImplement verdict |
|---|---|---|---|
| relay_codex_writer (win) | strictImplementationUse | **closed** | **readyToImplement eligible** — dim1-5 closed (pseudocode-manifest.jsonl confirmed relay-mac-closeout-109); dim6 now closed (all TOML/export/migration/cleanup leaves mapped); CodexPaths offsets=accepted_unknown non-blocking |
| relay_diagnostic (win) | strictImplementationUse | **closed** | **readyToImplement for 6/7 leaves** — fix_issue dispatch (8 itemIds) + all confirmed leaves eligible; relay_diagnostic_engine_core_sys 53KB = accepted_unknown ceiling |
| relay_health_audit (win) | strictImplementationUse | **closed** | **strictImplementationUse** — all 9 decompiled leaves mapped; 2 ICF near-dup leaves (build_test_request_shared + apply_extra_headers_variant_b) accepted_unknown; full_leaf_100 blocked |
| relay_fetch_models (win) | strictImplementationUse | **closed (10/12)** | **strictImplementationUse overall** — 10 utility leaves readyToImplement eligible; fetch_async/fetch_openai_async async terminals ICF-blocked accepted_unknown ceiling |
| relay_translator (win) | strictImplementationUse | **closed** | **readyToImplement eligible** — tool_result/tool_choice mapping CONFIRMED Windows IDA (convert_anthropic_message_to_openai_chat_sys@0x140214FD0); all 15 leaves mapped; max_tokens/bge-host = accepted_unknown non-blocking |
| relay_image_compat (win) | strictImplementationUse | **closed** | **strictImplementationUse** — all 9 leaves mapped; sub_140108C80 (image_url check body) accepted_unknown; forward gate behavioral-only |

---

## Transport Sub-Cluster dim6 Verdicts — Windows (relay-transport-closeout-109)

| sub-cluster | dim6 status | Windows verdict |
|---|---|---|
| relay_forward_chain | closed | **strictImplementationUse** — forward_with_candidates ICF-inlined accepted_unknown; try_pass_through_sys + record_codex_route_sys confirmed |
| relay_sse | closed | **strictImplementationUse** — relay_enabled(+676) + compact_allowed(+677) flags confirmed; SSE path confirmed via proxy_server evidence |
| relay_ws_handlers | closed | **readyToImplement eligible** — handle_codex_router_ws_core_sys + endpoint routes confirmed; featureA = product_decision (non-blocking) |
| relay_passthrough_helpers | closed | **readyToImplement eligible** — passthrough_audit_entry_serializer_sys@0x14042E340 + passthrough_audit_jsonl_append_sys@0x14042D9E0 confirmed; 7 fields + fire-and-forget + 1MB guard all confirmed |
| relay_proxy_config | closed | **strictImplementationUse** — ProxyContext 6-field layout confirmed (proxy_server_router_route_registrar_sys@0x140384E10); reqwest TLS internal config accepted_unknown |

---

## Full Cluster Gate Summary — Windows (Updated relay-transport-closeout-109)

| cluster | prior gate | gate after relay-transport-closeout-109 | dim6 |
|---|---|---|---|
| relay_manager | readyToImplement | readyToImplement (unchanged) | closed |
| relay_proxy_server | readyToImplement | readyToImplement (unchanged) | closed |
| relay_thread_migration | readyToImplement | readyToImplement (unchanged) | closed |
| relay_models | readyToImplement | readyToImplement (unchanged) | closed |
| relay_breaker | readyToImplement | readyToImplement (unchanged) | closed |
| relay_web_executor | readyToImplement | readyToImplement (unchanged) | closed |
| relay_web_tools | readyToImplement | readyToImplement (unchanged) | closed |
| relay_translator_stream | readyToImplement | readyToImplement (unchanged) | closed |
| relay_codex_writer | strictImplementationUse | **readyToImplement eligible** | **closed (this session)** |
| relay_translator | strictImplementationUse | **readyToImplement eligible** | **closed (this session)** |
| relay_diagnostic | strictImplementationUse | **readyToImplement eligible for 6/7 leaves** | **closed (this session)** |
| relay_health_audit | strictImplementationUse | strictImplementationUse (2 accepted_unknown leaves) | **closed (this session)** |
| relay_fetch_models | strictImplementationUse | strictImplementationUse (10/12 eligible) | **closed (this session)** |
| relay_image_compat | strictImplementationUse | strictImplementationUse (forward gate body accepted_unknown) | **closed (this session)** |
| bootstrap | consumerStartReady_candidate | consumerStartReady_candidate (out-of-scope) | missing |

**Transport sub-clusters (all new this session)**:
| relay_forward_chain | n/a (sub-cluster) | strictImplementationUse | **closed (this session)** |
| relay_sse | n/a | strictImplementationUse | **closed (this session)** |
| relay_ws_handlers | n/a | readyToImplement eligible | **closed (this session)** |
| relay_passthrough_helpers | n/a | readyToImplement eligible | **closed (this session)** |
| relay_proxy_config | n/a | strictImplementationUse | **closed (this session)** |

---

_Produced by: <workstation> / session relay-closeout-109 (initial) + relay-transport-closeout-109 (Windows strict dim6 + transport sub-cluster dim6) / 2026-06-03_
_Evidence source: audits/windows-1.0.9-relay-core/gate-report.json + logic/WIN-RELAY-HEALTH-AUDIT-REDUCE-109.md + WIN-RELAY-MAC-CLOSEOUT-109.md + WIN-RELAY-IMAGE-COMPAT-109.md + WIN-RELAY-CLOSEOUT-109.md + audits/macos-1.0.9-relay-core/logic/RELAY-CORE-ACCEPTANCE-MAPPING-109.md (relay-transport-closeout-109 Part A+B)_
_No new IDA work for this update. All dim6 acceptance conditions derived from existing gate-report evidence and confirmed leaf decompile results._
_Owner gate: ALLOW / write_mode=owner. Canonical producer: <workstation> (relay-missed-109 + relay-closeout-109 + relay-mac-closeout-109 + relay-image-compat-109 + relay-transport-closeout-109)._
