# Windows relay-core Missed Clusters — relay-missed-109

reduce session: relay-missed-109  
machine: <workstation>
binary: a5822387fa3f (AiMaM 1.0.9 win64.exe)  
date: 2026-06-03  

This document records the 5 missed clusters produced in session relay-missed-109, supplementing the prior 7 clusters (phase-reduce-20260602). Gate assessments are per GATE-SPEC six-dimensional framework.

---

## relay_breaker — strictImplementationUse

**Evidence root**: `raw/aimami/1.0.9/windows/relay-core/relay_breaker/`  
**Leaf count**: 11 (3 .c files produced; 8 manifest-only; idb_save=true)

### Struct layout

```
BreakerState (hashbrown SwissTable slot, stride 208 bytes):
  offset +144: open_until_ms  (u64, epoch ms; 0 = not open)
  offset +148: failure_count  (i32 at low dword)
  offset +204: active_flag    (byte)
  sentinel:    0x8000000000000000 = provider not in hashmap

Windows mutex: InterlockedCompareExchange8 + WakeByAddressSingle pattern
```

### field functions

| VA | Name | Conf | Role |
|---|---|---|---|
| 0x1403EC630 | relay_breaker_record_failure_sys | A | Upsert BreakerState, set open_until_ms = now + backoff |
| 0x1403ECDA0 | relay_breaker_is_open_sys | A | Standalone hashmap lookup, returns open_until_ms > now_ms |
| 0x1403FEF90 | relay_breaker_extract_provider_state_sys | A | HashMap entry reader; sentinel 0x8000000000000000 when not found |
| 0x1401216F0 | relay_breaker_pick_candidates_for_sys | A | Main fetch+filter: iterates providers, fetches API keys, stride=208 |
| 0x1403ECAF0 | relay_breaker_partition_sort_candidates_sys | A | Partition via partition_eligible, sort by timestamp |
| 0x1400954C0 | relay_breaker_partition_eligible_sys | A | 24-byte entries; calls extract_provider_state per entry |
| 0x140093A20 | relay_breaker_sort_by_timestamp_sys | A | Calls is_open per provider; routes available vs open_breaker |
| 0x1400A1370 | relay_breaker_collect_sorted_list_sys | A | Merges available_set + open_breaker_set; stride=208 |
| 0x140129A60 | relay_breaker_reorder_provider_front_sys | A | Moves matched provider to front; calls pick_candidates_for |
| 0x140101120 | relay_breaker_hashmap_upsert_sys | A | SIMD Swiss-table insert/upsert; called from record_failure |
| 0x140120EC0 | relay_breaker_record_result_sys | B | Combined record_success/result; status_code 200=ok/502=fail |

### Backoff ladder

```
failure_count == 1: backoff = 5_000 ms
failure_count == 2: backoff = 30_000 ms
failure_count >= 3: backoff = 300_000 ms
```

### Known gaps

