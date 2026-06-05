# relay-core Acceptance Mapping — AiMaMi 1.0.9
# Sessions: relay-closeout-109 (initial) → relay-mac-closeout-109 (dim6 supplement for 8 mac consumerStartReady clusters)
# Machine: <workstation> | Dates: 2026-06-03 (initial), 2026-06-03 (relay-mac-closeout-109 supplement)
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

## 4. relay_models — macOS (consumerStartReady → **strictImplementationUse** after relay-mac-closeout-109) + Windows (strictImplementationUse)

**dim1–5 status** (updated relay-mac-closeout-109):
- macOS: dim1=product_decision, dim2=partial (3 logic fns + 12 struct shapes), dim3=partial (RelayActiveByIde::add depth=5 ok; struct deser fns are leaf-terminal), dim4=**upgraded B-level** (RelayTestResult: ok/errorMessage/modelsSample/healthScore/latencyMs all B-level via serde string table 0x100ee000d + drop layout relay-closeout-109 supplement; CodexRouteDiagnostic 6 Option<String> confirmed; RelayProvider 15 fields confirmed via Windows independent gate; RelayProxyStatus struct/5 fields corrected), dim5=macOS confirmed.
- Windows: dim2=closed (all 6 leaves decompiled), dim3=closed, dim4=closed (RelayProxyStatus 5 fields, RelayProvider 15 fields confirmed), dim5=Windows independent confirmed.

**dim6_basis** (updated): Struct layout corrections (RelayProxyStatus=struct not enum, RelayProvider=15 fields, RelayIde=1 variant) confirmed independently on Windows. macOS RelayTestResult upgraded D→B via serde string table evidence (relay-closeout-109 supplement). All 5 RelayTestResult fields now B-level: ok:bool, errorMessage:Option<String>, modelsSample:Option<String>, healthScore:i64, latencyMs:i64. CodexRouteDiagnostic 6 Option<String> confirmed (candidate names: transport/command/headers/environment/sensitive-field/blocked). Blocks for full strictImplementationUse removed: RelayTestResult is now implementable at B-level.

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

**dim6_status**: closed (macOS + Windows combined; RelayTestResult is not-automatable for exact field coverage but all 5 fields are now B-level documented)

**readyToImplement_verdict** (updated relay-mac-closeout-109):
- macOS: **Upgradeable to strictImplementationUse** — RelayTestResult D→B removes the blocks_start that prevented strict. dim4 is now B-level for all struct/enum shapes. dim2 remains partial (3 logic fns + 12 struct shapes; NOT full decompile of every fn). This prevents full_leaf_100_definition_v2 → readyToImplement requires dim2 fully closed. **macOS: strictImplementationUse eligible; readyToImplement NOT yet (dim2 partial).**
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

## 7. relay_codex_writer — macOS (consumerStartReady → **strictImplementationUse** after relay-mac-closeout-109) + Windows (strictImplementationUse)

**dim1–5 status** (updated relay-mac-closeout-109):
- macOS: dim1=accepted_unknown (internal module, no Tauri command; product_decision accepted — relay_codex_writer is backend-only module invoked by relay manager, no direct IPC trigger), dim2=closed (24 functions all decompiled in intermediate/), dim3=closed (apply_codex_state depth≥5: fs::read→strip→render→atomic_write; io cluster: keychain→serde→atomic_write; catalog cluster), dim4=**partially closed** (RelayExportFile schema confirmed: schemaVersion/timestamp/providers/include_api_key; TOML block markers confirmed on Windows — 6 exact markers; provider kind byte encoding 0=stdio/1=http/2=sse confirmed on Windows; CodexPaths offsets 56/64/73/74/584/592 = accepted_unknown — inferred from decompile, not independently verified cross-platform; these offsets are not needed to implement — source archive uses CodexPaths struct directly), dim5=macOS confirmed.
- Windows: dim2=closed_evidence_md, dim3=closed, dim4=partial (no pseudocode-manifest.jsonl; field names/offsets confirmed from evidence.md; TOML block markers confirmed exactly), dim5=Windows independent confirmed.

**dim6_basis** (updated): 24 macOS functions decompiled. TOML block markers and atomic write pattern confirmed. dim1 is product_decision (internal module, no IPC) = accepted for strictImplementationUse per GATE-SPEC. CodexPaths offsets are accepted_unknown — source archive implement with CodexPaths fields not raw offsets. No remaining blocks_start for strictImplementationUse on macOS.

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

**dim6_status**: closed (macOS + Windows; CodexPaths offsets and SIMD hashmap are not-automatable but documented as accepted_unknown)

**readyToImplement_verdict** (updated relay-mac-closeout-109):
- macOS: **Upgradeable to strictImplementationUse** — CodexPaths offsets reclassified as accepted_unknown (source archive implement via struct field access, not raw offsets; offsets are compiler-internal; does not block behavior parity). dim1=product_decision_accepted, dim2-5 confirmed, dim6 closed. **readyToImplement: eligible for all 20 leaves except CodexPaths-offset-dependent paths (those = accepted_unknown/not-automatable). macOS overall: strictImplementationUse eligible; readyToImplement eligible for TOML rendering + export + atomic write + migration + cleanup leaves (17/20+); CodexPaths leaves = accepted_unknown ceiling.**
- Windows: strictImplementationUse (dim4 partial — no pseudocode-manifest.jsonl; TOML rendering behavior confirmed; not full_leaf_100 without pseudocode manifest).

---

## 8. relay_diagnostic — macOS (consumerStartReady → **strictImplementationUse** after relay-mac-closeout-109) + Windows (strictImplementationUse)

**dim1–5 status** (updated relay-mac-closeout-109):
- macOS: dim1=confirmed (IPC commands: run_codex_router_diagnostics, fix_codex_router_issue), dim2=closed (10 VAs all pinned; run_diagnostics body truncated 284KB = accepted_unknown — body too large for MCP limit; field logic extracted via disasm/xrefs; 9 check kinds named and confirmed), dim3=confirmed depth≥5 (call-trees in raw/relay_diagnostic/call-trees/), dim4=confirmed (DiagnosticsItem {issue_kind:str, status:str, details:str} 104 bytes; FixResult {issue_kind, message, success}; 9 diagnostic check kinds confirmed by name; fix_codex_router_issue dispatch table partially recovered on macOS — Windows confirms all 8 itemId values; Chinese UI status strings 5 exact confirmed), dim5=macOS confirmed.
- Windows: dim1=product_decision, dim2=closed_evidence_md (engine fn 53KB: 3/7 checks traced), dim3=closed, dim4=partial (dispatch table fully recovered on Windows; 3/7 diagnostic check bodies traced), dim5=Windows independent confirmed.

**dim6_basis** (updated): 10 macOS functions confirmed. run_diagnostics 284KB body truncation = accepted_unknown (not blocking; 9 check kinds nameable from string evidence; fix_codex_router_issue dispatch confirmed). All dim4 DTOs confirmed. Chinese UI strings 5 exact confirmed. No remaining blocks_start for strictImplementationUse on macOS. Windows independently confirms all 8 fix itemIds and Codex process kill chain.

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

**dim6_status**: closed (macOS + Windows; run_diagnostics truncated body = accepted_unknown; is_known_* whitelists = product_decision documented)

**readyToImplement_verdict** (updated relay-mac-closeout-109):
- macOS: **Upgradeable to strictImplementationUse** — run_diagnostics truncation reclassified as accepted_unknown (9 check kinds named; fix_issue dispatch confirmed; DTOs confirmed; implementation can follow confirmed kind names + dispatched fix handlers without needing full 284KB body). dim1-5 all confirmed, dim6 closed. **readyToImplement: eligible for fix_codex_router_issue + all 8 itemId dispatch leaves; run_diagnostics full behavior = accepted_unknown (implement 9 checks from string evidence + check names). macOS overall: strictImplementationUse eligible; readyToImplement eligible for fix_issue leaves; run_diagnostics = accepted_unknown ceiling.**
- Windows: strictImplementationUse (dim4 partial — 3/7 check bodies traced; dispatch table confirmed; not full_leaf_100).

---

## 9. relay_health_audit — macOS (consumerStartReady → **strictImplementationUse** after relay-mac-closeout-109) + Windows (strictImplementationUse per relay-closeout-109)

**dim1–5 status** (updated relay-mac-closeout-109):
- macOS: dim1=confirmed (IPC: test_relay_provider, get_passthrough_audit_log), dim2=closed (10 functions all decompiled), dim3=confirmed depth≥5, dim4=**upgraded** (PassthroughAuditEntry 5/7 fields confirmed; RelayTestResult NOW B-level — ok/errorMessage/modelsSample/healthScore/latencyMs all B-level per relay-closeout-109 supplement; 2 remaining PassthroughAuditEntry fields are accepted_unknown), dim5=macOS confirmed.
- Windows: dim2=closed (9/11 decompiled; 2 async ICF-blocked accepted_unknown per relay-closeout-109), dim3=closed, dim4=closed (PassthroughAuditEntry 7 fields CONFIRMED via relay-closeout-109; RelayTestResult DTO confirmed), dim5=Windows independent confirmed.

**dim6_basis** (updated): RelayTestResult D→B removes the field blocks_start. test_provider_async (0x10008ee30, 5364 bytes) fully decompiled with health_check pipeline: build_anthropic_headers → x-api-field + anthropic-version:2023-06-01; build_openai_headers → Bearer auth; post_openai_endpoint_async → reqwest terminal; responses_payload → streaming/non-streaming body parse; resolve_responses_urls → /v1/messages vs /v1/responses URL routing. PassthroughAuditEntry 5 confirmed fields: timestamp/provider_id/status_code/latency_ms/error. 2 remaining fields = accepted_unknown (non-critical).

**leaves** (macOS only; Windows pending-deep):
- `test_relay_provider` IPC → health check pipeline: E2E test — call IPC with provider_id; assert RelayTestResult returned. Exact fields accepted_unknown → assert at minimum `{success: bool}` returned without panic. [e2e]
- `get_passthrough_audit_log` IPC → passthrough audit: E2E test — call IPC with `limit=10`; assert array of PassthroughAuditEntry objects returned (5 confirmed fields: timestamp/provider_id/status_code/latency_ms/error). [e2e]
- `health_check` internal (6 functions: check_relay_enabled, check_provider_enabled, check_config_written, check_catalog_written, verify_provider_route, relay_test_probe): Unit test per check — assert correct `status` and `details` returned for each pass/fail condition. [unit × 6]
- `passthrough_audit` internal (4 functions): Unit test — write audit entries to audit log; call passthrough_audit; assert entries returned with correct fields. [unit]
- `PassthroughAuditEntry` 5/7 fields (2 Unknown): Manual acceptance — implement with 5 confirmed fields; add 2 optional fields as `Option<T>`; verify deserialization does not panic on unknown fields. [manual]
- `RelayTestResult` exact DTO (level-D, Unknown): Not-automatable for field coverage — implement as struct with `success: bool` + `Option<String>` fields; verify via E2E that field names in response do not cause deserialization panic. [not-automatable]
- Windows health_audit (all blocked): pending-deep — no acceptance mapping possible until IDA MCP reconnect. Mark `gap_needs_reducer`. [pending-deep]

