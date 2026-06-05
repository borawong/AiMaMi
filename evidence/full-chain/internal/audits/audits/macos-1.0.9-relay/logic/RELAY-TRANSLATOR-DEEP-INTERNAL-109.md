# RELAY-TRANSLATOR-DEEP-INTERNAL-109 — responses_to_anthropic_request Internal-Impl

**produced_at**: 2026-06-04
**binary_sha256**: 985dae00be620b21164b4a8d35cc0379b750d5a6257b25897b0e813441e4d706
**idb_sha256**: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482
**platform**: macos-arm64
**session**: <audit-session>
**machine**: <workstation>
**scope**: relay::translator::responses_to_anthropic_request (internal impl, not an IPC command)

---

## Function Identity

**addr**: 0x10063d538
**mangled**: `__ZN13codexmate_lib4core5relay10translator30responses_to_anthropic_request17hb93eec99b516997aE`
**demangled**: `codexmate_lib::core::relay::translator::responses_to_anthropic_request::hb93eec99b516997a`
**size**: 20392 bytes
**basic_blocks**: 879
**type**: synchronous transformation function — NOT async, NOT a shim, NOT drop_in_place
**source_file**: `src/core/relay/translator.rs` (confirmed via panic site refs to off_1012D6520 "src/core/relay/translator.rs")

---

## dim1 — Real Body Confirmed

This is the true body at 0x10063d538. Confirmed evidence:

- IDA HexRays decompiled 176629 chars of pseudocode (returned successfully, no bail)
- Signature: `double __usercall responses_to_anthropic_request(const void *a1@<X1>, size_t a2@<X2>, _OWORD *a3@<X8>)` — the `double` return is HexRays artifact from `__usercall` / ABI mismatch; actual return is written via out-param `a3@<X8>` (X8 register)
- Function opens with callee-save register stacking (X28/X27/.../X19, X29/X30), 0x3D0 stack frame allocation — canonical Rust ABI prologue
- Panic sites reference `"src/core/relay/translator.rs"` literal, line 43 (`0x2B` = +43)
- NOT async: no async_fn_env, no Future::poll, no generator resume, no discriminant state-machine
- NOT a shim: full business logic in body, 879 basic blocks, 4920+ instructions

---

## dim2 — Behavior / Logic

### Purpose

Translates upstream OpenAI-compat response JSON → Anthropic-format request JSON for downstream relay passthrough. This is the **response→request remapping** step in AiMaMi's bidirectional relay translator. The relay intercepts Codex's upstream request, forwards it to the configured provider, receives the provider response in one format, and must remap it back to Anthropic format before returning to the Codex process.

### Input Parameters

