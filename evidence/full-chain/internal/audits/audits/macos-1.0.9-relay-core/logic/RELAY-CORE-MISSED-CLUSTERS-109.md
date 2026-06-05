# relay-core Missed Clusters — Implementation Logic Summary
# Session: relay-missed-109 | Platform: macOS arm64 | Producer: <workstation>

## relay_breaker

**Gate**: consumerStartReady | **Windows**: not-started

### Data Structures

```
BreakerStore = Arc<Mutex<HashMap<String, BreakerState>>>
  arc_layout:
    +0:  strong_count (AtomicUsize)
    +8:  Mutex OnceBox<pthread_mutex_t>
    +16: HashMap header (ptr/capacity_mask/len/hasher)
    +32: table_ptr (*mut u8 = hashbrown ctrl+slots)
    +40: capacity_mask (usize)
    +56: len (entry count)
    +64: RandomState {k0, k1}
    +24: poison_flag (byte; 1=poisoned)

BreakerState (hashbrown SwissTable slot, stride 40 bytes):
  slot-40: key_ptr (*const u8)
  slot-32: padding
  slot-24: key_ptr duplicate (KV layout)
  slot-16: retry_after (i64 timestamp_ms; 0=cleared)
  slot-8:  failure_count (i32)
```

### Function Map

| function | VA | behavior |
|---|---|---|
| select_candidates | 0x100159464 | scan BreakerStore, skip entries where retry_after > now_ms; return available provider list |
| is_open | 0x1001595c8 | check single entry: if failure_count<1 or retry_after<=now → open (true); else closed |
| record_success | 0x1001592a0 | lock store, zero failure_count and retry_after for provider field |
| record_failure | 0x10015903c | lock store, increment failure_count, set retry_after per backoff ladder |
| new_store | 0x1001597bc | allocate Arc<Mutex<HashMap>> with empty table |

### Backoff Ladder

```
failure_count == 1 → retry_after = now_ms + 5_000
failure_count == 2 → retry_after = now_ms + 30_000
failure_count >= 3 → retry_after = now_ms + 300_000
```

### Call Sites

```
pick_candidates_for@0x100241824  → select_candidates (relay_proxy_server hot path, per-request)
forward_with_candidates success  → record_success (0x100244c00)
forward_with_candidates failure  → record_failure (0x100244c00 + 0x10028563c)
relay_manager_new@0x1001ccea0   → new_store
```

---

## relay_fetch_models

**Gate**: gap_needs_reducer (2 async leaves blocked) | **Windows**: separate gate

### Decompiled Leaves (5/7)

| function | VA | behavior |
|---|---|---|
| parse_model_ids | 0x1002386a0 | parse JSON array of model ID strings from relay provider response |
| sanitize_api_key | 0x1002387ec | redact/truncate API field string for display/logging |
| is_transient_error | 0x100238948 | classify HTTP status as transient (429/5xx) vs permanent |
| parse_extra_headers | 0x100238b78 | parse header string "K:V\nK:V..." into Vec<(String,String)>; depth-closed |
| build_url | 0x100239168 | construct provider base URL + path, normalize trailing slashes |

### Blocked Leaves

```
fetch_async       seed_VA=0x1000a6494 → drop_in_place destructor, NOT async poll body
fetch_openai_async seed_VA=0x1000a7164 → drop_in_place destructor, NOT async poll body
```
Actual async state machine bodies not located. IDA MCP timed out (<network-share>:13337). IDB save not done.

---

## relay_models

**Gate**: consumerStartReady | **Windows**: see windows-1.0.9-relay-core (corrections applied)

### Logic Functions

| function | VA | behavior |
|---|---|---|
| error_hint | 0x1001source archive820 | map raw error string to user-facing hint; pattern match on common error patterns |
| sanitize_error_for_display | 0x1001c7e2c | strip sensitive fields (API keys, tokens) from error before display |
| RelayActiveByIde::add | 0x1001c62a0 | Vec<RelayIdeEntry> append; entry_size=24 bytes |