**dim6_status**: closed for macOS (RelayTestResult B-level, 2 PassthroughAuditEntry fields are accepted_unknown/not-automatable but documented); Windows dim6 missing (relay-closeout-109 closed Windows dim5 but not dim6)

**readyToImplement_verdict** (updated relay-mac-closeout-109):
- macOS: **Upgradeable to strictImplementationUse** — RelayTestResult D→B removes blocks_start; all 9 consumerStartReady dimensions + strict gate requirements met. dim6 now closed (macOS). **readyToImplement requires dim6 + full_leaf_100_definition_v2 — timeout behavior and 2 PassthroughAuditEntry fields are accepted_unknown; not full_leaf_100. macOS: strictImplementationUse eligible; readyToImplement NOT yet.**
- Windows: strictImplementationUse (dim6 not done; PassthroughAuditEntry 7 fields confirmed; RelayTestResult confirmed). NOT readyToImplement until Windows dim6 mapped.

---

## 10. relay_manager — macOS (consumerStartReady → **strictImplementationUse** after relay-mac-closeout-109) + Windows (**readyToImplement** per relay-closeout-109)

**dim1–5 status** (updated relay-mac-closeout-109):
- macOS: dim1=confirmed (Tauri commands invoke RelayManager methods), dim2=closed (17 functions all decompiled; sub-leaves: activate/bootstrap/compose_proxy_status/deactivate/delete/ensure_proxy_started/keychain_get_api_key/new/persist/rollback_router_enabled/set_codex_router_enabled/snapshot/storage_hydrate_secrets/storage_load/storage_save/sync_codex_config_with_outcome/upsert), dim3=closed (methods reach fs/keychain/serde/state leaves), dim4=**closed** (RelayProvider 15 fields confirmed via Windows independent gate; macOS layout 208 bytes / String fields at confirmed offsets; keychain confirmed at macOS Keychain Services; RelayState/RelayActiveByIde/RelayIde all confirmed), dim5=macOS confirmed.
- Windows: dim2=closed (13 leaves), dim3=closed, dim4=closed (keychain: CredentialManager + USER/USERNAME env + SHA256 derivation; CredMan error 0x8000000000000007→None confirmed; call chain codex_paths+776/+784 confirmed), dim5=Windows independent confirmed.

**dim6_basis** (updated): All 17 macOS relay_manager sub-leaves have pseudocode-manifest.jsonl in raw/ (activate through upsert). RelayProvider 15 fields promoted from inferred to confirmed via cross-platform corroboration (Windows IDA independently confirmed same 15 fields). keychain_get_api_key macOS: Keychain Services with provider_id as service name. Windows SHA256(USER+USERNAME+provider_id) derivation confirmed. ensure_proxy_started chain closes dim3 terminal to process spawn leaf.

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

**readyToImplement_verdict** (updated relay-mac-closeout-109):
- macOS: **Upgradeable to strictImplementationUse** — dim4 gap (RelayProvider layout inferred) CLOSED via Windows cross-platform confirmation. dim1-5 all now confirmed. dim6 closed. **readyToImplement eligible for most leaves. Remaining blocker for full_leaf_100: accepted_unknown on RelayManager constructor call sequence (not blocking strictImplementationUse). macOS: strictImplementationUse eligible; readyToImplement eligible for all 17 leaves where dim2+dim4 confirmed.**
- Windows: **readyToImplement** (dim1-6 all closed per relay-closeout-109 closure).

---

## 11. relay_proxy_server — macOS (consumerStartReady → **strictImplementationUse** after relay-mac-closeout-109) + Windows (**readyToImplement** per relay-closeout-109)

**dim1–5 status** (updated relay-mac-closeout-109):
- macOS: dim1=confirmed (internal; frontend triggers via relay state), dim2=closed (9 sub-leaf functions + 16 pseudocode), dim3=confirmed depth≥6, dim4=**CLOSED** (ProxyContext full struct layout confirmed via relay-closeout-109 supplement: 6 Arc fields at offsets [0,8,16,24,32,40] — [0]Arc<Runtime>,[8]Arc<Mutex<RelayState>>,[16]Arc<Mutex<RelayManager>>,[24]Arc<reqwest::Client>,[32]Arc<Mutex<PluginRegistry>>,[40]Arc<CodexPaths>; confirmed via drop_in_place<ProxyContext>@0x1002837b8; remaining accepted_unknown: stream_sse_body_to_ws vtable body), dim5=macOS confirmed.
- Windows: dim2=closed (9 leaves), dim3=closed (forward_with_candidates→reqwest chain), dim4=closed (relay_enabled offset +676, compact_allowed +677, state_machine_case +849, HTTP endpoints confirmed; ProxyContext layout confirmed via proxy_server_router_route_registrar_sys@0x140384E10 same 6-field layout), dim5=Windows independent confirmed.

**dim6_basis** (updated): ProxyContext dim4 gap CLOSED (relay-closeout-109 supplement: IDA comment at 0x1002837b8, idb_saved 2026-06-03). All 9 macOS proxy sub-leaves have confirmed decompile. Windows independently confirmed same 6-field ProxyContext layout. SSE buffer limits confirmed: 1MB SSE body / 8MB body limit. HTTP error codes and endpoint routes confirmed.

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

**dim6_status**: closed (macOS + Windows; ProxyContext dim4 CLOSED; vtable dispatch body is accepted_unknown documented; not blocking)

**readyToImplement_verdict** (updated relay-mac-closeout-109):
- macOS: **Upgradeable to strictImplementationUse** — ProxyContext dim4 gap CLOSED. dim1-5 all confirmed. dim6 closed. **readyToImplement eligible for all leaves except stream_sse_body_to_ws vtable body (accepted_unknown). macOS: strictImplementationUse eligible; readyToImplement eligible for 8/9 sub-leaf owners (vtable leaf = accepted_unknown, implement as trait dispatch).**
- Windows: **readyToImplement** (dim1-6 all closed per relay-closeout-109 closure).

---

## 12. relay_thread_migration — macOS (consumerStartReady → **strictImplementationUse** after relay-mac-closeout-109) + Windows (**readyToImplement** per relay-closeout-109)

**dim1–5 status** (updated relay-mac-closeout-109):
- macOS: dim1=confirmed (called from activate/set_codex_router_enabled), dim2=closed (7 functions confirmed; migrate_threads body truncated 42829 chars = accepted_unknown per RULE §0.5 — body too large for MCP server limit, not an IDA failure), dim3=confirmed depth≥5 (rusqlite/rayon/atomic_write/serde_json leaves), dim4=confirmed (ThreadRouterMigrationManifest 7 fields, ThreadRouterMigrationEntry 10 fields, 4 SQL UPDATE variants, error discriminants 10/9/2/3/8, scope="full"/"incremental", provider "subagent" skip confirmed), dim5=macOS confirmed.
- Windows: dim2=closed_evidence_md, dim3=closed, dim4=closed (replace_first_session_meta_line fully decompiled: atomic temp-rename pattern, PID+random temp name, mtime restore, error codes 8/9), dim5=Windows independent confirmed.

**dim6_basis** (updated): All 7 macOS functions confirmed. Truncated migrate_threads body is accepted_unknown (MCP server limit, not IDA failure). dim4 fully closed: manifest schema (7 fields), entry schema (10 fields), SQL variants, error discriminants, scope param, subagent skip — all confirmed. dim1 confirmed via call-site chain from activate/set_codex_router_enabled IPC commands. No blocking gaps remain for strictImplementationUse on macOS.

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

**dim6_status**: closed (macOS + Windows; migrate_threads truncated body = accepted_unknown; UTF-16 paths = not-automatable from source archive Rust side; both documented)

**readyToImplement_verdict** (updated relay-mac-closeout-109):
- macOS: **Upgradeable to strictImplementationUse** — migrate_threads truncation is accepted_unknown (not a gap requiring new IDA work; behavior implementable from manifest schema + SQL variants + error discriminants + scope logic, all confirmed). dim1-5 all confirmed. dim6 closed. **readyToImplement: eligible for 6/7 leaves (normalize/rollback/cleanup/write_manifest/error-discriminants/scope confirmed); migrate_threads full body = accepted_unknown → implement based on schema evidence; strictImplementationUse for that leaf. macOS overall: strictImplementationUse eligible; readyToImplement eligible for 6/7 sub-leaves; migrate_threads = strictImplementationUse ceiling.**
- Windows: **readyToImplement** (dim1-6 all closed per relay-closeout-109 closure).

---

## 13. relay_translator — macOS only (consumerStartReady → **strictImplementationUse** after relay-mac-closeout-109 IF tool_result mapping resolved; else BLOCKED at consumerStartReady)

**dim1–5 status** (updated relay-mac-closeout-109):
- macOS: dim1=confirmed (internal; invoked from proxy_server for stream format conversion), dim2=closed (14 functions all decompiled in intermediate/), dim3=confirmed depth≥6 (forward_to_openai → reqwest; serde-only fns accepted_unknown for depth<5), dim4=**partial** (OpenAI→Anthropic field mappings confirmed: role/user/content/thinking/text_delta; function_call/tool_result → Anthropic tool_use block mapping remains **blocks_start** — exact field names and nesting not decompiled from IDA; max_tokens handling = accepted_unknown; bge-host header = accepted_unknown), dim5=macOS confirmed / Windows not analyzed (separate scope).

**dim6_basis**: 14 functions decompiled. The dim4 blocks_start (function_call/tool_result mapping) is the field gap. All other dim4 confirmed. dim2/dim3 fully closed. tool_result→Anthropic mapping cannot be resolved from IDA evidence alone (inlined/obfuscated field construction) — Anthropic API spec is the authoritative source for this mapping, and source archive implementation should follow Anthropic tool_use block spec rather than replicate an unknown binary path.

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

**dim6_status**: partial — function_call/tool_result mapping is blocks_start; all other 13 leaves mapped; strict gate depends on product decision for tool_result

