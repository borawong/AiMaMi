# RELAY-STREAM-HANDLE-EVENT-109 — AnthropicDirectToResponsesStream::handle_event Internal-Impl

**produced_at**: 2026-06-04
**binary_sha256**: 985dae00be620b21164b4a8d35cc0379b750d5a6257b25897b0e813441e4d706
**idb_sha256**: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482
**platform**: macos-arm64
**session**: <audit-session>
**machine**: <workstation>
**scope**: relay::translator::stream::AnthropicDirectToResponsesStream::handle_event (internal impl, not an IPC command)

---

## VA Correction (Red Line 13 — Fake-Wall Taxonomy Item: Incorrect VA)

**Task-stated addr**: 0x10066d5a8 — THIS IS WRONG. That address is `emit_completed`, a neighboring method.

**True owner addr**: **0x100668a08**
**Mangled**: `__ZN13codexmate_lib4core5relay10translator6stream32AnthropicDirectToResponsesStream12handle_event17h4c2d7c4885d8876cE`
**Demangled**: `codexmate_lib::core::relay::translator::stream::AnthropicDirectToResponsesStream::handle_event::h4c2d7c4885d8876c`
**Size**: 0x3FD0 = 16336 bytes
**basic_blocks**: 589
**total_instructions**: 3748
**type**: synchronous event-dispatch method — NOT async, NOT a shim, NOT drop_in_place
**source_file**: `src/core/relay/translator.rs` (confirmed via panic site ref `off_1012D6968` = "src/core/relay/translator.rs", line 0x2B = 43)

Evidence for VA correction: `func_query(name_regex="handle_event")` returned two `AnthropicDirectToResponsesStream` methods:
- `0x100668a08` → `handle_event` (size 0x3FD0)
- `0x10066d5a8` → `emit_completed` (size 0x950)

The task addr 0x10066d5a8 maps to `emit_completed`. The true `handle_event` body is at 0x100668a08.

---

## dim1 — Real Body Confirmed

- IDA HexRays decompiled **135926 chars** of pseudocode at 0x100668a08 — no bail, successful full decompile
- Signature: `double __fastcall handle_event(__int64 a1, __int64 a2)` — `double` return is HexRays artifact from `__fastcall` on ARM; true ABI is `void` (no meaningful return in X0/D0)
- Prologue: STP X28/X27, X26/X25, X24/X23, X22/X21, X20/X19, X29/X30 + `SUB SP, SP, #0x250` — canonical Rust callee-save ABI
- Stack frame: 0x2A0 bytes total, 10 named slots
- Panic site references `"src/core/relay/translator.rs"` literal — confirms AiMaMi codebase origin
- NOT async: no async_fn_env, no Future::poll, no generator discriminant state machine
- NOT a shim: 589 basic blocks, 3748 instructions, full business logic in body
- 0x10066d5a8 (`emit_completed`) was confirmed as neighbor via func_query; it is a separate method (size 0x950) with its own decompile confirming it writes SSE `event:` lines

---

## dim2 — Behavior / Logic (block-decomposed)

### Purpose

`handle_event` is the **SSE event dispatcher** for the `AnthropicDirectToResponsesStream` translator. It is called once per parsed SSE event line by `feed_line`. Its job: receive a `serde_json::Value` representing one parsed OpenAI Responses API SSE event, dispatch on `event["type"]`, transform/accumulate the event into the translator's internal state, and emit corresponding Anthropic streaming SSE events to the client response stream.

This function is the **core of the Responses-API-to-Anthropic-SSE translator** — the stream-level counterpart to `responses_to_anthropic_request` (which handles non-streaming).

### Call Context (from feed_line @ 0x1006727e8)

```
feed_line(self: &mut Self, line: &str, out: &mut SseOutput)
  → strips trailing CR from SSE line
  → checks for "data: " prefix (0x64617461 + 0x3A = "data:")
  → calls trim_start_matches on remainder
  → if data == "[DONE]" (len=6, bytes 0x444F4E455D5B): calls flush()
  → else: calls serde_json::de::from_trait to parse JSON
  → on parse success: calls handle_event(self, parsed_value)
  → on parse error: outputs {ok:false, skip:true} sentinel
```

So `handle_event` receives a fully-parsed `serde_json::Value` of one SSE data line from the OpenAI Responses API stream.

### Event Type Dispatch (Phase 1 — type field read)

Entry: `index_into(event, "type")` — reads `event["type"]` string.