### Struct/Enum Shapes

```
RelayState {
  providers: Vec<RelayProvider>
  activeByIde: RelayActiveByIde
  codexRouterEnabled: Option<String>
  blockOfficialPassthrough: Option<String>
  Option<String> x1
  Option<CodexRouteDiagnostic>
}

RelayProvider (208 bytes, 7+ String fields):
  id, apiKey, name/baseUrl, createdAt, lastTestedAt, lastError/errorMessage, modelsSample(Option)
  NOTE: Windows confirms 15 fields total (not 9 per seed)

RelayActiveByIde: Vec<RelayIdeEntry> (entry_size=24)
RelayIde enum variants: ["codex"] (1 variant confirmed)
RelayWireApi enum variants: ["openai-chat", "openai-responses", "anthropic"]
RelayNetworkMode enum variants: ["system", "direct"]

RelayProxyStatus (struct, NOT enum — corrected from Windows gate):
  fields: running, port, baseUrl, codexBaseUrl, lastError (5 fields)

RelayTestResult: symbol only via drop_in_place<Option<RelayTestResult>>@0x1000013ec — no fields decompiled (level D)

CodexRouteDiagnostic: 6 Option<String> fields (candidate names: transport/command/headers/environment/sensitive-field/blocked)

RelayUpsertInput: 9 serde string elements
RelayDraftTestInput: 9 serde string elements
RelayFetchModelsInput: 6 fields — providerId/atMs/requestedModel/providerName/upstreamUrl/wireApi
```

---

## relay_translator_stream

**Gate**: strictImplementationUse | **Windows**: not-started

### State Machine Handlers

| type | handle fn | VA | size | depth |
|---|---|---|---|---|
| ChatToResponsesStream | handle_chunk | 0x1006539ec | 15.3KB | 5 |
| ChatToResponsesStream | close_reasoning_block | 0x10065d3a8 | 3.7KB | 4 |
| AnthropicDirectToResponsesStream | handle_event | 0x100668a08 | 16.3KB | 5 |
| AnthropicDirectToResponsesStream | close_thinking_block | 0x100670ec4 | 3.7KB | 4 |
| OpenAiToAnthropicStream | handle_chunk | 0x100663f60 | 9.2KB | 5 |
| AnthropicToOpenAiStream | handle_event | 0x10065fdb8 | 8.7KB | 5 |
| AnthropicToOpenAiStream | role_chunk | 0x10065e974 | 2.2KB | 3 |
| AnthropicToOpenAiStream | ensure_role | 0x10065f3ac | 176B | 2 |
| AnthropicToOpenAiStream | flush | 0x1006627b0 | 428B | 3 |
| AnthropicToOpenAiStream | feed_line | 0x1006629ac | 416B | 4 |
| AnthropicToOpenAiStream | final_chunk | 0x10065f47c | 2KB | 3 |
| ToolItemState (drop_in_place) | — | 0x10067b19c | 116B | 1 |

Additional functions decompiled: ChatToResponsesStream::{close_text_block, close_tool_blocks, emit_completed, feed_line}, AnthropicDirectToResponsesStream::{close_text_block, close_tool_blocks, emit_completed, feed_line}, OpenAiToAnthropicStream::{emit_message_start, feed_line}

### ToolItemState Struct Layout
```
ToolItemState: 4 optional String fields
  [0-2]:  tool_id/call_id field (Option<String>)
  [3-5]:  tool_name field (Option<String>)
  [6-8]:  accumulator/content field (Option<String>)
  [9-11]: state_flag/type field (Option<String>)
```

---

## relay_web_executor

**Gate**: strictImplementationUse | **Windows**: see windows-1.0.9-relay-core

### Function Map