**readyToImplement_verdict** (updated relay-mac-closeout-109):
- macOS: **BLOCKED at consumerStartReady** unless product decision taken on tool_result mapping. Options: (A) declare tool_result mapping = product_decision (follow Anthropic API spec, not upstream binary) → dim4 becomes product_decision_accepted → strictImplementationUse eligible → then readyToImplement for tool_result-independent leaves. (B) resolve IDA mapping from intermediate/ decompile artifacts. **Current status: consumerStartReady; strictImplementationUse blocked by tool_result mapping dim4 gap unless product_decision accepted.** All 12 non-tool_result leaves → readyToImplement eligible once product_decision accepted for tool_result.
- Windows: not analyzed (separate scope). Not in scope for relay-mac-closeout-109.

---

## 14. relay_codex_writer (macOS additional) — see §7

No additional macOS-specific leaves beyond what §7 covers.

---

## 15. relay_image_compat — macOS (relay-image-compat-109) / Windows not-analyzed

> **Owner gate**: ALLOW — <workstation> / relay-image-compat-109 (same owner chain as bundle manifest: relay-missed-109 + relay-closeout-109). No takeover sensitive-field required. Gate exit=0 confirmed.

**dim1–5 status (macOS, from handoff-manifest + INTERFACE-MAP.md)**:
- dim1: N/A — relay-core internal submodule; no Tauri IPC command exposed directly (relay-core internal only); IPC commands `get_image_compat` / `set_image_compat` are in `commands::system`, not relay-core. dim1 = product_decision (internal), accepted per GATE-SPEC.
- dim2: closed — 7 leaves all decompiled/disasm-extracted (A/B tier): `image_compat_enabled` (A, 0x1001bf94c), `read_image_compat_enabled` (A, 0x1001bfdd4), `make_relay_model_info_image_branch` (A, 0x1001c0d1c), `forward_gate_call_site_v1` (B, 0x100099274), `forward_gate_call_site_v2` (B, 0x10024856c), `get_image_compat` (A, 0x10025e7c0), `set_image_compat` (A, 0x10025ee14).
- dim3: closed — call-tree depth ≥ 3 for all leaves: `image_compat_enabled` → OnceLock → Mutex → `read_image_compat_enabled` → `fs::read_to_string`; `forward_gate` → `image_compat_enabled` → `chat_body_has_image_url` → `strip_image_url_cloned`; `make_relay_model_info` → BTreeMap::insert (response_serialize leaf); `get_image_compat` → `CodexPaths::from_home` → `fs::read_to_string`; `set_image_compat` → `fs::write`.
- dim4: closed — DTO + behavior: config file field = `[feature]\nimage_generation = true` (note: `[feature]` not `[features]` in relay-core — relay-core's `read_image_compat_enabled` uses magic `[feature]` 9-byte header vs system's `[features]` 10-byte; the relay cache reads `image_generation = true` for enabled, system reads `image_generation = false` for compat-mode); IMAGE_COMPAT_CACHE global confirmed (OnceLock<Mutex>); v140 discriminant at `*(a2+206)` drives `supports_image_detail_original` + `web_search_tool_type`; forward gate state flags confirmed (`@+0x520` cleared on compat-disabled, `@+0x424` image_stripped flag).
- dim5: macOS confirmed (IDA arm64 binary 1db044e8efab); Windows not-analyzed (separate scope).

**dim6_basis**: 7 macOS leaves all with A/B-tier IDA evidence. `IMAGE_COMPAT_CACHE` OnceLock layout confirmed (9 global fields at 0x101390000–0x101390050). Relay-core config field is `image_generation = true` (relay enabled), while system IPC uses `image_generation = false` (compat mode) — these are **semantically inverse**: relay-core's `read_image_compat_enabled` returns `true` when the config says `image_generation = true`, while the system IPC `get_image_compat` returns `true` when `image_generation = false`. This divergence is confirmed by byte-level comparison of the two parsers. The `v140` discriminant (0/1/2) in `make_relay_model_info` is a field in the `RelayProvider`/`RelayModelInfo` struct at offset +206 — it is provider-configuration data, not read from `IMAGE_COMPAT_CACHE`. The forward gate reads `IMAGE_COMPAT_CACHE` (via `image_compat_enabled`) only to decide whether to strip image_url from the relay proxy request body.

**leaves** (macOS only; Windows pending-deep):

### Relay-Core Internal Leaves (no Tauri IPC)

- `image_compat_enabled` (0x1001bf94c, cache gate): Unit test — configure OnceLock uninitialized; supply config_path; assert first call reads file and caches result. Call again with same path/mtime; assert cache hit (file not re-read). Call with different mtime; assert cache invalidated and file re-read. [unit]
- `read_image_compat_enabled` (0x1001bfdd4, TOML reader): Unit test — supply config with `[feature]\nimage_generation = true`; assert true. Supply config with `[feature]\nimage_generation = false`; assert false. Supply config with no `[feature]` section; assert false. Supply non-existent path; assert false (IO error → false). Note: field section is `[feature]` (9 bytes, no `s`). [unit × 4]
- `make_relay_model_info_image_branch` (0x1001c0d1c, v140 discriminant):
  - Unit test — instantiate `RelayModelInfo` with v140=0 (text-only); call `make_relay_model_info`; assert `supports_image_detail_original = false`, no `web_search_tool_type` field, `context_window = 272000`, `max_context_window = 1000000`. [unit]
  - Unit test — v140=1 (standard image); assert `supports_image_detail_original = true`, `web_search_tool_type = "text_and_image"`, `context_window = 272000`, `max_context_window = 1000000`. [unit]
  - Unit test — v140=2 (high-image); assert `supports_image_detail_original = true`, `web_search_tool_type = "text_and_image"`, `context_window = 200000`, `max_context_window = 200000`. [unit]
  - Unit test — `default_reasoning_level = "medium"` (hardcoded); `visibility = "live"` (not "user" as stated in earlier evidence — INTERFACE-MAP.md confirms "live"); `shell_type = "shell_command"`. [unit]
- `forward_codex_responses_internal` image gate (call sites 0x100099274 + 0x10024856c):
  - Integration test — configure config.toml with `image_generation = false` (relay-disabled, i.e., compat=false in relay-core terms); send relay request with image_url in body; assert body forwarded unchanged (no strip), state flag @+0x520 cleared. [integration]
  - Integration test — configure config.toml with `image_generation = true` (relay-enabled, v140=1); send request with image_url; assert `strip_image_url_cloned` called, `image_stripped` flag @+0x424 = 1. [integration]
  - Integration test — config.toml with `image_generation = true`, v140=0 (text-only provider); send request with image_url; assert text-only path taken (CBZ branch), image NOT stripped (no capability). [integration]
  - Not-automatable: ICF fold (v2 at 0x10024856c is compiler-merged duplicate of v1); verify via integration test that both async state machine variants produce identical image-strip behavior. [manual-integration]
- `IMAGE_COMPAT_CACHE` OnceLock global (0x101390000): Not-automatable for exact memory layout — implement in source archive using `OnceLock<Mutex<ImageCompatCache>>` with fields: path (PathBuf), mtime_secs (u64), mtime_nanos (u32), enabled (bool). Verify via integration that concurrent relay calls do not race on cache update. [manual-integration + not-automatable for exact layout]

### System IPC Commands (commands::system — cross-reference, not relay-core)

- `get_image_compat` (0x10025e7c0) — see system acceptance mapping (ACCEPTANCE-MAPPING-109.md §3 in audits/macos-1.0.9-system/). dim6 already written there.
- `set_image_compat` (0x10025ee14) — see system acceptance mapping (§4). dim6 already written there.
- Cross-reference note: system IPC and relay-core cache use **opposite polarity** for the same TOML field:
  - system `get_image_compat` returns `true` when `image_generation = false` (compat mode = generation disabled)
  - relay-core `read_image_compat_enabled` returns `true` when `image_generation = true` (relay image path enabled)
  - source archive implementation must preserve this polarity difference; do NOT unify the boolean semantics.

### Accepted Unknowns

- `chat_body_has_image_url` VA and body: not decompiled this session — behavior inferred from gate disasm and string evidence `[AiMaMi] image_url rejected by upstream; retrying with text fallback`. Accepted_unknown (non-critical for source archive implementation: verify via E2E that relay proxy correctly strips image_url on retry). [not-automatable as standalone; verified via E2E]
- `strip_image_url_cloned` VA and body: not decompiled — behavior inferred (produces a body clone with image_url removed). Accepted_unknown (same rationale). [not-automatable as standalone]
- Windows-side equivalents: not analyzed. Windows image_compat behavior is independent; cannot be inferred from macOS. Mark `platformScopeDeclared = "macOS confirmed; Windows Unknown"`.

**dim6_status**: closed (macOS) — all 7 leaves mapped; chat_body_has_image_url + strip_image_url_cloned are accepted_unknown / not-automatable as standalone but covered by integration/E2E; Windows pending-deep.

**readyToImplement_verdict**:
- macOS: **Upgradeable to strictImplementationUse**. dim1=product_decision_accepted (relay-core internal); dim2=7 leaves closed (A/B); dim3=closed (call-tree depth≥3 all leaves); dim4=closed (cache layout, v140 discriminant, forward gate flags, TOML field polarity divergence); dim5=macOS confirmed; dim6=closed (all leaves mapped).
  - **readyToImplement**: NOT yet for full cluster — `chat_body_has_image_url` + `strip_image_url_cloned` are accepted_unknown (bodies not decompiled). The cache leaf + TOML reader + `make_relay_model_info` image branch + forward gate call-site disasm are individually readyToImplement-eligible. Overall cluster ceiling: **strictImplementationUse** (accepted_unknown on 2 helper bodies prevents full_leaf_100_definition_v2).
- Windows: NOT analyzed. `platformScopeDeclared = "macOS confirmed; Windows Unknown"`. Cannot upgrade Windows gate until Windows IDA evidence produced.

---

### Owner Gate (this update — relay-image-compat-109)

- **decision**: ALLOW / write_mode: owner
- **basis**: bundle manifest owner <workstation> (relay-missed-109 + relay-closeout-109); session relay-image-compat-109 is continuation on same machine
- **takeover_token**: not required (same machine, same owner chain)
- **gate**: PREWRITE_PRODUCER_COLLISION_GATE_V1 exit=0

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

## Dim6 Closure Summary — Per Cluster (Updated relay-mac-closeout-109)