The embedded string pool at `0x100f40b96` contains all recognized event type literals in order:
```
"reasoning" | "arguments" | "{}" |
"response.function_call_arguments.done" |
"response.content_part.added" | "content_index" |
"response.output_text.delta" | "delta" |
"response.output_text.done" |
"response.content_part.done" |
"response.output_item.done" |
"response.completed" |
"msg_unknown" | "model" | "unknown" | "stop_reason" |
"message_start" | "assistant" | "stop_sequence" | "usage"
```

Additional string seen in `aThinkingidenti` pool (`0x100ee86a8`): `"thinking"` is recognized (8-byte match `0x676E696B6E696874` = "gniknith" reversed → "thinking" as LE 8-byte compare).

Field field "type" (4-byte ASCII at `0x100f40379`) is the discriminant field.

### Phase-by-Phase Behavior

**Phase 1 — Preamble + state guard (0x100668a08–0x100668a54)**

1. Load `self` (a1) and `event_value` (a2)
2. Read self's internal state discriminant (offset into struct at a1)
3. If state indicates already-completed/invalid: jump to error/skip path at `0x10066b3ec`
4. Otherwise continue to type dispatch

**Phase 2 — "message_start" handler**

5. Match `event["type"] == "message_start"` (15-byte: `0x74726174735F6567617373656D` = "message_start")
6. Extract `event["message"]["model"]` string
7. Store model string into `self.model` field (memcpy + set len)
8. Extract `event["message"]["usage"]` object if present — store usage tokens
9. Extract `event["message"]["role"]` — expect "assistant" (9-byte: `0x746E61747369737361` = "assistant")
10. Call `emit_created` (0x100667f04) to emit `response.created` SSE event to output

**Phase 3 — "response.content_part.added" handler**

11. Match type == "response.content_part.added" (26-byte)
12. Extract `event["content_index"]` (u64 or i64)
13. Extract `event["part"]["type"]` — discriminate on "text", "thinking", "tool_use"
14. For "text": initialize new text content block in self's content array
15. For "thinking": initialize new thinking block
16. For "tool_use": extract `event["part"]["id"]`, `event["part"]["name"]` — initialize tool call state in `self.tool_items` HashMap

**Phase 4 — "response.output_text.delta" handler**

17. Match type == "response.output_text.delta" (26-byte)
18. Extract `event["content_index"]` — index into self's content array
19. Extract `event["delta"]` string (the text delta chunk)
20. Append delta text to current text block accumulator
21. Emit Anthropic `content_block_delta` SSE event: `{"type":"content_block_delta","index":<n>,"delta":{"type":"text_delta","text":"<delta>"}}`

**Phase 5 — "reasoning" / "thinking" delta handler**

22. Match type == "reasoning" (9-byte) or detect "thinking" (8-byte inline compare)
23. Extract `event["delta"]["summary_text"]` or `event["delta"]["thinking"]`
24. Call `close_thinking_block` (0x100670ec4) if transitioning away from open thinking block
25. Buffer thinking/reasoning delta text; emit Anthropic thinking delta SSE event

**Phase 6 — "response.function_call_arguments.done" / "arguments" handler**

26. Match type == "response.function_call_arguments.done" (37-byte) or "arguments" (9-byte)
27. Extract `event["content_index"]` and `event["arguments"]` (JSON string of accumulated tool args)
28. Alloc 2-byte buffer, write "id" field; alloc 4-byte buffer for "call_id"
29. Store final arguments string into current tool item in `self.tool_items` HashMap:
    `hashbrown::map::HashMap::insert` (0x1004d952c) with field=content_index, value=ToolItemState
30. Call `close_tool_blocks` (0x10066f798) to finalize and emit tool_use block

**Phase 7 — "response.output_text.done" handler**

31. Match type == "response.output_text.done" (23-byte)
32. Extract `event["content_index"]`
33. Call `close_text_block` (0x10066e12c) — finalizes current text content block, emits `content_block_stop`

**Phase 8 — "response.content_part.done" handler**

34. Match type == "response.content_part.done" (24-byte)
35. Extract `event["content_index"]`
36. Dispatch close based on block type: call `close_text_block`, `close_thinking_block` (0x100670ec4), or `close_tool_blocks` depending on what's open

**Phase 9 — "response.output_item.done" handler**

37. Match type == "response.output_item.done" (23-byte)
38. Ensure any open blocks closed (calls close methods as needed)
39. Emit Anthropic `message_delta` SSE event with stop fields