| function | VA | tier | behavior |
|---|---|---|---|
| execute_with_web_tools::closure | 0x1000a2098 | A | outer executor: dispatches tool calls (web_search/web_fetch), accumulates results, calls proxy path |
| execute_proxy_tools::closure | 0x10009efb0 | A | proxy path: routes to search_yahoo or other backends, builds passthrough JSON |
| build_passthrough_response | 0x10067331c | A | assemble final JSON response with tool_calls/choices/summary_text |
| append_assistant_and_tool_results | 0x1006734cc | A | accumulate assistant+tool_result messages into conversation history |
| fetch_raw_text::closure | 0x10009eedc | B | HTTP GET for web_fetch tool call |
| drop_in_place<send_request::closure> | 0x1000a7c0c | D | destructor; NOT poll body |
| RequestBuilder::send | 0x1009b84ac | C | reqwest library terminal (call chain terminates here) |

### Call Chain

```
proxy_server::{non_streaming@0x10009becc / streaming@0x10009d710}
  → execute_with_web_tools::closure@0x1000a2098
    → execute_proxy_tools::closure@0x10009efb0 (if proxy path)
      → fetch_raw_text::closure@0x10009eedc → RequestBuilder::send@0x1009b84ac (terminal)
    → build_passthrough_response@0x10067331c
    → append_assistant_and_tool_results@0x1006734cc
```

### DTO (closed)

```
tool_calls: array of tool call objects
choices:    array of choice objects  
summary_text: string (final content)
tool_call_id / call_id: string identifiers
```

### Side Effects

In-memory JSON mutation only. No file writes, no registry, no persistent store.

---

## relay_web_tools

**Gate**: strictImplementationUse | **Windows**: see windows-1.0.9-relay-core (two-cluster mirror)

### Function Map

| function | VA | tier | behavior |
|---|---|---|---|
| fetch::is_raw_text_url | 0x1004b5a28 | B | check URL against raw-text whitelist (github raw, pastebin etc) |
| fetch::is_github_raw_url | 0x1004b5bb0 | B | detect github.com URL pattern |
| fetch::extract_text_from_html | 0x1004b5ce4 | A | scraper-crate HTML→text; skip nav/style/aside/script/header/footer/noscript |
| fetch::collect_text_from_element | 0x1004b6458 | B | recursive element text collector |
| fetch::try_convert_github_to_raw | 0x1004b68f0 | B | rewrite github.com/user/repo/blob → raw.githubusercontent.com |
| fetch::truncate | 0x1004b6bdc | B | Unicode-safe truncate to 8000 chars (char boundary cut) |
| fetch::fetch_raw_text::closure | 0x10009eb38 | A | full fetch pipeline: URL → GET → HTML extract / raw text → truncate |
| search::format_results | 0x100672e5c | B | format SearchResult list to string for context injection |
| search::extract_ddg_url | 0x1006730f0 | B | extract canonical URL from DuckDuckGo redirect |
| definitions::web_fetch_tool | 0x100524924 | A | build web_fetch tool schema JSON (param: url/string) |
| definitions::web_search_tool | 0x100525884 | A | build web_search tool schema JSON (param: query/string) |
| definitions::inject_tool_definitions | 0x10032c78c | A | inject tools into payload if payload.discriminant==5 (Object variant) |

### field Constants

```
truncate_limit:   8000 chars (Unicode-safe)
SearchResult stride: 72 bytes
web_search_tool:  {type: "web_search_20250305", name: "web_search", max_uses: 5}
web_fetch_tool:   {type: "...", name: "web_fetch", param: url}
inject guard:     payload.discriminant == 5 (Object variant of serde_json::Value)
search backends:  Yahoo + DuckDuckGo (search_yahoo embedded in execute_proxy_tools::closure)
skip_tags:        nav, style, aside, script, header, footer, noscript
```

### Standalone Search Functions Not Found

`search_yahoo`: not a standalone function; logic embedded in `execute_proxy_tools::closure@0x10009efb0` (prior session, A-level comment present in IDB).