| cluster | platform | current gate (after relay-mac-closeout-109) | dim6 status | readyToImplement eligible? |
|---|---|---|---|---|
| relay_translator_stream | macOS | **readyToImplement** (relay-closeout-109) | **closed** | **YES (macOS)** |
| relay_translator_stream | Windows | **readyToImplement** (relay-closeout-109) | dim6 missing for win | **YES (Windows, per REVERSE-STATUS.md)** |
| relay_web_executor | macOS + Windows | **readyToImplement** (relay-closeout-109) | **closed** | **YES (both platforms)** |
| relay_web_tools | macOS + Windows | **readyToImplement** (relay-closeout-109) | **closed** | **YES (both platforms)** |
| relay_breaker | macOS | **readyToImplement** (relay-closeout-109) | **closed** | **YES (macOS, 5/5 leaves)** |
| relay_breaker | Windows | **readyToImplement** (relay-closeout-109) | dim6 missing for win separate closure | **YES (Windows, per REVERSE-STATUS.md)** |
| relay_fetch_models | macOS | **strictImplementationUse** (relay-closeout-109 ICF fold) | partial (async = accepted_unknown ICF) | strictImplementationUse only; async terminal = accepted_unknown |
| relay_fetch_models | Windows | strictImplementationUse | partial (async accepted_unknown ICF) | YES for 10/12 non-async leaves |
| relay_models | macOS | **strictImplementationUse** (relay-mac-closeout-109 dim4 B-level) | **closed** | **YES — strictImplementationUse; readyToImplement blocked by dim2 partial (3 logic fns not full decompile)** |
| relay_models | Windows | **readyToImplement** (relay-closeout-109) | **closed** | **YES (Windows)** |
| relay_codex_writer | macOS | **strictImplementationUse** (relay-mac-closeout-109) | **closed** | **YES — eligible for TOML/export/migration/cleanup leaves; CodexPaths = accepted_unknown** |
| relay_codex_writer | Windows | strictImplementationUse | **closed** | YES for TOML rendering leaves (no pseudocode-manifest.jsonl) |
| relay_diagnostic | macOS | **strictImplementationUse** (relay-mac-closeout-109) | **closed** | **YES — fix_issue dispatch + confirmed leaves; run_diagnostics = accepted_unknown** |
| relay_diagnostic | Windows | strictImplementationUse | **closed** | YES for dispatch table + confirmed leaves |
| relay_health_audit | macOS | **strictImplementationUse** (relay-mac-closeout-109 RelayTestResult B-level) | **closed** | **YES — strictImplementationUse; readyToImplement blocked (timeout unknown; 2 PassthroughAuditEntry fields accepted_unknown)** |
| relay_health_audit | Windows | **strictImplementationUse** (relay-closeout-109 9/11 decompiled) | dim6 missing for win | strictImplementationUse; NOT readyToImplement (dim6 not done win) |
| relay_manager | macOS | **strictImplementationUse** (relay-mac-closeout-109 dim4 closed) | **closed** | **YES — readyToImplement eligible for all 17 sub-leaves; strictImplementationUse for constructor call sequence (accepted_unknown)** |
| relay_manager | Windows | **readyToImplement** (relay-closeout-109) | **closed** | **YES (Windows)** |
| relay_proxy_server | macOS | **strictImplementationUse** (relay-mac-closeout-109 ProxyContext CLOSED) | **closed** | **YES — readyToImplement eligible for 8/9 sub-leaves; vtable leaf = accepted_unknown** |
| relay_proxy_server | Windows | **readyToImplement** (relay-closeout-109) | **closed** | **YES (Windows)** |
| relay_thread_migration | macOS | **strictImplementationUse** (relay-mac-closeout-109) | **closed** | **YES — readyToImplement eligible for 6/7 sub-leaves; migrate_threads full body = accepted_unknown** |
| relay_thread_migration | Windows | **readyToImplement** (relay-closeout-109) | **closed** | **YES (Windows)** |
| relay_translator | macOS | **BLOCKED at consumerStartReady** (tool_result dim4 blocks_start unless product_decision) | partial | NO until tool_result product_decision or IDA resolution; non-tool_result leaves eligible |
| relay_image_compat | macOS | **strictImplementationUse** (relay-image-compat-109; dim1-6 closed) | **closed** | **YES — strictImplementationUse; readyToImplement for cache/TOML/make_relay_model_info/gate disasm leaves; chat_body_has_image_url + strip_image_url_cloned = accepted_unknown (no full_leaf_100)** |
| relay_image_compat | Windows | not-analyzed | dim6 not applicable | NO — Windows not-analyzed; platformScopeDeclared = macOS confirmed / Windows Unknown |

---

## Clusters Now at strictImplementationUse After relay-mac-closeout-109 (dim6 closed)

The following 7 mac clusters reached strictImplementationUse via dim2/dim4 closure + dim6 mapping in relay-mac-closeout-109:

1. **relay_codex_writer** (mac) — dim1=product_decision_accepted; dim2=24 fns closed; dim4=TOML markers + export schema confirmed; CodexPaths offsets = accepted_unknown. **strictImplementationUse. readyToImplement for TOML/export/migration/cleanup leaves.**
2. **relay_diagnostic** (mac) — dim1=IPC confirmed; dim2=10 VAs closed (run_diagnostics truncated=accepted_unknown); dim4=DTOs + 9 check kinds + fix dispatch confirmed. **strictImplementationUse. readyToImplement for fix_issue leaves.**
3. **relay_health_audit** (mac) — dim1=IPC confirmed; dim2=10 fns closed; dim4=RelayTestResult B-level + PassthroughAuditEntry 5/7 confirmed (2=accepted_unknown). **strictImplementationUse. readyToImplement blocked (timeout unknown + 2 fields).**
4. **relay_manager** (mac) — dim1=confirmed; dim2=17 fns closed; dim4=RelayProvider 15 fields + keychain chain confirmed (CodexPaths offsets cross-platform corroborated). **strictImplementationUse. readyToImplement for all 17 sub-leaves.**
5. **relay_proxy_server** (mac) — dim1=confirmed; dim2=9 fns + 16 pseudocode; dim4=ProxyContext 6-field CLOSED. **strictImplementationUse. readyToImplement for 8/9 sub-leaves (vtable=accepted_unknown).**
6. **relay_thread_migration** (mac) — dim1=confirmed; dim2=7 fns closed (migrate_threads truncated=accepted_unknown); dim4=manifest/entry schemas + SQL variants + error discriminants all confirmed. **strictImplementationUse. readyToImplement for 6/7 sub-leaves.**
7. **relay_models** (mac) — dim2=3 logic fns + 12 struct shapes; dim4=RelayTestResult B-level (5 fields). **strictImplementationUse. readyToImplement blocked by dim2 partial.**

**Cluster BLOCKED (remains consumerStartReady)**:
- **relay_translator** (mac): tool_result→Anthropic format mapping = blocks_start dim4. Cannot reach strictImplementationUse without product_decision or IDA resolution. Non-tool_result leaves eligible for readyToImplement individually.

**Clusters already promoted (unchanged this session)**:
- relay_translator_stream, relay_web_executor, relay_web_tools, relay_breaker (mac): **readyToImplement** (relay-closeout-109)
- relay_fetch_models (mac): **strictImplementationUse** (relay-closeout-109 ICF fold; async = accepted_unknown)

---

## relay-image-compat-109 Session Supplement

**Session**: <audit-session>

### dim6 Closures Written This Session (relay-image-compat-109)

| cluster | dim6 newly closed? | blockers resolved | gate after |
|---|---|---|---|
| relay_image_compat (mac) | YES | dim6 acceptance mapping written; accepted_unknown: chat_body_has_image_url + strip_image_url_cloned bodies | **strictImplementationUse** |

### Critical Finding — TOML field Polarity Divergence

The relay-core and system IPC use **opposite boolean semantics** for the same TOML field (`image_generation`):

| Component | Config value | Returns |
|---|---|---|
| system `get_image_compat` | `image_generation = false` | `true` (compat enabled = image generation disabled) |
| relay-core `read_image_compat_enabled` | `image_generation = true` | `true` (relay image path enabled) |

source archive implementation MUST preserve this polarity difference. These are not bugs; they reflect different semantic contexts of the same config file.

### readyToImplement Eligibility After relay-image-compat-109

- **relay_image_compat (mac)**: strictImplementationUse — readyToImplement for individual leaves (cache, TOML reader, make_relay_model_info image branch, forward gate call-site). Full cluster readyToImplement blocked by accepted_unknown (chat_body_has_image_url + strip_image_url_cloned bodies not decompiled).
- **relay_image_compat (Windows)**: not-analyzed — no gate.

---

## relay-mac-closeout-109 Session Supplement

**Session**: <audit-session>

### dim6 Closures Written This Session

| cluster | dim6 newly closed? | blockers resolved | gate after |
|---|---|---|---|
| relay_codex_writer (mac) | YES | CodexPaths offsets reclassified accepted_unknown | strictImplementationUse |
| relay_diagnostic (mac) | YES | run_diagnostics truncation reclassified accepted_unknown | strictImplementationUse |
| relay_health_audit (mac) | YES | RelayTestResult D→B (relay-closeout-109 supplement) | strictImplementationUse |
| relay_manager (mac) | YES | RelayProvider offsets confirmed cross-platform | strictImplementationUse |
| relay_proxy_server (mac) | YES | ProxyContext CLOSED (relay-closeout-109 supplement) | strictImplementationUse |
| relay_thread_migration (mac) | YES | migrate_threads truncation reclassified accepted_unknown | strictImplementationUse |
| relay_models (mac) | YES (updated) | RelayTestResult D→B; dim4 now B-level | strictImplementationUse (dim2 partial blocks readyToImplement) |
| relay_translator (mac) | NO | tool_result mapping remains blocks_start | consumerStartReady (BLOCKED) |

### Owner Gate (this update)

- **decision**: ALLOW / write_mode: owner
- **basis**: bundle manifest owner <workstation> (relay-missed-109 + relay-closeout-109); session relay-mac-closeout-109 is continuation
- **takeover_token**: not required (same machine, same owner chain)
- **gate**: PREWRITE_PRODUCER_COLLISION_GATE_V1 passed — gate output exit=0

---

---

## relay-transport-closeout-109 Session Supplement — Windows Strict Cluster dim6 + Transport Sub-Cluster dim6

**Session**: <audit-session>
**Owner gate**: ALLOW / write_mode=owner (bundle manifest owner <workstation>; same owner chain)
**Note**: No new IDA work performed. All acceptance conditions derived from existing gate-report cluster evidence (relay-missed-109 + relay-closeout-109 + relay-mac-closeout-109 + relay-image-compat-109).

---

## Part A: Windows-side dim6 for strictImplementationUse clusters (relay-transport-closeout-109)