- **X1 (a1)**: `*const serde_json::Value` — pointer to the upstream response JSON root object (provider's response in OpenAI/raw format)
- **X2 (a2)**: `usize` — length/size parameter (likely string or buffer length)
- **X8 (a3)**: `*mut _OWORD` — output buffer pointer (16-byte aligned); the translated Anthropic-format JSON `Value` is written here

### High-Level Algorithm (block-decomposed from disassembly)

**Phase 1 — Preamble + billing header strip (0x10063d538–0x10063d5d4)**

1. Index into input JSON: `input["text_delta"]` (field length 10 from `aTextDeltamessa+0x1D`) via `serde_json::Value::index_into`
2. If result is present AND tag byte == 3 (String variant): call `strip_billing_header` (0x10062ac40) on the `text_delta.text` field — strips any billing/watermark prefix from response text
3. If `strip_billing_header` returns non-null (result len != 0): store stripped text and length in local state for later injection
4. Otherwise: store sentinel 0x8000000000000000 (empty/None marker)

**Phase 2 — Message array iteration (0x10063d5d4–0x10063d6e0)**

5. Index into input JSON: `input["model"]` (field len 5 from `_anon...169`) via `index_into`
6. Guard: must be serde_json Array variant (tag == 4) with non-zero length
7. Load array base pointer (X28) and compute end pointer (X27 = X28 + count * 32)
8. Loop setup: `type_key = "type"` (4-byte literal, from `_anon...37`)
9. Begin iteration loop over each message entry in the array (32-byte entries, stride 32)

**Phase 3 — Per-message type dispatch (0x10063d638–0x10063d7cc)**

For each array entry (32-byte serde_json::Value slot):

10. Index: `entry["type"]` via `index_into` — must be String (tag 3)
11. Compare String content by length then bytes:
    - length == 13, bytes == `"function_call"` → jump to `loc_10063F084` (function_call handler)
    - length == 7, bytes == `"message"` → jump to `loc_10063D7AC` (message handler)
    - length == 9, bytes == `"reasoning"` → fall through to reasoning handler
    - length == 20, bytes == `"function_call_output"` → jump to `loc_10063D76C` (function_call_output handler)
    - length == 13, bytes == `"function_call"` (second check via `loc_10063D638` direct compare) → same function_call path

**Phase 4 — "reasoning" type handler (0x10063d6e0–0x10063d6fc)**

12. Call `extract_reasoning_summary_text` (0x10063d464) on current message entry with state buffer
13. If result is empty (cbz on len): skip, continue loop
14. Otherwise: store reasoning text + length in local accumulators

**Phase 5 — "message" type handler (0x10063d7ac–0x10063d844)**

15. Verify type string = "message" (4-byte then 3-byte check: `0x7373656D` + `0x65676173`)
16. Index: `entry["role"]` (field "role", 4 bytes from `aThinkingidenti+0x58`)
17. Must be String (tag 3); read len + ptr
18. Branch on role string length:
    - len == 6 → jump `loc_10063E2D4` (likely "system" role)
    - len == 9, bytes == "developer" → `loc_10063E30C`
    - otherwise: set `var_3E0 = 1` (unknown role flag), W26 = 9 (len), ptr stored

**Phase 6 — "function_call_output" type handler (0x10063d76c–0x10063d89c)**

19. field: `"call_id"` (7 chars from `aCallIdcallUnkn`), then fallback `"call_unknowntool_call_id"` pool
20. If call_id String present: alloc buffer, copy call_id bytes; otherwise: W22 = 0xD (13), load "toolu_unknowntool_result" literal from rodata
21. Call `flatten_function_call_output` (0x100639740) on `entry["output"]` field — flattens nested output into Vec
22. Alloc 4-byte buffer, write `"type"` field; insert into output BTreeMap via `BTreeMap::entry`
23. Alloc 11-byte buffer, write `"tool_result"` field; insert into output BTreeMap

**Phase 7 — BTreeMap construction + output JSON assembly (recurring pattern)**

The function repeatedly builds serde_json::Map (backed by BTreeMap<String, Value>) entries:

- Keys written by direct alloc + memcpy: `"type"` (4), `"tool_result"` (11), `"tool_use_id"` (11), `"content"` (7), `"role"` (4), `"user"` (4), `"id"` (2), `"name"` (4), `"input"` (5), `"cache_control"` (13), `"max_tokens"` (10), `"system"` (6), `"instructions"` (11)
- Values: serde_json::Value variants (String=3, Array=4, Object=5, Null=0, Bool=1/2)
- BTreeMap::entry pattern: first try `entry()` (Occupied → use existing; Vacant → `insert_entry`)
- Vec grow: `RawVec::grow_one` when content array reaches capacity

**Phase 8 — content array merge (0x10063df00–0x10063df5c)**

24. Accumulate translated content blocks into a local Vec<serde_json::Value>
25. Each content block: 32-byte slot (tag at offset 0, payload at +8..+24)
26. After all messages processed: drain and serialize the accumulated content Vec

**Phase 9 — system/instructions field injection (0x1006403a4–0x1006403e4)**

27. If `var_3A0 != 0x8000000000000000` (billing-stripped text was found):
    - Build `{ "role": "user", "content": stripped_text }` message entry
    - Call `index_or_insert("system")` on output map — creates or replaces "system" field
    - Write stripped text as String value to "system" field

**Phase 10 — stop_sequences / max_tokens field passthrough (0x1006403e8–0x100640450)**

28. Index `input["stop_sequences"]` (11 chars from `aStreamparallel+0x19`)
29. Branch on JSON type tag:
    - 0 = Null: store Null
    - 1/2 = Bool: copy raw 16-byte slot
    - 3 = String: copy string
    - 4 = Array: call `to_vec::ha5f87d8554735514` to clone array
    - 5 = Object: Null fallback
30. Index `input["max_tokens"]` (10 chars, "max_tokens") + fallback `"max_completion_tokens"` field pool
31. Serialize max_tokens value via `serde_core::ser::Serialize`; insert into output map

**Phase 11 — tools/function definitions remapping (0x10063f084 and surrounding)**

32. "function_call" type handler: index `entry["call_id"]`, `entry["name"]`, `entry["arguments"]` 
33. Remap to Anthropic tool_use block: `{ "type": "tool_use", "id": call_id|"toolu_unknown", "name": fn_name, "input": parsed_json_arguments }`
34. Clone/convert via `BTreeMap::clone_subtree` when arguments is Object variant

**Phase 12 — role normalization**

35. Input "assistant" / "developer" / "user" roles pass through; "system" role content moves to top-level "system" field
36. "user" role (4-byte ASCII `0x72657375`) check at `loc_10063DCE8`; "user" string literal alloc 4 bytes

**Phase 13 — web_search tool_result injection (0x100640e70–0x100640f18)**

37. If `var_2C0 != 0` (web_search tool was present in input):
    - Load web_search prompt text from `aBudgetTokensyo+0xD` (0x1CE = 462 bytes: "You have a web_search tool available. U...")
    - Index `input["system"]` (6 chars) — if String: format_inner with web_search prompt appended
    - Otherwise: alloc 462 bytes, memcpy raw web_search prompt text
    - Final system string injected into output["system"]

**Phase 14 — Output finalization (0x10064142c–end)**

38. Write final content array as Value::Array (tag 5) to out-param struct at X25 + 1..+0x11
39. Deallocate intermediate buffers
40. If temporary alloc exists (X19 != 0): dealloc via `___rust_dealloc`
41. RET through epilogue at `loc_1006424DC` — function does not return anything in X0/D0; result is entirely in the `*mut _OWORD` out-param

---

## dim3 — Callees Confirmed

All callee calls confirmed by disassembly instruction-level refs:

| Callee | Address | Role |
|---|---|---|
| `serde_json::Value::index_into` | 0x100cfa118 | JSON field access (read-only) |
| `serde_json::Value::index_into_mut` | 0x100cfa200 | JSON field access (mutable, for tool_result content write) |
| `serde_json::Value::index_or_insert` | 0x100cfa2e8 | JSON field get-or-create (system/instructions) |
| `strip_billing_header` | 0x10062ac40 | Billing prefix strip from text_delta |
| `extract_reasoning_summary_text` | 0x10063d464 | Reasoning block text extraction |
| `flatten_function_call_output` | 0x100639740 | Flatten function_call_output content |
| `BTreeMap::entry` | 0x100201144 | BTreeMap entry API (Occupied/Vacant) |
| `BTreeMap::insert` | 0x100201428 | BTreeMap direct insert |
| `VacantEntry::insert_entry` | 0x100444ba4 | BTreeMap vacant entry insertion |
| `BTreeMap::clone_subtree` | 0x100212cfc | Clone BTreeMap for arguments object |
| `RawVec::grow_one` | 0x100dae1cc | Vec capacity growth |
| `serde_core::ser::Serialize` | 0x10015589c | Serialize ref to serde_json value |
| `serde_json::value::to_value` (x2) | 0x100158f34, 0x100158dc8 | Convert typed value to serde_json::Value |
| `to_vec::ha5f87d8554735514` | 0x1004d3bb4 | Clone array slice to Vec |
| `String::clone` | 0x100d62688 | Clone String |
| `drop_in_place<serde_json::Value>` | 0x10067a9b4 | Drop/free serde_json Values |
| `format_inner` | 0x100d60b34 | Format string (web_search system text) |
| `___rust_alloc` | 0x1000013d8 | Heap allocate |
| `___rust_dealloc` | 0x1000013dc | Heap deallocate |
| `___rust_no_alloc_shim_is_unstable_v2` | 0x1000013e8 | Alloc shim (called before each alloc) |
| `handle_alloc_error` | 0x100db4204 | OOM abort |
| `unwrap_failed` | 0x100db45b0 | Panic on Result::Err |
| `unwrap_failed (option)` | 0x100db4594 | Panic on Option::None |
| `_memcpy` | 0x100db5318 | Memory copy |
| `_memcmp` | 0x100db530c | Memory compare |

---

## dim4 — DTO / Error / Side-Effect

### Input DTO (serde_json::Value passed at X1)

Expected upstream (OpenAI-compat) response shape:
```json
{
  "model": [ { "type": "message|reasoning|function_call|function_call_output", ...fields }, ... ],
  "text_delta": { "text": "<possibly billing-prefixed text>" },
  "stop_sequences": null | [...],
  "max_tokens": 4096,
  "max_completion_tokens": 4096,
  "system": "optional system prompt string",
  "stop_sequences": [...]
}
```

Per-entry fields by type:
- `"message"`: `{ "type": "message", "role": "user"|"assistant"|"system"|"developer", "content": string|array }`
- `"reasoning"`: `{ "type": "reasoning", "content": string }` — extracted by `extract_reasoning_summary_text`
- `"function_call"`: `{ "type": "function_call", "call_id": "id_str", "name": "fn_name", "arguments": "{...json_str}" }`
- `"function_call_output"`: `{ "type": "function_call_output", "call_id": "id_str", "output": value }`

### Output DTO (written to *mut _OWORD at X8)

Anthropic Messages API request shape:
```json
{
  "role": "user",
  "content": [
    { "type": "tool_result", "tool_use_id": "call_id|toolu_unknown", "content": [...] },
    { "type": "tool_use", "id": "call_id|toolu_unknown", "name": "fn_name", "input": {...} },
    { "type": "text", "text": "..." },
    { "type": "text", "format": "textformat", "text": "..." }
  ],
  "max_tokens": 4096,
  "system": "system_prompt_or_billing_stripped_text",
  "stop_sequences": [...],
  "id": "...",
  "name": "...",
  "input": "..."
}
```

### field Field Remappings (confirmed byte-level)

| Input field | Anthropic output field | Transform |
|---|---|---|
| `model[].type == "message"` | `content[].type = "text"` (field written as 7-byte "content") | Role normalization |
| `model[].type == "function_call"` | `content[].type = "tool_use"`, `id = call_id`, 
ame`, `input = parsed_json(arguments)` | tool_use block |
| `model[].type == "function_call_output"` | `content[].type = "tool_result"`, `tool_use_id = call_id`, `content = flattened_output` | tool_result block |
| `model[].type == "reasoning"` | extracted text stored; dropped from output content (reasoning is advisory) | strip |
| `text_delta.text` | `system` field (if billing prefix stripped successfully) | billing strip + inject |
| `stop_sequences` | `stop_sequences` (pass-through, Array clone) | direct |
| `max_tokens` / `max_completion_tokens` | `max_tokens` | first-wins fallback |
| `system` (if web_search active) | `system` with web_search prompt appended | format inject |
| `role: "system"` | top-level `system` field (via `index_or_insert("system")`) | hoist to top-level |
| `role: "developer"` | treated as `"user"` (same branch) | normalize |
| `role: "user"` | `"role": "user"` in output message | pass-through |

### Error Handling

- **Missing required fields**: `index_into` returns null → branch to skip/fallback (no panic, graceful)
- **Wrong JSON variant**: tag check fails → skip entry, continue loop (no error propagation)
- **Alloc failure**: `handle_alloc_error` → abort (OOM)
- **Result::Err on serde**: `unwrap_failed` → panic with `src/core/relay/translator.rs:43` source location
- **Option::None on serde**: `unwrap_failed` (option variant) → panic
- No `Result<T, E>` propagation — function does not return a Result; panics on unrecoverable errors, silently skips missing fields

### Side Effects

**None.** This is a pure synchronous JSON transformation function:
- No file I/O
- No network calls
- No Tauri event emit
- No keychain access
- No mutex/lock
- No persistence
- Heap allocations only (alloc/dealloc via Rust allocator)

---

## dim5 — Gate Assessment

**gate_tier**: `readyToImplement`

**Rationale**:
- dim1: real body confirmed, decompiled, not shim/drop/async
- dim2: full behavior mapped (all 14 phases, input/output shape, field-by-field remapping)
- dim3: all callees listed with addresses
- dim4: full DTO in/out, error handling, zero side effects confirmed
- Fake-wall taxonomy: exhausted (see recovery_attempts below)
- block_decomposed: true (879 blocks, disassembly walked in 200-instruction passes across full 4920-instruction range)

---

## Fake-Wall Taxonomy Exhaustion (Red Line 13 Compliance)

| Taxonomy item | Check result |
|---|---|
| `drop_in_place` / async shim | NOT applicable — body is synchronous, no state machine discriminant, no Future::poll |
| `architecture_only` / budget bail | NOT applicable — HexRays returned full 176629-char decompile; block-decompose walked all 4920 instructions |
| `async decompile failed` | NOT applicable — synchronous function, decompile succeeded |
| Incorrect VA | NOT applicable — addr confirmed by mangled symbol lookup in decompile result |
| vtable / dynamic dispatch | NOT applicable — no vtable slots, all calls are direct BL to known addresses |
| `HTTP-terminal` | NOT applicable — zero network calls, pure JSON transformation |
| Library internal opaque | NOT applicable — all callees are AiMaMi's own or stdlib Rust alloc; serde_json internals accessed via index_into which is callable |

**recovery_attempts**: None needed — all dims resolved without hitting genuine ceilings. HexRays decompile succeeded in one call (176629 chars). Block decompose used as primary traversal method (879 blocks, disasm in 200-instruction pages). No fake walls encountered. `genuine_ceiling = false`.

---

## Relationship to Existing Relay Bundle

This function is a **pure internal helper** within `relay::translator`. It is not one of the 18 IPC commands documented in `RELAY-FULLCHAIN-109.md`. It is called by the stream translation layer when:

1. The relay proxy receives a provider response in OpenAI format
2. The relay translator calls `responses_to_anthropic_request` to remap it to Anthropic format
3. The remapped JSON is then returned to the Codex process expecting Anthropic-format responses

The companion function `strip_billing_header` (0x10062ac40) and `extract_reasoning_summary_text` (0x10063d464) are also translator-internal helpers documented by cross-reference in this function.

The web_search tool injection (Phase 13) confirms AiMaMi supports injecting web_search system prompt into relayed requests — this is a behavioral capability not exposed in the IPC command layer.