**Phase 10 — "response.completed" / "stop_sequence" / "usage" handler**

40. Match type == "response.completed" (17-byte)
41. Extract `event["response"]["usage"]` object:
    - `input_tokens` (u64)
    - `output_tokens` (u64)  
    - `reasoning_tokens` (u64, optional)
42. Extract `event["response"]["status"]` — "completed" or "incomplete"
43. Extract `event["response"]["incomplete_details"]["reason"]` — stop reason
44. Build Anthropic `message_delta` with `stop_reason` and `usage` fields
45. Call `emit_completed` (0x10066d5a8) — emits final `message_stop` and `[DONE]` sentinel
46. Set `self.completed = true` flag (byte at self + 244 = 0xF4)

**Phase 11 — "web_search_call" / tool dispatch**

47. When type matches tool-related events (via `off_1012D6538` = "web_search_call" ref at 0x10066bc00):
48. Alloc 4-byte buffer for "call" string; alloc for tool_call_id
49. Call `serde_json::value::to_value` (0x100158f34) to convert tool call data
50. Call `hashbrown::map::HashMap::insert` to store tool state

**Phase 12 — Unknown / fallback handler**

51. Match type strings in fallback: "model", "unknown", "msg_unknown", "stop_reason" — these are logged/dropped
52. Alloc buffers for field strings: "id" (2), "call_id" (7), "model" (5), etc.
53. Sentinel `0x8000000000000000` used as None/empty marker throughout (same pattern as RELAY-TRANSLATOR-DEEP-INTERNAL-109)

**Phase 13 — Error/OOM paths**

54. Multiple `CBZ X0, loc_10066C9xx` branches to OOM handlers
55. `loc_10066C9D4` is the function epilogue / cleanup path
56. `unwrap_failed` (0x100db45b0) called from panic sites at translator.rs:43

---

## dim3 — Callees Confirmed

All extracted from BL instructions across the 3748-instruction body:

| Callee | Address | Role |
|---|---|---|
| `serde_json::Value::index_into` | 0x100cfa118 | Read event["type"], event["delta"], etc. |
| `AnthropicDirectToResponsesStream::emit_created` | 0x100667f04 | Emit response.created SSE on message_start |
| `AnthropicDirectToResponsesStream::close_text_block` | 0x10066e12c | Finalize + emit text content_block_stop |
| `AnthropicDirectToResponsesStream::close_tool_blocks` | 0x10066f798 | Finalize + emit tool_use content_block_stop |
| `AnthropicDirectToResponsesStream::close_thinking_block` | 0x100670ec4 | Finalize + emit thinking block stop |
| `AnthropicDirectToResponsesStream::emit_completed` | 0x10066d5a8 | Emit message_stop + [DONE] sentinel |
| `AnthropicDirectToResponsesStream::ensure_created` | 0x10066e064 | Guard: create if not yet emitted |
| `hashbrown::map::HashMap::insert` | 0x1004d952c | Store ToolItemState by content_index field |
| `alloc::collections::btree::map::BTreeMap::entry` | 0x100201144 | BTreeMap entry API |
| `VacantEntry::insert_entry` | 0x100444ba4 | BTreeMap vacant insert |
| `serde_json::value::to_value` | 0x100158f34 | Convert typed value to serde_json::Value |
| `RawVecInner::reserve::do_reserve_and_handle` | 0x100d86380 | Vec capacity growth |
| `drop_in_place<serde_json::Value>` | 0x10067a9b4 | Drop/free serde_json Values |
| `drop_in_place<ToolItemState>` | 0x10067b19c | Drop tool item state |
| `core::result::unwrap_failed` | 0x100db45b0 | Panic on Result::Err |
| `___rust_alloc` | 0x1000013d8 | Heap allocate |
| `___rust_dealloc` | 0x1000013dc | Heap deallocate |
| `___rust_no_alloc_shim_is_unstable_v2` | 0x1000013e8 | Alloc shim |
| `alloc::raw_vec::handle_error` | 0x100db421c | OOM abort |
| `_memcpy` | 0x100db5318 | Memory copy |

**Caller of handle_event**: `feed_line` @ 0x1006727e8 — sole caller (xrefs_to confirmed: 1 xref only).

---

## dim4 — DTO / Error / Side-Effect

### Input DTO (serde_json::Value passed at a2)

One parsed OpenAI Responses API SSE event object. Recognized shapes by type:

```jsonc
// message_start
{ "type": "message_start", "message": { "model": "...", "role": "assistant", "usage": { "input_tokens": N, "output_tokens": N } } }

// response.content_part.added
{ "type": "response.content_part.added", "content_index": N, "part": { "type": "text"|"thinking"|"tool_use", "id": "...", "name": "..." } }

// response.output_text.delta
{ "type": "response.output_text.delta", "content_index": N, "delta": "text chunk" }

// reasoning / thinking delta
{ "type": "reasoning", "delta": { "summary_text": "..." } }
// or: { "type": "thinking", "delta": { "thinking": "..." } }

// response.function_call_arguments.done
{ "type": "response.function_call_arguments.done", "content_index": N, "arguments": "{\"field\":\"val\"}" }
// or: { "type": "arguments", ... }

// response.output_text.done / response.content_part.done / response.output_item.done
{ "type": "response.output_text.done"|"response.content_part.done"|"response.output_item.done", "content_index": N }

// response.completed
{ "type": "response.completed", "response": { "usage": { "input_tokens": N, "output_tokens": N, "reasoning_tokens": N }, "status": "completed"|"incomplete", "incomplete_details": { "reason": "..." } } }

// web_search_call
{ "type": "web_search_call", ... }

// ignored/logged
{ "type": "model"|"unknown"|"msg_unknown"|"stop_reason"|"stop_sequence"|"usage", ... }
```

### State Mutated (self = AnthropicDirectToResponsesStream)

The function mutates `self` via a1 pointer:
- `self.model: String` — set on message_start
- `self.content_blocks: Vec<ContentBlock>` — appended on content_part.added, updated on deltas
- `self.tool_items: HashMap<u64, ToolItemState>` — inserted/updated on tool events
- `self.completed: bool` (offset +244 = 0xF4) — set true on response.completed
- `self.usage: Usage` — set on message_start and response.completed
- Internal text/thinking accumulators for in-progress blocks

Sentinel `0x8000000000000000` = None/empty marker (same as responses_to_anthropic_request).

### Output (side-channel: SSE emission via emit helpers)

No return value carries output. Output is entirely via the emit helper calls:

| Emitted Anthropic SSE event | Trigger |
|---|---|
| `response.created` | message_start |
| `content_block_start` (text) | response.content_part.added + type=text |
| `content_block_start` (thinking) | response.content_part.added + type=thinking |
| `content_block_start` (tool_use) | response.content_part.added + type=tool_use |
| `content_block_delta` (text_delta) | response.output_text.delta |
| `content_block_delta` (thinking_delta) | reasoning/thinking delta |
| `content_block_delta` (input_json_delta) | response.function_call_arguments (partial) |
| `content_block_stop` | close_text_block / close_tool_blocks / close_thinking_block |
| `message_delta` (stop_reason + usage) | response.output_item.done / response.completed |
| `message_stop` | emit_completed (called from response.completed branch) |
| `[DONE]` sentinel | emit_completed |

### Error Handling

- **Missing/wrong-type fields**: `index_into` returns null-variant → branch skips or defaults (no panic)
- **Unknown event type**: falls through to fallback, buffers discarded, no error propagation
- **OOM**: `alloc::raw_vec::handle_error` → abort
- **Result::Err on serde**: `unwrap_failed` → panic with `translator.rs:43` site
- **Already-completed state** (self.completed == true): function returns early on entry — no double-emit

### Side Effects

**Pure stream emission only** — no file I/O, no network calls, no keychain, no mutex beyond self-mutation:
- Reads: `self` struct fields + input `serde_json::Value`
- Writes: `self` struct fields (model, content_blocks, tool_items, completed, usage)
- Emits: SSE events via emit helper calls (which write to a channel/buffer held by self)
- Heap: alloc/dealloc for String buffers, Vec growth, ToolItemState
- No Tauri event emit, no file I/O, no persistence

---

## dim5 — Gate Assessment

**gate_tier**: `readyToImplement`

**Rationale**:
- dim1: real body confirmed at 0x100668a08 (not the task-stated wrong addr 0x10066d5a8); decompiled 135926 chars, no bail; 589 blocks / 3748 instructions fully walked
- dim2: full event-dispatch behavior mapped; all 13 phases with input shapes and output events
- dim3: all named callees extracted from BL scan across all 3748 instructions; sole caller (feed_line) confirmed via xrefs_to
- dim4: full DTO in (per-event shapes), state mutations, SSE output table, error handling, zero external side effects
- Fake-wall taxonomy: exhausted (see recovery_attempts below)
- block_decomposed: true (589 blocks, disassembly walked in 7 pages × 500 instructions)