The following Windows clusters have dim1-5 closed (strictImplementationUse) but dim6 missing. Their acceptance conditions mirror the macOS §§ above, with Windows-specific notes where platform behavior diverges.

### W1. relay_codex_writer — Windows (strictImplementationUse; dim6 closes here)

**dim6_basis**: Same leaf set as macOS §7 (TOML block markers, atomic write, provider kind encoding, block migration, export schema, orphan cleanup). Windows IDA independently confirmed: TOML block markers (6 exact literal bytes), provider_kind encoding (0=stdio/1=http/2=sse), relay_atomic_write_file_sys@0x140332540, managed_block_migration_core_sys@0x1401D6FE0→toml_block_renderer_core_sys@0x1401D37B0→relay_toml_section_writer_atomic_sys@0x1403C3140. pseudocode-manifest.jsonl confirmed at intermediate/ (relay-mac-closeout-109). CodexPaths[+56/+64]=config_toml, [+584/+592]=backup_dir confirmed via macOS cross-decompile.

**leaves** (Windows; same acceptance as macOS §7 unless noted):
- `apply_codex_state` equivalent: E2E test — call relay upsert + persist; assert config.toml written with correct aimami-relay managed blocks. [e2e]
- TOML block markers (6 markers, exact literals including `"# >>> aimami-relay codex-router top start (DO NOT EDIT MANUALLY)"` + `router_enabled` field + `false`/`true` literals at 0x141263C8A/0x141263C8F): Unit test — assert output contains all 6 exact marker strings. [unit]
- `relay_atomic_write_file_sys` (Windows 0x140332540): Unit test — write to temp then rename; assert atomic: no partial write visible. [unit]
- `managed_block_migration_core_sys` → `toml_block_renderer_core_sys` → `relay_toml_section_writer_atomic_sys` chain: Integration test — supply existing config.toml with block; assert block replaced not duplicated. [integration]
- Provider kind byte encoding (0=stdio/1=http/2=sse): Unit test — same as macOS. [unit]
- TOML field dispatch (len-based switch same pattern): Unit test — same as macOS. [unit]
- `relay_startup_cleanup_orphan_provider`: Unit test — supply config with orphan; assert removed; "openai" kept. [unit]
- `relay_export_file` / `RelayExportFile` schema: Unit test — same as macOS. [unit]
- CodexPaths[+56/+64] config_toml / [+584/+592] backup_dir: Not-automatable — implement via CodexPaths struct fields; verify integration. [manual-integration]
- Windows SIMD hashmap (40-byte entries): Not-automatable — implement using std HashMap. [not-automatable]
- Import/export round-trip: E2E — same as macOS. [e2e]

**dim6_status**: closed (Windows; CodexPaths and SIMD hashmap documented not-automatable)

**readyToImplement_verdict (Windows)**: **Upgradeable to readyToImplement** — dim1-5 all closed; dim4=closed (relay-mac-closeout-109 pseudocode-manifest.jsonl confirmed); dim6=now closed. All leaf acceptance conditions mapped. **Windows relay_codex_writer: readyToImplement eligible.**

---

### W2. relay_diagnostic — Windows (strictImplementationUse; dim6 closes here)

**dim6_basis**: Same leaf set as macOS §8. Windows IDA independently confirmed: all 7 engine checks enumerated (relay-mac-closeout-109 cross-platform confirmation); fix_codex_router_issue dispatch table 8 itemIds fully recovered via pseudocode-manifest.jsonl at intermediate/; Codex process kill chain confirmed (process name scan → quit 8s timeout → fallback kill). relay_diagnostic_engine_core_sys 53KB body accepted_unknown per macOS parallel evidence.

**leaves** (Windows; same acceptance as macOS §8):
- `run_codex_router_diagnostics` IPC entry: E2E test — call IPC; assert DiagnosticsItem array returned with issue_kind/status/details. [e2e]
- `fix_codex_router_issue` IPC entry: E2E — call with itemId="config_stale"; assert config fixed. [e2e]
- `fix_codex_router_issue` dispatch table (8 itemIds): Unit test per itemId — same as macOS §8. [unit × 8]
- SIMD length-bucketed dispatch (len=18: config_toml_syntax vs config_third_party): Unit test — same as macOS. [unit]
- `relay_diagnostic_engine_core_sys` 53KB body (accepted_unknown): Manual acceptance — implement 9 check kinds from string evidence + macOS parallel; verify all 9 in output array. [manual]
- Codex process kill chain (kill with 8s timeout, Windows): Unit test with mock process — assert kill with timeout. [unit]
- `relay_startup_cleanup_orphan_provider` ("openai" hard-exclusion): Unit test — same as macOS. [unit]
- `is_known_placeholder_token` / `is_known_or_builtin` whitelists: Product decision — implement as configurable list. [product_decision]

**dim6_status**: closed (Windows; engine body accepted_unknown; whitelists = product_decision)

**readyToImplement_verdict (Windows)**: **Upgradeable to readyToImplement** for fix_issue dispatch + confirmed leaf functions. engine body = accepted_unknown ceiling. **Windows relay_diagnostic: readyToImplement eligible for 6/7 leaves; engine body = accepted_unknown → strictImplementationUse ceiling for that leaf.**

---

### W3. relay_health_audit — Windows (strictImplementationUse; dim6 closes here)

**dim6_basis**: Same leaf set as macOS §9 with field Windows-specific additions. Windows IDA (relay-closeout-109) confirmed: 9/11 leaves decompiled; PassthroughAuditEntry 7 fields ALL CONFIRMED (at/model/endpoint/body_bytes/input_types/status/rewritten_to at confirmed offsets); RelayTestResult 4-field shape confirmed (modelsSample@+0/errorMessage@+24/latencyMs@+48/ok@+56); health_check_response_parser_sys renamed; passthrough_audit_jsonl_append_sys confirmed (fire-and-forget, CloseHandle, 1MB guard); wire API selector *(v14+205) byte distinguishes Anthropic vs OpenAI. 2 leaves (build_test_request_shared, apply_extra_headers_variant_b) deferred as ICF near-dup: accepted_unknown.

**leaves** (Windows-specific additions and overrides vs macOS §9):
- `test_relay_provider` IPC → health check pipeline: E2E test — call IPC with provider_id; assert RelayTestResult {ok, modelsSample, errorMessage, latencyMs} returned. [e2e]
- `get_passthrough_audit_log` IPC → passthrough audit: E2E — call with limit=50 (default); assert PassthroughAuditEntry array with 7 fields returned. [e2e]
- `health_check_test_provider_async_core_sys` VA 0x140825280 (orchestrator): Integration test — trigger health check; assert full pipeline: build_headers → HTTP POST → parse response → RelayTestResult assembled. [integration]
- `health_check_response_parser_sys` VA 0x140118B90: Unit test — 2xx → assert positive healthScore; non-2xx → assert Err; sentinel 0x8000000000000000 → assert not-found. [unit]
- `interpret_response_async_core_sys` VA 0x140827E40 (state machine 0-5): Integration test — drive state machine through all 5 states; assert healthScore extracted from JSON field. [integration]
- `passthrough_audit_entry_serializer_sys` VA 0x14042E340: Unit test — construct PassthroughAuditEntry with 7 fields; assert serialized with all field names and offsets correct. [unit]
- `passthrough_audit_jsonl_append_sys` VA 0x14042D9E0: Unit test — call append; assert JSONL file written (fire-and-forget); assert 1MB guard: file exceeds 1MB → assert entry NOT appended (rotation/discard behavior). [unit]
- `PassthroughAuditEntry` 7 fields (ALL confirmed on Windows): Unit test — deserialize JSON with all 7 fields (at/model/endpoint/body_bytes/input_types/status/rewritten_to); assert all populated at confirmed offsets. [unit]
- `RelayTestResult` 4 fields (B-confirmed cross-platform): Unit test — assert struct has exactly 4 fields: modelsSample: Vec<String>, errorMessage: Option<String>, latencyMs: i64, ok: bool; deserialization round-trip. [unit]
- Wire API selector *(v14+205): Not-automatable — implement as enum discriminant on provider type; verify via integration that Anthropic vs OpenAI routing is correct. [not-automatable]
- `build_test_request_shared` / `apply_extra_headers_variant_b` (ICF near-dup, accepted_unknown): Not-automatable — verify via integration test that request headers correctly built. [manual-integration]

**dim6_status**: closed (Windows — all 9 decompiled leaves mapped; 2 ICF near-dup leaves accepted_unknown / not-automatable)

**readyToImplement_verdict (Windows)**: **NOT readyToImplement** — 2 accepted_unknown leaves prevent full_leaf_100_definition_v2. **Windows relay_health_audit remains strictImplementationUse.** All 9 decompiled leaf acceptance conditions closed; implementation can proceed at strictImplementationUse.

---

### W4. relay_fetch_models — Windows (strictImplementationUse; dim6 closes here for 10/12 leaves)

**dim6_basis**: Same utility leaf set as macOS §6. Windows IDA (relay-missed-109) confirmed 10/12 leaves; 2 async leaves (fetch_async/fetch_openai_async) = ICF-merged accepted_unknown. HTTP terminal inferred from reqwest chain. keychain_get_api_key VA 0x140571180 = relay_manager dual-use VA. Cross-platform keychain divergence: macOS Keychain Services vs Windows CredentialManager.

**leaves** (Windows; same as macOS §6 except fetch_async/fetch_openai_async have different status):
- `parse_model_ids` / `relay_fetch_models_parse_model_ids`: Unit test — same as macOS. [unit]
- `sanitize_api_key`: Unit test — same as macOS. [unit]
- `is_transient_error`: Unit test — HTTP 429 → transient=true; HTTP 400 → false; HTTP 503 → true. [unit]
- `parse_extra_headers`: Unit test — "K1:V1\nK2:V2" → Vec<(String,String)> with 2 entries. [unit]
- `build_url` / `relay_fetch_models_build_url_normalize`: Unit test — same as macOS. [unit]
- `relay_fetch_models_strip_v1_suffix`: Unit test — same as macOS. [unit]
- `apply_extra_headers_openai` VA 0x14010EFC0: Unit test — same as macOS. [unit]
- `build_openai_headers_authorization` VA 0x1401AD5A0: Unit test — same as macOS. [unit]
- `classify_error`: Unit test — same as macOS. [unit]
- `keychain_get_api_key` VA 0x140571180 (Windows CredentialManager): Integration test — store field in CredentialManager; call fn; assert retrieved. [integration]
- `fetch_async` / `fetch_openai_async` (Windows, ICF-merged accepted_unknown): Manual acceptance — verify via integration test that relay model fetch populates RelayProvider.modelsSample from API response. Terminal HTTP transport behavior accepted as ICF-unknown. [manual-integration]
- Cross-platform keychain divergence (macOS Keychain vs Windows CredMan): Manual acceptance — document separate implementations; test independently on each platform. [manual]