- 
ew_store`: location blocked (no symbol or distinctive string anchor; likely inside relay_manager_upsert_core_sys bootstrap — not traced this session)
- dim6 test/acceptance mapping: missing

---

## relay_fetch_models — strictImplementationUse (async terminal accepted_unknown)

**Evidence root**: `raw/aimami/1.0.9/windows/relay-core/relay_fetch_models/`  
**Leaf count**: 12 (10 decompiled, 2 blocked)

### field functions

| VA | Name | Conf | Status |
|---|---|---|---|
| 0x1408e0870 | relay_fetch_models_owner | A | Module owner fn; decompiled |
| 0x140113100 | relay_fetch_models_parse_model_ids | A | decompiled |
| 0x1401134F0 | relay_fetch_models_parse_extra_headers | A | decompiled |
| 0x140113280 | relay_fetch_models_build_url_normalize | B | decompiled |
| 0x1401133E0 | relay_fetch_models_is_transient_request_error | B | decompiled |
| 0x140113F50 | relay_fetch_models_strip_v1_suffix | B | decompiled |
| 0x14010EFC0 | relay_fetch_models_apply_extra_headers_openai | A | decompiled |
| 0x1401AD5A0 | relay_fetch_models_build_openai_headers_authorization | A | decompiled |
| 0x140431D00 | relay_fetch_models_classify_error | A | decompiled (= relay_models error_hint) |
| 0x140571180 | relay_fetch_models_keychain_get_api_key | A | callees extracted; shared VA with relay_manager |
| — | fetch_async | blocked | ICF-merged async poll body; not decompilable |
| — | fetch_openai_async | blocked | ICF-merged async poll body; not decompilable |

### Accepted unknowns

- `fetch_async` and `fetch_openai_async` async Future poll bodies are ICF-merged by the Windows linker. Seed VAs resolve to `drop_in_place` destructors not to poll function bodies. Async state machine VAs not found. **Accepted as blocked_unknown** — terminal transport behavior accepted from macOS evidence with Windows-independent caveat.

---

## relay_models — strictImplementationUse

**Evidence root**: `raw/aimami/1.0.9/windows/relay-core/relay_models/`  
**Leaf count**: 6 (all decompiled)

### field corrections vs SEED.md

```
SEED claimed: RelayProxyStatus = enum   → CORRECTED: struct
SEED claimed: RelayProvider = 9 fields  → CORRECTED: 15 fields
RelayIde:                                 CONFIRMED: 1 variant only (codex)
```

### Struct / deser VAs

| VA | Name | field fact |
|---|---|---|
| 0x140431D00 | relay_models_error_hint_sys | Leaf function |
| 0x140434960 | relay_models_sanitize_error_for_display_sys | Leaf function |
| 0x140152720 | relay_models_relay_active_by_ide_add_sys | call_tree depth=5; calls persist_commit + reset_codex_config + ensure_proxy_started |
| 0x1407E5EB0 | relay_models_relay_provider_map_deser_sys | 15 fields confirmed |
| 0x1407EC400 | relay_models_relay_proxy_status_map_deser_sys | struct, 5 fields: running/port/baseUrl/codexBaseUrl/lastError |
| 0x1401BDED0 | relay_models_relay_active_by_ide_update_inplace_sys | Leaf; offset layout mapped |

### RelayProxyStatus fields (confirmed)

```
running:       bool
port:          u16
baseUrl:       String
codexBaseUrl:  String
lastError:     Option<String>
```

---

## relay_web_executor — strictImplementationUse

**Evidence root**: `raw/aimami/1.0.9/windows/relay-core/relay_web_executor/`  
**Leaf count**: 9 (7 decompiled, 2 named prior session, 1 accepted_unknown)

### field functions

| VA | Name | Tier | Role |
|---|---|---|---|
| 0x1401DFC70 | execute_proxy_tools_owner_sys | A | Main proxy tool execution entry |
| 0x1401F9D60 | build_passthrough_response_owner_sys | A | Build passthrough JSON response |
| 0x140840650 | web_dispatch_loop_owner_sys | A | Web tool dispatch loop |
| 0x140214C30 | web_search_tool_def_builder_sys | A | Tool definition builder |
| 0x14020EC80 | inject_web_search_system_prompt_sys | A | Inject search system prompt |
| 0x1402395C0 | append_assistant_and_tool_results_owner_sys | A | Append assistant + tool results |
| 0x140137FE0 | execute_responses_stream_roundtrip_sys | B | Responses API stream roundtrip |
| 0x1401EEFA0 | translate_responses_to_anthropic_stream_sys | B | Responses→Anthropic SSE translation |
| 0x140205540 | translate_responses_to_chat_completion_sys | B | Responses→ChatCompletion translation |

### DTO fields (closed)

```
tool_calls, choices, summary_text, tool_call_id, call_id
```

### Side effects

- In-memory JSON mutation only
- No persistent store writes
- HTTP terminal: ICF-folded async tokio client — accepted_unknown

---

## relay_web_tools — strictImplementationUse

**Evidence root**: `raw/aimami/1.0.9/windows/relay-core/relay_web_tools/`  
**Leaf count**: 16 (all decompiled; 16 renames + 16 IDB comments; idb_save=true)

### Architecture: Two mirrored clusters

```
cluster1 (0x14015xxx): stream_codex_responses_native_sys path
cluster2 (0x14084xxx): forward_codex_responses_internal_sys path
Shared:  github_raw_url_convert (0x140157230)
         inject_tool_definitions / build_passthrough_response (0x1401F9D60)
```

### field behavioral facts

```
fetch User-Agent: "MacOS Chrome/125" (hardcoded)
search engines:   Yahoo + DuckDuckGo
html extraction:  scraper crate
  extract_html_text_body_sys  @ 0x1401564C0
  collect_element_text_sys    @ 0x140156E10
  skip_tags: nav/style/aside/script/header/footer/noscript
truncate: 8000 bytes (byte count, not Unicode char count)

web_search_tool schema:
  type:     web_search_20250305
  name:     web_search
  max_uses: 5

inject_prompt: "You have a web_search tool available." (37 bytes)
               + cache_control: ephemeral

SSE headers:
  Content-Type:       text/event-stream
  Cache-Control:      no-cache
  X-Accel-Buffering:  no
```

### Accepted unknowns

- `format_results`: inlined in fetch_search_body — not locatable as standalone
- `extract_ddg_url`: inlined in fetch_search_body — not locatable as standalone
- `struct SearchResult`: stripped Rust struct (name known, layout not independently confirmed)

---

## Overall Windows relay-core gate summary (complete 12-cluster bundle)

| Cluster | Leaves | Gate | Session |
|---|---|---|---|
| relay_manager | 13 | strictImplementationUse | phase-reduce-20260602 |
| relay_proxy_server | 9 | strictImplementationUse | phase-reduce-20260602 |
| relay_codex_writer | 8 | strictImplementationUse | phase-reduce-20260602 |
| relay_diagnostic | 6 | strictImplementationUse | phase-reduce-20260602 |
| relay_thread_migration | 5 | strictImplementationUse | phase-reduce-20260602 |
| relay_health_audit | 11 | gap_needs_reducer | phase-reduce-20260602 |
| bootstrap | 4 | consumerStartReady_candidate | phase-reduce-20260602 |
| relay_breaker | 11 | strictImplementationUse | relay-missed-109 |
| relay_fetch_models | 12 | strictImplementationUse | relay-missed-109 |
| relay_models | 6 | strictImplementationUse | relay-missed-109 |
| relay_web_executor | 9 | strictImplementationUse | relay-missed-109 |
| relay_web_tools | 16 | strictImplementationUse | relay-missed-109 |
| **TOTAL** | **110** | **10 strict / 1 gap / 1 candidate** | |

All 10 strictImplementationUse clusters: dim6 missing → readyToImplement=false for all.  
Platform policy: windowsIndependent=true; doNotInferWindowsFromMacOS=true.