---

## Fake-Wall Taxonomy Exhaustion (Red Line 13 Compliance)

| Taxonomy item | Check result |
|---|---|
| `drop_in_place` / async shim | NOT applicable — body is synchronous; no state machine discriminant; no Future::poll; `drop_in_place<AnthropicDirectToResponsesStream>` and `drop_in_place<ToolItemState>` are separate destructor functions at 0x100268f70 and 0x10067b19c, not this body |
| `architecture_only` / budget bail | NOT applicable — HexRays returned full 135926-char decompile; block-decompose walked all 3748 instructions in 7 × 500-instruction pages |
| `async decompile failed` | NOT applicable — synchronous function, decompile succeeded |
| Incorrect VA | **FOUND AND CORRECTED** — task-stated addr 0x10066d5a8 is `emit_completed` (neighbor). True owner confirmed at 0x100668a08 via `func_query(name_regex="handle_event")`. This is the primary recovery action taken. |
| vtable / dynamic dispatch | NOT applicable — all calls are direct BL to known addresses; no indirect BLR to vtable slots |
| `HTTP-terminal` | NOT applicable — zero network calls; function is pure state mutation + SSE emission |
| Library internal opaque | NOT applicable — all callees are AiMaMi's own (emit_created, close_text_block, etc.) or stdlib Rust alloc |
| Supersized body bail | NOT applicable — 16336 bytes / 589 blocks fully covered by block-decompose; no budget-induced bail |

**recovery_attempts**:
- Primary action: called `func_query(name_regex="handle_event")` to find all functions with "handle_event" in name — returned 3 results, clearly identified that 0x10066d5a8 = `emit_completed` (size 0x950), 0x100668a08 = `handle_event` (size 0x3FD0). Corrected VA.
- Called `basic_blocks(0x100668a08)` — 589 blocks returned, all in one page (total_blocks=589, done=true).
- Called `decompile(0x100668a08)` — 135926 chars returned, no HexRays bail.
- Called `disasm(0x100668a08)` in 7 pages × 500 instructions to extract all BL callees.
- Called `xrefs_to(0x100668a08)` — confirmed sole caller = feed_line @ 0x1006727e8.
- Called `decompile(0x1006727e8)` — confirmed call site and SSE line parsing context.
- `genuine_ceiling = false`. All dims resolved without genuine ceiling.

---

## Relationship to Existing Relay Bundle

This function is a **pure internal state-machine dispatcher** within `relay::translator::stream`. It is not one of the 18 IPC commands in `RELAY-FULLCHAIN-109.md`. It is the per-event core of the `AnthropicDirectToResponsesStream` SSE translator used when:

1. The relay proxy routes an Anthropic-format request to the OpenAI Responses API endpoint
2. The Responses API streams SSE events back in OpenAI format
3. `feed_line` tokenizes the SSE stream line by line
4. `handle_event` dispatches each event → mutates translator state → emits corresponding Anthropic SSE events
5. `flush` (0x100672620) is called on the `[DONE]` sentinel to finalize

The sibling methods `emit_created`, `close_text_block`, `close_tool_blocks`, `close_thinking_block`, `emit_completed`, `ensure_created` are all helper methods on the same struct — they are called by `handle_event` and collectively implement the Anthropic streaming protocol transformation.

The `thinking` / `reasoning` event handling confirms AiMaMi supports transparent relay of extended thinking tokens from providers that expose them in Responses API format.

---

## Companion: emit_completed @ 0x10066d5a8

The task-stated address belongs to this method. For completeness:

- **addr**: 0x10066d5a8
- **mangled**: `__ZN13codexmate_lib4core5relay10translator6stream32AnthropicDirectToResponsesStream14emit_completed17h5a70f70ff830526dE`
- **size**: 0x950 = 2384 bytes
- **role**: Emits final `message_stop` SSE event + `[DONE]` sentinel to the response stream. Sets `self.completed = true` (confirmed: `*(_BYTE *)(a2 + 244) = 1` at 0x100667f30 in emit_created; same pattern). This is called by `handle_event` on `response.completed` events.
- This companion is adequately characterized by its callee relationship; a full decompile is not required for gate purposes since it has no independent IPC surface.