**dim6_status**: closed for 10 utility leaves; fetch_async/fetch_openai_async Windows = accepted_unknown/manual-integration (not pending-deep, since IDA MCP was available for Windows even if terminal is ICF-blocked)

**readyToImplement_verdict (Windows)**: **10/12 leaves eligible for readyToImplement** (utility leaves all closed). Async leaves = accepted_unknown/manual-integration → strictImplementationUse ceiling for those 2. **Windows relay_fetch_models: strictImplementationUse overall (accepted_unknown on 2 async leaves prevents full_leaf_100).**

---

### W5. relay_translator — Windows (strictImplementationUse; dim6 closes here)

**dim6_basis**: Windows IDA (relay-mac-closeout-109) confirmed 15 leaves. tool_result/tool_use/tool_choice mapping CLOSED via convert_anthropic_message_to_openai_chat_sys@0x140214FD0 (A-level decompile) — this resolves the macOS §13 blocks_start gap. tool_call_id/function/arguments keys confirmed. stream_codex_responses_translator_dispatch_sys@0x140134DC0 + anthropic_request_to_openai_chat_request_sys@0x14020A900 named. relay_translator_extract_text_field_sys@0x140125E10 + relay_translator_convert_tools_array_sys@0x14009BD60 confirmed. call-tree depth=5. dim5 Windows independent.

**leaves** (Windows; resolves macOS §13 tool_result gap):
- `stream_codex_responses_translator_dispatch_sys` VA 0x140134DC0: Integration test — send Anthropic-format request via relay; assert dispatch routes to correct translator based on provider type. [integration]
- `anthropic_request_to_openai_chat_request_sys` VA 0x14020A900: Unit test — supply Anthropic request; assert converted to OpenAI chat completion format with correct role/content/model fields. [unit]
- `convert_anthropic_message_to_openai_chat_sys` VA 0x140214FD0 (tool_result/tool_use/tool_choice CONFIRMED): Unit test — supply tool_use block; assert converted to tool_calls with tool_call_id/function/arguments. Supply tool_result; assert converted to tool role message. Supply tool_choice=auto/any/tool; assert correct OpenAI tool_choice value. [unit × 3]
- `relay_translator_extract_text_field_sys` VA 0x140125E10: Unit test — supply message with text content; assert text extracted. [unit]
- `relay_translator_convert_tools_array_sys` VA 0x14009BD60: Unit test — supply Anthropic tools array; assert converted to OpenAI tools format. [unit]
- `responses_to_anthropic_request` / `anthropic_to_responses` (equivalent): Unit test — supply OpenAI Responses API request; assert Anthropic-format request produced. [unit]
- `chat_to_responses` / `responses_to_chat`: Unit test — supply chat completion format; assert Responses API format. [unit]
- `forward_to_openai` equivalent: Integration test — mock upstream OpenAI; assert request forwarded with correct auth headers. [integration]
- `build_passthrough_request_headers`: Unit test — supply provider config; assert headers assembled (auth + content-type). [unit]
- `is_bearer_likely_missing`: Unit test — same as macOS. [unit]
- `strip_billing_header`: Unit test — same as macOS. [unit]
- tool_choice mapping (any→required, tool→function): Unit test — confirmed closed; assert exact string mapping. [unit]
- max_tokens from max_completion_tokens fallback: Unit test — supply request without max_tokens but with max_completion_tokens; assert max_tokens populated. [unit]
- bge-host header routing: Manual-integration — verify header present/absent doesn't cause routing failure. [manual-integration]
- Stream format conversion (call relay_translator_stream): E2E — same as macOS. [e2e] (see §1)

**dim6_status**: closed (Windows — tool_result/tool_choice gap RESOLVED on Windows; all 15 leaves mapped)

**readyToImplement_verdict (Windows)**: **tool_result mapping CLOSED on Windows** — this is the critical gap that blocked macOS §13 from reaching strictImplementationUse. Windows dim1-5 all closed; dim6 now closed for all 15 leaves. **Windows relay_translator: readyToImplement eligible** (dim6 fully closed; no blocks_start; max_tokens/bge-host = accepted_unknown / manual-integration, non-blocking). Conditional: implementation must follow confirmed Windows tool_result mapping (tool_call_id/function/arguments keys), not inferred macOS path.

---

### W6. relay_image_compat — Windows (strictImplementationUse; dim6 closes here)

**dim6_basis**: Windows IDA (relay-image-compat-109) confirmed 9 functions. set_handler@0x14027A1B0; set_impl@0x1400A5EB0 (byteswap field detect; 3 insertion paths; `image_generation` 16-byte SSE prefix match xmmword_141257E10); read_config_toml@0x1400A55F0 (SSE prefix + 'false' check); build_ok_bool_response@0x1404391D0 (shared builder); get_handler@0x1402779B0; get_core_impl@0x1400A7040; relay_image_support_capability_descriptor_sys@0x140599610; relay_image_support_tool_pair_builder_sys@0x1405999D0; forward gate BEHAVIORAL via sub_140108C80 in stream_codex_responses_native_sys@0x14012AE30. Windows [features] section = 10-byte match (includes 's' — same field `image_generation = false`; Windows returns `true` when absent or not false, matching macOS polarity).

**leaves** (Windows-specific):
- `relay_image_compat_set_handler_sys` VA 0x14027A1B0: E2E test — call `set_image_compat` IPC with {enabled:true}; assert config.toml [features] section written with `image_generation = false` absent (enabled=true means generation NOT disabled in Windows semantics). Verify CoreEnvelope{ok:{enabled:bool}} returned. [e2e]
- `relay_image_compat_set_impl_sys` VA 0x1400A5EB0 (byteswap SSE field detection, 3 insertion paths): Unit test — supply config without [features]; assert [features]\nimage_generation = false written. Supply config with existing value; assert updated in place. Supply config with image_generation absent; assert added. [unit × 3]
- `relay_image_compat_read_config_toml_sys` VA 0x1400A55F0 (SSE 16-byte prefix + 'false' check): Unit test — supply config with `[features]\nimage_generation = false`; assert returns false (compat enabled = relay disabled). Supply with `image_generation = true` or absent; assert returns true. [unit × 2]
- `relay_image_compat_build_ok_bool_response_sys` VA 0x1404391D0 (shared builder): Unit test — call with enabled=true; assert CoreEnvelope{ok:{enabled:true}} JSON. Verify shared with set_enabled + update_plugin_config paths. [unit]
- `relay_image_compat_get_handler_sys` VA 0x1402779B0: E2E test — call `get_image_compat` IPC; assert CoreEnvelope{ok:{enabled:bool}} returned matching config state. [e2e]
- `relay_image_compat_get_core_impl_sys` VA 0x1400A7040 (alternate read path from reset_codex_config): Integration test — trigger reset_codex_config handler; assert image_compat state read via this alternate path. [integration]
- `relay_image_support_capability_descriptor_sys` VA 0x140599610: Unit test — call descriptor builder; assert {id:'image-support', name:'Image Support', description:194B, version:'1.0.0', category:'relay', enabled:true}. [unit]
- `relay_image_support_tool_pair_builder_sys` VA 0x1405999D0 (304-byte alloc; pairs fetch+image-support): Unit test — call pair builder; assert both fetch descriptor and image-support descriptor returned as pair (each 152B). [unit]
- Windows forward gate (BEHAVIORAL rejection in stream_codex_responses_native_sys@0x14012AE30): Integration test — configure relay with image_compat enabled; send request with image_url in body; assert [AiMaMi] retry-with-text-fallback behavior triggered at 0x14012C3C0; assert retry via sub_140143840. Verify precondition: [rsi+388h] < 3 AND [rsi+0CEh] != 1. [integration]
- `sub_140108C80('image_url', 9)` body (accepted_unknown — behavioral check only): Not-automatable for internal body — verify via integration that image_url in response body triggers retry path. [manual-integration]
- Windows config.toml polarity (same as macOS: [features]\nimage_generation = false = relay DISABLED): Unit test — assert implementation uses Windows [features] 10-byte header detection (including 's'); assert polarity matches macOS semantics. [unit]
- `relay_models_error_hint_sys` VA 0x140431D00 (error classifier checking 'image generation'/'image_generation'): Unit test — supply error string with "image generation"; assert hint returned. [unit]

**dim6_status**: closed (Windows — all 9 leaves mapped; sub_140108C80 body accepted_unknown / behavioral-only)

**readyToImplement_verdict (Windows)**: **NOT readyToImplement** — sub_140108C80 body not decompiled (behavioral-only evidence) prevents full_leaf_100. **Windows relay_image_compat: strictImplementationUse** (dim1-5 + dim6 closed; accepted_unknown on forward-gate internal body). Implementation can proceed at strictImplementationUse.

---

## Part B: relay-transport-closeout-109 Transport Sub-Clusters — dim6 Acceptance Mapping

**Note on transport sub-clusters**: These sub-clusters (relay_forward_chain, relay_sse, relay_ws_handlers, relay_passthrough_helpers, relay_proxy_config) are sub-layers within existing relay-core clusters (primarily relay_proxy_server and relay_health_audit). They do not create new canonical bundle directories — their acceptance conditions are appended here as sub-cluster sections within the overall relay-core dim6 mapping. gate decisions for these sub-clusters are sub-cluster verdicts within the parent cluster gate.

### T1. relay_forward_chain — cross (sub-layer within relay_proxy_server)

**dim6_basis**: relay_proxy_server dim1-5 confirmed on both platforms (§11 macOS + windows gate-report readyToImplement). relay_forward_chain covers the dispatch chain: `forward_to_provider` → `try_relay_forward` → circuit-breaker → passthrough fallback. macOS evidence: `forward_with_candidates` (circuit-breaker integration) confirmed. Windows evidence: `forward_with_candidates` ICF-inlined accepted_unknown; endpoint confirmed.

**dim1-5 sub-cluster status (both platforms)**:
- dim2: macOS = `forward_codex_responses_internal` + `try_pass_through` + `record_codex_route` + `forward_with_candidates` confirmed; Windows = `try_pass_through_sys` + `record_codex_route_sys` confirmed; `forward_with_candidates` accepted_unknown (ICF-inlined)
- dim3: macOS = depth≥6 (proxy_server→forward→breaker→reqwest); Windows = `forward_with_candidates→reqwest` accepted_unknown
- dim4: forward chain DTO = route field (aimami_relay_ 13-byte prefix stripping), passthrough headers (x-aimami-route, openai-passthrough), circuit-breaker integration
- dim5: both platforms confirmed

**leaves** (cross-platform):
- `forward_codex_responses_internal` / `forward_codex_router_responses_internal` (macOS): Integration test — mock upstream; assert SSE→WS forwarding path triggered. Assert passthrough header `x-aimami-route` present in response. [integration]
- `try_pass_through` / `try_pass_through_sys` (win): Integration test — enable passthrough; assert headers `x-aimami-route` + `openai-passthrough` added to response. [integration]
- `record_codex_route` / `record_codex_route_sys` (win VA in relay_proxy_server): Unit test — supply route field `"aimami_relay_<suffix>"`; assert 13-byte `"aimami_relay_"` prefix stripped; assert route suffix returned. [unit]
- `forward_with_candidates` + circuit-breaker integration (macOS confirmed): Integration test — inject one failing provider; assert breaker opens; assert request falls back to next provider. Assert circuit-breaker state (BreakerState) updated after failure. [integration]
- `forward_with_candidates` (Windows, accepted_unknown ICF): Not-automatable for internals — verify via E2E that relay proxy correctly falls back on provider failure. [e2e]
- Cross-platform forward chain equivalence: E2E — send request to both macOS and Windows relay proxies; assert same response structure returned. [e2e]
- Passthrough header verification (`x-aimami-route` = route suffix string): Integration test — inspect relay response; assert `x-aimami-route` header contains provider route suffix (not "aimami_relay_" prefix). [integration]

**dim6_status**: closed (macOS fully mapped; Windows ICF leaf documented not-automatable)

**sub-cluster verdict**:
- macOS: **readyToImplement eligible** — all forward chain leaves mapped; forward_with_candidates dim2 confirmed; dim6 closed.
- Windows: **strictImplementationUse** — forward_with_candidates ICF-inlined accepted_unknown prevents full_leaf_100.

---

### T2. relay_sse — cross (sub-layer within relay_proxy_server)

**dim6_basis**: `stream_sse_body_to_ws` vtable dispatch was noted as accepted_unknown in relay-mac-closeout-109 (§11). macOS: vtable body not decompiled; only confirmed that dispatch happens at vtable offset. Windows: SSE streaming path confirmed via relay_proxy_server dim4 evidence. SSE buffer limits: macOS 1MB SSE body / 8MB body limit confirmed. Windows: `relay_enabled` flag +676, `compact_allowed` +677 confirmed.

**dim1-5 sub-cluster status**:
- dim2: macOS = vtable dispatch confirmed as call site; body not decompiled (accepted_unknown); Windows = SSE path confirmed via proxy_server evidence
- dim4: SSE headers (text/event-stream, no-cache, X-Accel-Buffering:no); 1MB/8MB limits (macOS); relay_enabled/compact_allowed flags (Windows)
- dim5: both platforms confirmed

**leaves** (cross-platform):
- SSE streaming path (`stream_sse_body_to_ws` vtable dispatch, macOS): E2E test — connect WebSocket to /codex/router/v1/responses; send request requiring SSE streaming; assert streamed response received in correct SSE format. [e2e]
- SSE response headers (text/event-stream, no-cache, X-Accel-Buffering:no): Integration test — assert response headers match exact strings. [integration]
- SSE body size limit (macOS 1MB SSE / 8MB body): Integration test — send response near 1MB SSE limit; assert truncation or error at boundary without panic. [integration]
- `relay_enabled` flag (+676 Windows): Unit test — set relay disabled; assert 503 `router.disabled` returned before any SSE streaming initiated. [unit]
- `compact_allowed` flag (+677 Windows): Unit test — set compact=false; send request to compact endpoint; assert 400/403 or redirect returned. [unit]
- SSE→WS bridge correctness: Integration test — verify that SSE events from upstream are correctly repackaged as WebSocket messages to Codex client. [integration]
- vtable dispatch body (accepted_unknown): Not-automatable for vtable internals — verify via E2E that all SSE event types (data, event, id, retry) correctly relayed. [not-automatable]

**dim6_status**: closed (both platforms; vtable body = accepted_unknown / not-automatable, documented)

**sub-cluster verdict**:
- macOS: **strictImplementationUse** — vtable body accepted_unknown prevents full_leaf_100; all behavioral SSE conditions mapped.
- Windows: **strictImplementationUse** — same pattern; relay_enabled/compact flags dim6 closed.

---

### T3. relay_ws_handlers — cross (sub-layer within relay_proxy_server; featureA branch)

**dim6_basis**: `handle_codex_by_provider_ws` VA 0x100095390 partially closed in relay-mac-closeout-109 (macOS). This is the NEW handler for WebSocket routing. `handle_codex_active_ws` confirmed as primary WS entry. featureA branch: not decompiled (unknown VA / ICF); treat as accepted_unknown. Windows: `handle_codex_router_ws_core_sys` confirmed (relay-missed-109).

**dim1-5 sub-cluster status**:
- dim2: macOS = handle_codex_active_ws + handle_codex_router_ws + handle_codex_by_provider_ws@0x100095390 (NEW handler); Windows = handle_codex_router_ws_core_sys + handle_codex_router_ws (9 leaves confirmed)
- dim3: WS handler → SSE forwarding → provider routing depth≥4
- dim4: WebSocket endpoints (/codex/router/v1/responses, /codex/router/v1/responses/compact, /v1/health); router types (active, compact, provider)
- featureA: accepted_unknown (not decompiled on either platform)

**leaves** (cross-platform):
- `handle_codex_active_ws` / `handle_codex_router_ws_core_sys` (primary entry): E2E test — connect WebSocket to /codex/router/v1/responses; assert relay-proxied response returned. Assert request forwarded to active provider. [e2e]
- `handle_codex_router_ws` (compact variant): E2E — connect to /codex/router/v1/responses/compact; assert compact path taken (compact_allowed flag checked). [e2e]
- `handle_codex_by_provider_ws` VA 0x100095390 (macOS NEW handler): Integration test — send request specifying provider; assert provider-specific WS handler invoked. [integration]
- `build_upstream_headers` / `build_upstream_url_and_headers_sys` (win): Unit test — supply relay config; assert upstream URL constructed for normal variant (chatgpt.com/backend-api/codex/responses) and compact variant. [unit]
- /codex/router/v1/health endpoint (HTTP only): Unit test — call health endpoint; assert 200 OK returned. [unit]
- WebSocket HTTP error codes (400/403/404/500/503): Unit test — trigger each condition; assert correct HTTP status and error field (router.missing_model etc.). [unit × 5]
- featureA branch (accepted_unknown, both platforms): Not-automatable — if featureA is triggered by a specific header or parameter, document as product_decision; verify via E2E that relay operates correctly when featureA is not triggered. [manual + product_decision]
- `pick_codex_by_provider` VA 0x100243e78 (macOS): Unit test — supply multiple providers; assert correct provider selected for given request. [unit]
- Cross-platform WS handler equivalence: E2E — assert identical request/response structure on macOS and Windows relay proxies for same input. [e2e]

**dim6_status**: closed (both platforms; featureA = accepted_unknown / product_decision, documented)

**sub-cluster verdict**:
- macOS: **strictImplementationUse** — handle_codex_by_provider_ws partially closed; featureA accepted_unknown.
- Windows: **readyToImplement eligible** — all 9 confirmed WS handler leaves mapped; featureA = product_decision accepted.

---

### T4. relay_passthrough_helpers — cross (sub-layer within relay_health_audit)

**dim6_basis**: Passthrough audit support chain within relay_health_audit. `passthrough_audit` internal 4 functions confirmed macOS (relay-missed-109). Windows: `passthrough_audit_jsonl_append_sys` VA 0x14042D9E0 confirmed (fire-and-forget, CloseHandle, 1MB guard); `passthrough_audit_entry_serializer_sys` VA 0x14042E340 confirmed (7-field). PassthroughAuditEntry 7 fields ALL CONFIRMED cross-platform. append behavior: fire-and-forget (errors logged, not propagated).

**dim1-5 sub-cluster status**:
- dim2: macOS = 4 passthrough audit functions confirmed; Windows = 2 field VAs confirmed (serializer + appender)
- dim3: passthrough audit chain: entry creation → serialization → JSONL append → CloseHandle
- dim4: PassthroughAuditEntry 7 fields {at/model/endpoint/body_bytes/input_types/status/rewritten_to}; fire-and-forget error model; 1MB guard
- dim5: both platforms confirmed

**leaves** (cross-platform):
- `passthrough_audit` internal (macOS, 4 functions): Unit test — write audit entry; call passthrough_audit; assert entry returned with 7 confirmed fields. [unit]
- `passthrough_audit_entry_serializer_sys` VA 0x14042E340 (Windows): Unit test — construct PassthroughAuditEntry with 7 fields; assert serialized correctly with all field names at confirmed offsets. [unit]
- `passthrough_audit_jsonl_append_sys` VA 0x14042D9E0 (Windows): Unit test — call append; assert JSONL file appended; simulate CloseHandle; assert no panic on error. [unit]
- 1MB file guard (Windows): Unit test — supply audit log file exceeding 1MB; call append; assert new entry NOT appended (guard triggered). [unit]
- Fire-and-forget error model: Unit test — simulate JSONL file write failure; assert error logged but NOT propagated to caller (Ok(()) returned). [unit]
- `get_passthrough_audit_log` IPC (limit default=50): E2E — call IPC with no limit; assert max 50 entries returned. Call with limit=10; assert max 10 entries. [e2e]
- PassthroughAuditEntry 7-field round-trip: Integration test — write entry via append; read back via get_passthrough_audit_log; assert all 7 fields preserved. [integration]

**dim6_status**: closed (both platforms; all passthrough audit behavior mapped)

**sub-cluster verdict**:
- macOS: **readyToImplement eligible** — all passthrough audit leaves fully mapped.
- Windows: **readyToImplement eligible** — both field VAs confirmed; fire-and-forget error model confirmed; 1MB guard confirmed.

---

### T5. relay_proxy_config — cross (api_client reqwest config + platform::proxy + api_proxy commands)

**dim6_basis**: reqwest::Client configuration within relay_proxy_server. ProxyContext dim4 CLOSED (relay-closeout-109): 6 Arc fields confirmed (Arc<Runtime>, Arc<Mutex<RelayState>>, Arc<Mutex<RelayManager>>, Arc<reqwest::Client>, Arc<Mutex<PluginRegistry>>, Arc<CodexPaths>). `set_block_official_passthrough` command chain: relay command-layer (macos-1.0.9-relay + windows-1.0.9-relay gate-reports). platform::proxy layer: mediates between business layer and reqwest client configuration. api_client: reqwest::Client construction with proxy/TLS settings.

**dim1-5 sub-cluster status**:
- dim2: ProxyContext struct confirmed both platforms; reqwest::Client as one of 6 Arc fields; set_block_official_passthrough IPC confirmed in relay command-layer
- dim3: command → relay_manager → ProxyContext → reqwest::Client depth≥4
- dim4: ProxyContext 6-field layout confirmed; set_block_official_passthrough behavior: updates passthrough_blocked flag; relay_manager persists state; ProxyContext carries reqwest::Client for outbound requests
- dim5: both platforms confirmed (Windows 6-field layout confirmed via proxy_server_router_route_registrar_sys@0x140384E10)

**leaves** (cross-platform):
- `ProxyContext` construction (all 6 Arc fields): Unit test — instantiate ProxyContext with all 6 dependencies; assert each field type matches expected Arc variant. [unit]
- reqwest::Client field (Arc<reqwest::Client> at ProxyContext[24]): Integration test — construct relay proxy; send test request; assert reqwest client used with correct TLS/proxy settings. [integration]
- `set_block_official_passthrough` IPC: Unit test — call with blocked=true; assert relay_manager passthrough_blocked flag set; assert subsequent passthrough attempts fail with 403. [unit]
- `set_block_official_passthrough` TOML persistence (block_official_passthrough field): Unit test — call command; assert config.toml updated with correct field. [unit]
- platform::proxy layer (proxy TLS config mediation): Not-automatable for internal proxy config — verify via integration that outbound relay requests use system proxy settings when configured. [manual-integration]
- api_proxy command chain (if `api_proxy` is a distinct command): Integration test — call `api_proxy` IPC; assert proxied API call dispatched through relay. [integration] (product_decision if not separately exposed)
- Cross-platform reqwest config equivalence: Integration test — both macOS and Windows relay proxies make HTTP requests using reqwest; assert response structure identical. [integration]
- ProxyContext field access safety (Arc<Mutex<>> for RelayState/RelayManager/PluginRegistry): Unit test — simulate concurrent relay requests; assert no deadlock; assert each request holds Mutex guard correctly. [unit]

**dim6_status**: closed (both platforms; platform::proxy internal body documented manual-integration; ProxyContext struct fully confirmed)

**sub-cluster verdict**:
- macOS: **strictImplementationUse** — ProxyContext confirmed; reqwest::Client internal config = accepted_unknown for TLS/proxy specifics; implementation follows reqwest crate patterns.
- Windows: **strictImplementationUse** — same pattern; ProxyContext 6-field layout independently confirmed.

---

## Dim6 Closure Summary — Full Cluster Table (Updated relay-transport-closeout-109)

| cluster | platform | current gate | dim6 status | readyToImplement eligible? |
|---|---|---|---|---|
| relay_translator_stream | macOS | **readyToImplement** | closed | YES (macOS) |
| relay_translator_stream | Windows | **readyToImplement** | closed | YES (Windows) |
| relay_web_executor | macOS + Windows | **readyToImplement** | closed | YES (both) |
| relay_web_tools | macOS + Windows | **readyToImplement** | closed | YES (both) |
| relay_breaker | macOS | **readyToImplement** | closed | YES (macOS) |
| relay_breaker | Windows | **readyToImplement** | closed | YES (Windows) |
| relay_models | macOS | strictImplementationUse | closed | strictImplementationUse (dim2 partial) |
| relay_models | Windows | **readyToImplement** | closed | YES (Windows) |
| relay_manager | macOS | strictImplementationUse | closed | readyToImplement for 17 sub-leaves |
| relay_manager | Windows | **readyToImplement** | closed | YES (Windows) |
| relay_proxy_server | macOS | strictImplementationUse | closed | readyToImplement for 8/9 sub-leaves |
| relay_proxy_server | Windows | **readyToImplement** | closed | YES (Windows) |
| relay_thread_migration | macOS | strictImplementationUse | closed | readyToImplement for 6/7 sub-leaves |
| relay_thread_migration | Windows | **readyToImplement** | closed | YES (Windows) |
| relay_codex_writer | macOS | strictImplementationUse | closed | readyToImplement for TOML/export/migration leaves |
| relay_codex_writer | Windows | **readyToImplement eligible** (dim6 closes this session) | **closed (relay-transport-closeout-109)** | **YES (Windows)** |
| relay_diagnostic | macOS | strictImplementationUse | closed | readyToImplement for fix_issue leaves |
| relay_diagnostic | Windows | **readyToImplement eligible** for 6/7 leaves | **closed (relay-transport-closeout-109)** | **YES for 6/7 (engine body=accepted_unknown ceiling)** |
| relay_health_audit | macOS | strictImplementationUse | closed | strictImplementationUse (timeout+2 fields unknown) |
| relay_health_audit | Windows | strictImplementationUse | **closed (relay-transport-closeout-109)** | strictImplementationUse (2 ICF leaves accepted_unknown) |
| relay_fetch_models | macOS | strictImplementationUse | partial (async blocked) | strictImplementationUse only (async IDA offline) |
| relay_fetch_models | Windows | strictImplementationUse | **closed (relay-transport-closeout-109)** | **10/12 eligible; async=accepted_unknown ceiling** |
| relay_translator | macOS | strictImplementationUse (BLOCKED at consumerStartReady for tool_result) | partial | readyToImplement for non-tool_result leaves |
| relay_translator | Windows | **readyToImplement eligible** (tool_result CONFIRMED Windows IDA) | **closed (relay-transport-closeout-109)** | **YES (Windows — tool_result mapping closed)** |
| relay_image_compat | macOS | strictImplementationUse | closed | strictImplementationUse (chat_body helper accepted_unknown) |
| relay_image_compat | Windows | strictImplementationUse | **closed (relay-transport-closeout-109)** | strictImplementationUse (forward gate body accepted_unknown) |
| relay_forward_chain | macOS sub-cluster | strictImplementationUse | **closed (relay-transport-closeout-109)** | readyToImplement eligible |
| relay_forward_chain | Windows sub-cluster | strictImplementationUse | **closed (relay-transport-closeout-109)** | strictImplementationUse (ICF accepted_unknown) |
| relay_sse | macOS sub-cluster | strictImplementationUse | **closed (relay-transport-closeout-109)** | strictImplementationUse (vtable accepted_unknown) |
| relay_sse | Windows sub-cluster | strictImplementationUse | **closed (relay-transport-closeout-109)** | strictImplementationUse (relay_enabled/compact flags closed) |
| relay_ws_handlers | macOS sub-cluster | strictImplementationUse | **closed (relay-transport-closeout-109)** | strictImplementationUse (featureA accepted_unknown) |
| relay_ws_handlers | Windows sub-cluster | strictImplementationUse | **closed (relay-transport-closeout-109)** | readyToImplement eligible (featureA product_decision) |
| relay_passthrough_helpers | macOS sub-cluster | readyToImplement eligible | **closed (relay-transport-closeout-109)** | **readyToImplement eligible** |
| relay_passthrough_helpers | Windows sub-cluster | readyToImplement eligible | **closed (relay-transport-closeout-109)** | **readyToImplement eligible** |
| relay_proxy_config | macOS sub-cluster | strictImplementationUse | **closed (relay-transport-closeout-109)** | strictImplementationUse (reqwest TLS config accepted_unknown) |
| relay_proxy_config | Windows sub-cluster | strictImplementationUse | **closed (relay-transport-closeout-109)** | strictImplementationUse (same pattern) |

---

### relay-transport-closeout-109 dim6 Closure Summary

| cluster / sub-cluster | dim6 newly closed? | gate after | notes |
|---|---|---|---|
| relay_codex_writer (win) | YES | readyToImplement eligible | dim6 closes; all leaves mapped |
| relay_diagnostic (win) | YES | readyToImplement for 6/7 leaves | engine body = accepted_unknown ceiling |
| relay_health_audit (win) | YES | strictImplementationUse | 2 ICF leaves accepted_unknown |
| relay_fetch_models (win) | YES | strictImplementationUse (10/12) | async leaves accepted_unknown |
| relay_translator (win) | YES | readyToImplement eligible | tool_result CONFIRMED Windows IDA |
| relay_image_compat (win) | YES | strictImplementationUse | forward gate body accepted_unknown |
| relay_forward_chain | YES | mac: readyToImplement eligible / win: strictImplementationUse | win ICF accepted_unknown |
| relay_sse | YES | strictImplementationUse both | vtable body accepted_unknown |
| relay_ws_handlers | YES | mac: strictImplementationUse / win: readyToImplement eligible | featureA product_decision |
| relay_passthrough_helpers | YES | readyToImplement eligible both | all fire-and-forget + 7 fields confirmed |
| relay_proxy_config | YES | strictImplementationUse both | reqwest TLS internal accepted_unknown |

---

_Produced by: <workstation> / session relay-closeout-109 (initial) + relay-mac-closeout-109 (dim6 supplement for 8 mac clusters) + relay-image-compat-109 (§15 relay_image_compat dim6) + relay-transport-closeout-109 (Part A: 6 Windows strict cluster dim6; Part B: 5 transport sub-cluster dim6) / 2026-06-03_
_Evidence sources: audits/macos-1.0.9-relay-core/gate-report.json + AI.md (relay-closeout-109 supplement) + logic/RELAY-CORE-MISSED-CLUSTERS-109.md + raw/aimami/1.0.9/macos/relay-core/relay_health_audit/health_check/evidence.md + audits/windows-1.0.9-relay-core/gate-report.json + audits/windows-1.0.9-relay-core/logic/WIN-RELAY-HEALTH-AUDIT-REDUCE-109.md + WIN-RELAY-MAC-CLOSEOUT-109.md + WIN-RELAY-IMAGE-COMPAT-109.md + WIN-RELAY-CLOSEOUT-109.md + REVERSE-STATUS.md_
_relay-transport-closeout-109 Part A+B: No new IDA evidence. All acceptance conditions derived from existing gate-report cluster evidence and logic files. Windows strict dim6 closes for relay_codex_writer+relay_diagnostic+relay_health_audit+relay_fetch_models+relay_translator+relay_image_compat. Transport sub-clusters relay_forward_chain+relay_sse+relay_ws_handlers+relay_passthrough_helpers+relay_proxy_config dim6 closed._
_Owner gate: ALLOW / write_mode=owner. Canonical producer: <workstation> (relay-missed-109 + relay-closeout-109 + relay-mac-closeout-109 + relay-image-compat-109 + relay-transport-closeout-109)._
