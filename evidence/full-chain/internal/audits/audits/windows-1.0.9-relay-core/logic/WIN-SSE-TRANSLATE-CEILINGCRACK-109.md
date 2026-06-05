# WIN-SSE-TRANSLATE-CEILINGCRACK-109

**Session**: <audit-session>
**Machine**: <workstation>
**Binary**: AiMaM 1.0.9 win64.exe  
**SHA-256**: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b  
**Date**: 2026-06-03  
**Scope**: feature — relay_sse cluster, Windows x64  
**was_drop_in_place_only**: false — true poll body confirmed at 0x140835420  
**caller_disambiguation_tried**: true  
**genuine_ceiling**: false  
**gate_tier**: consumerStartReady (Windows relay_sse new cluster; dim6 missing; dim5 Win-only now confirmed)  

---

## Summary

This document distills the Windows x64 IDA evidence for the ceiling-crack task targeting `sse_translate_stream` / `relay_sse` cluster.

On macOS, `sse_translate_stream` was ICF-blocked — the true `UnfoldState` poll body was merged into `bridge_http_response_to_codex_ws@0x100097208`. On Windows **the situation is different**: the bridge function (`sub_140835420`) is a standalone, fully decompilable 7913-byte state machine with 294 basic blocks. The `was_drop_in_place_only` observation does not apply here — the function is real poll body, not a destructor.

---

## 1. bridge_http_response_to_codex_router_ws_sys (Win)

**Address**: `0x140835420`  
**Size**: 0x1EE9 bytes (7913), 294 basic blocks  
**IDA comment**: appended session <audit-session>  

### State machine layout (offset +280 = state discriminant byte)

| State | Behavior |
|-------|----------|
| 0 | Entry: copy HTTP response headers; read status@+248; check non-2xx; extract x-aimami-reason; route to WS send or error |
| 1,2 | Resume states (sub_141208950/970 panic handlers) |
| 3 | Retry LABEL_22 path |
| 4 | Inner sub-state machine at @+626 (0/1/2/3) for x-aimami-reason header injection |
| 5 | LABEL_20: SSE line buffer loop; [DONE] sentinel check; WS send |
| 6 | LABEL_40: non-2xx error path (HTTP status not in 200-299 range) |
| 7 | LABEL_73: WS send sub-state |

### field behavioral facts

**HTTP status check** (state 0):
```
(unsigned __int16)(*(_WORD*)(a2+248) - 200) > 0x63u
// i.e. HTTP status not in [200,299] → error path (LABEL_22)
// matches macOS: status range check same
```

**x-aimami-reason header extraction** (state 0 / state 4):
- xmmword at `0x14129D180` and `0x14129D190` = SSE header name constants
- Call `sub_140189160(a2+144, &v176)` = header lookup function
- String `"x-aimami-reason"` at `0x14129D1D0` (len 15)
- On success: copies to WS response slots v6[22..23]
- Fallback: `v6[20].m128i_i64[0] = 0x800000` (default reason code)

**[DONE] sentinel check** (state 5 inner loop, LABEL_195):
```c
// At offset v128 in SSE buffer:
if (*(_DWORD*)v128 ^ 0x4E4F445B | *(unsigned __int16*)(v128+4) ^ 0x5D45)
// 0x4E4F445B = bytes 5B,44,4F,4E = '[','D','O','N' (little-endian)  
// 0x5D45 = 'E',']'
// Combined: "[DONE]" (6 bytes) — CONFIRMED same as macOS
```

**SSE line buffer**:
- Buffer at offsets `[a2+424]` (capacity), `[a2+432]` (len), `[a2+440]` (data ptr)
- 1 MB limit check: `v154 >= 0x100001` → error path `unk_14129CD80`
- `memcpy((void*)(v117[27].m128i_i64[0] + v153), v152, v151)` — append SSE chunk

**WS send** (state 5 / state 7):
- `sub_140852EA0(&v194, &v6[42].m128i_u64[1], v5)` — axum WebSocket::send async
- Same function used in `handle_codex_active_ws_core_sys` and `handle_codex_by_provider_ws_state_machine_sys`

**SSE Content-Type injection**:
- xmmword `0x14129D1A0` = `"text/event-stream"` referenced at state 0
- Written into response headers at `v6[19]` slots when constructing SSE response

**router.ws.bridge_failed error**:
- String `"[AiMaMi][codex-router-ws] bridge failed: "` at `0x14129CE80` → xref `handle_codex_router_ws_core_sys@0x14082B16C`
- Metric field `"router.ws.bridge_failed"` at `0x14129CEAC`

---

## 2. handle_codex_router_ws_core_sys (Win)

**Address**: `0x140829EC0`  
**Size**: 0x3B49 bytes (15177), 371 basic blocks  
**State discriminant**: `[r14+0x4E9]` (outer 8-case switch)  
**IDA comment**: pre-existing from relay-missed-109; new comment appended at 0x14082B16C  

### Feature-A 3-condition decision

The macOS equivalent had `handle_codex_by_provider_ws true poll body@0x100095390` with 3-condition check: `codexRouterEnabled@+0x794 + activeByIde@+0x840 + blockOfficialPassthrough@+0x795`. 

On Windows, the relay state struct is deserialized by `relay_state_deser_fields_sys@0x1407E8050`:

| Field | Case | Struct offset |
|-------|------|--------------|
| `schemaVersion` | 0 | +0 |
| `providers` | 1 | (list at +v61/v64) |
| `activeByIde` | 2 | string field `"RelayActiveByIde"@0x14127C2D2` |
| `proxy` → `RelayProxyStatus` | 3 | v45/v72 |
| `codexRouterEnabled` | 4 | struct+292 (byte) |
| `blockOfficialPassthrough` | 5 | struct+293 (byte) |

After deserialization, the full struct (0x120 bytes) is `memcpy`'d into calling context at offset +0 of handle output, with:
- `v25[72]` = schemaVersion int
- `v25[292]` = codexRouterEnabled byte  
- `v25[293]` = blockOfficialPassthrough byte

The relay state struct layout confirmed at Win: byte flags packed at +292/+293 (same relative positions as mac `+0x794`/`+0x795` in overall ws_state struct — different base, same relative encoding).

### Sub-function callees in handle_codex_router_ws_core_sys

| Function | Role |
|----------|------|
| `sub_140835420` | bridge_http_response_to_codex_router_ws_sys (this session) |
| `forward_codex_responses_internal_sys@0x140838820` | SSE→WS forwarding (relay-missed-109) |
| `by_provider_request_broker_sys@0x140833920` | WS broker (relay-missed-109) |
| `build_upstream_url_and_headers_sys@0x14013C9F0` | URL builder (relay-closeout-109) |
| `sub_140833E30` | WS session state machine (relay-missed-109) |
| `sub_1408445B0` | route/broker dispatch |
| `router_ws_http_error_handler_sys@0x14012A100` | HTTP error formatter |

---

## 3. relay_image_compat_set_impl_sys (Win)

**Address**: `0x1400A5EB0`  
**Size**: 0xDF9 bytes (3577)  
**Handler**: `relay_image_compat_set_handler_sys@0x14027A1B0`  

### config.toml write path

```
codex_paths_build_from_env_sys  → get CodexPaths
codex_paths_join_all_subpaths   → build config.toml path
sub_14104DEE0                   → read config.toml bytes
```

### Section detection (SSE byteswap pattern)

```c
// Searches for [features] section:
v13 = *v15 ^ 0x657275746165665BLL | *((unsigned __int16*)v15 + 4) ^ 0x5D73LL;
// 0x657275746165665B = "[featur" reversed, 0x5D73 = "es]" → "[features]"

// Searches for image_generation field:  
v17 = _byteswap_uint64(*v15);   // = 0x696D6167655F6765 = "image_ge"
v17 = _byteswap_uint64(v15[1]); // = 0x6E65726174696F6E = "neration"
// Together: "image_generation"
```

### 3 insertion paths (same as macOS)

| Path | Condition | Action |
|------|-----------|--------|
| Found in section | `(v100 & 1) != 0` | Replace existing `image_generation = ...` line in-place |
| After newline | `v31 == true` (no section found) | Append newline + `[features]` header + `image_generation = false` |
| Before section | `v11 & 1` (section found but field absent) | Insert before existing `[features]` section |

### enabled=false behavior

When `a2 == 0` (enabled=false): removes `image_generation = false` line (the `~(_BYTE)v100 & v96 & v9` deletion path).

### Atomic write

`sub_1400D2320` = atomic temp-file write (matches macOS pattern).

### String constants

- `"image_generation = false"` at `0x1412585C0` (len 24)
- `"set_image_compat"` at `0x141268D1C`
- `"enabled"` param at `0x14126925B`

---

## 4. relay_sse cluster — Win new analysis

The `relay_sse` cluster was `consumerStartReady_icf_candidate` on macOS (ICF-blocked). On Windows:

- No ICF fold on `bridge_http_response_to_codex_router_ws_sys` — full state machine at `0x140835420`
- The `futures::stream::unfold` panic at `0x1412844C4` has 3 xrefs to separate poll bodies:
  - `0x1404F8BF0` (size 0x1098)
  - `0x1404FA7F0` (size 0x1043)  
  - `0x1404FC1A0` (size 0x1265)
- These 3 functions are the Windows `sse_translate_stream` state machine bodies (ChatToResponsesStream, AnthropicDirectToResponsesStream, one more)

**Ceiling status**: dim2 partially open (bridge body confirmed; 3 unfold poll bodies identified but not yet decompiled). The bridge body (`sub_140835420`) is `was_drop_in_place_only=false` — genuine poll body. The macOS ICF ceiling does NOT apply on Windows.

**Upgrade path**: decompile the 3 unfold poll bodies to close dim2 fully for relay_sse Win. This session closes dim1 (SSE bridge behavior) and confirms the architecture.

---

## 5. Struct offsets confirmed (Win)

| Field | Offset in relay state struct | Source |
|-------|------------------------------|--------|
| `codexRouterEnabled` | +292 (byte) | relay_state_deser_fields_sys case4 |
| `blockOfficialPassthrough` | +293 (byte) | relay_state_deser_fields_sys case5 |
| HTTP status (ws_state) | +0x828 (word) | handle_codex_router_ws_core_sys disasm@0x14082A165 |
| SSE buffer capacity | +0x1A8 of bridge state | sub_140835420 offset +424 |
| SSE buffer data ptr | +0x1C8 of bridge state | sub_140835420 offset +456 |
| SSE buffer len | +0x1B8 of bridge state | sub_140835420 offset +440 |
| State discriminant (bridge) | +280 | sub_140835420 switch v8 |

---

## 6. Evidence quality

| Dimension | Status | Evidence |
|-----------|--------|----------|
| dim1 (frontend CCF/UI-state) | product_decision (internal dispatch, no direct UI) | same as mac |
| dim2 (backend owner/pseudocode) | partial-open | bridge@0x140835420 fully decompiled; 3 unfold bodies identified not yet decompiled |
| dim3 (call-tree depth) | partial | bridge→WS send confirmed; unfold bodies not traced |
| dim4 (interface/DTO/error/side-effect) | partial | [DONE] sentinel, x-aimami-reason, 1MB limit, HTTP status range, text/event-stream confirmed |
| dim5 (same-platform gate) | Win-only evidence this session | A-level |
| dim6 (test/acceptance mapping) | missing | pending |

**was_drop_in_place_only**: false  
**genuine_ceiling**: false (unfold poll bodies are reachable; bridge body is real)  
**caller_disambiguation_tried**: true (confirmed via xrefs and callees)  

---

## 7. IDA renames/comments applied

| Address | Name/Comment |
|---------|-------------|
| `0x140835420` | bridge_http_response_to_codex_router_ws_sys (func comment) |
| `0x14082B16C` | handle_codex_router_ws_core_sys (line comment) |
| `0x1407E8050` | relay_state_deser_fields_sys (func comment) |
| `0x140835693` | SSE bridge state0 detail (line comment) |
| `0x1400A5EB0` | relay_image_compat_set_impl_sys (func comment) |
| `0x14027A1B0` | relay_image_compat_set_handler_sys (func comment) |
| `0x1404F8BF0` | unfold_poll_0_sys (func comment) |
| `0x1404FA7F0` | unfold_poll_1_sys (func comment) |
| `0x1404FC1A0` | unfold_poll_2_sys (func comment) |

IDB saved: `<source-location>\raw\binary\AiMaM 1.0.9 win64.exe.i64`

---

## 8. vtable poll body decompile — CLOSED (session <audit-session>)

**Owner gate**: ALLOW (<workstation>, bundle_manifest, write_mode=owner)  
**Date**: 2026-06-03  
**was_drop_in_place_only**: false (all 3 bodies confirmed real poll bodies)  
**genuine_ceiling**: false  
**caller_disambiguation_tried**: true (vtable slots identified via xrefs_to)

### 3 unfold poll bodies — all decompiled

| Address | Identity | Translator callees | Vtable ptr |
|---------|----------|--------------------|------------|
| `0x1404F8BF0` | `sse_translate_stream_passthrough_poll_sys` — raw SSE passthrough | `sub_140248910` (feed) / `sub_140248690` (flush) — generic byte-copy, no translation | `0x141285390` |
| `0x1404FA7F0` | `sse_translate_stream_anthropic_to_openai_poll_sys` — AnthropicToOpenAi stream | `translator_anthropic_to_openai_feed_line_sys@0x14022B9B0` / `flush@0x14022B7F0` | `0x141285368` |
| `0x1404FC1A0` | `sse_translate_stream_openai_to_anthropic_poll_sys` — OpenAiToAnthropic stream | `translator_openai_to_anthropic_feed_line_sys@0x140238970` / `flush@0x140238700` | direct call from wrapper (not vtable) |

### vtable dispatch chain

```
bridge_http_response_to_codex_router_ws_sys@0x140835420
  └── sse_translate_stream_vtable_dispatch_sys@0x140831850   [2 call sites: 0x1408357b2, 0x140835a82]
        └── (v6[1] + 24): dyn Stream::poll_next() dispatch
              ├── vtable@0x141285368 → sse_translate_stream_anthropic_to_openai_poll_sys@0x1404FA7F0
              ├── vtable@0x141285390 → sse_translate_stream_passthrough_poll_sys@0x1404F8BF0
              └── wrapper@0x1403800A0 → sse_translate_stream_openai_to_anthropic_poll_sys@0x1404FC1A0
                    └── via outer wrapper sub_140616E70@0x140616E70 (vtable@0x141272770)
```

**vtable dispatch mechanics**: `sub_140831850` drives the poll loop. The fat pointer is `(data_ptr, vtable_ptr)`. Slot index at `vtable+24` = `poll_next()` (slot 3, 3×8=24 bytes). State machine discriminant at `a2+81` (byte, cases 0/1/2/3).

### dim2-dim3 closure status

| Dimension | Status | Evidence |
|-----------|--------|----------|
| dim2 (backend owner/pseudocode) | **CLOSED** | all 3 poll bodies decompiled via IDA HexRays; bridge@0x140835420 (294BB); vtable dispatch@0x140831850 confirmed |
| dim3 (call-tree depth) | **CLOSED** | bridge→vtable_dispatch→poll_body→translator_feed/flush→(memcpy/string ops) depth≥5; translator leaf functions confirmed |
| dim4 (interface/DTO/error/side-effect) | partial-closed | [DONE] sentinel, x-aimami-reason, 1MB limit, HTTP status [200,299] range, text/event-stream, WS send@0x140852EA0 all confirmed; translator field remapping via feed_line/flush callees |
| dim5 (same-platform gate) | **CLOSED** | Win-only evidence; IDB saved |
| dim6 (test/acceptance mapping) | missing | pending |

### Translator identity confirmed

- **passthrough** (`0x1404F8BF0`): No translation — uses generic `sub_140248910` (feed) / `sub_140248690` (flush). Corresponds to `RelayTranslationMode::None` or direct passthrough path.
- **AnthropicToOpenAi** (`0x1404FA7F0`): `translator_anthropic_to_openai_feed_line_sys` identified (IDA already named from prior session). Corresponds to incoming Anthropic-format SSE being converted to OpenAI responses format.
- **OpenAiToAnthropic** (`0x1404FC1A0`): `translator_openai_to_anthropic_feed_line_sys` + `translator_openai_to_anthropic_flush_sys` (newly identified this session). Also calls `sub_140231E60` for error/skip cases and `sub_140231B90` (flush variant).

### IDA comments applied (this session)

| Address | Name/Comment |
|---------|-------------|
| `0x1404F8BF0` | sse_translate_stream_passthrough_poll_sys (func comment) |
| `0x1404FA7F0` | sse_translate_stream_anthropic_to_openai_poll_sys (func comment) |
| `0x1404FC1A0` | sse_translate_stream_openai_to_anthropic_poll_sys (func comment) |
| `0x140831850` | sse_translate_stream_vtable_dispatch_sys (func comment) |
| `0x1403800A0` | sse_translate_stream_openai_to_anthropic_wrapper_sys (func comment) |
| `0x140616E70` | sse_translate_stream_openai_to_anthropic_outer_sys (func comment) |
| `0x14022B9B0` | translator_anthropic_to_openai_feed_line_sys (func comment) |
| `0x14022B7F0` | translator_anthropic_to_openai_flush_sys (func comment) |
| `0x140238970` | translator_openai_to_anthropic_feed_line_sys (func comment) |
| `0x140238700` | translator_openai_to_anthropic_flush_sys (func comment) |

IDB saved: `<source-location>\raw\binary\AiMaM 1.0.9 win64.exe.i64`

### Gate update

**relay_sse Win**: upgraded from `consumerStartReady_candidate` (dim2 partial) → **`strictImplementationUse`** (dim2+dim3+dim4+dim5 closed; dim6 missing).  
dim6 (test/acceptance mapping) remains open — pending.

---

## 9. Next steps (post-vtable-crack)

1. ~~Decompile `0x1404F8BF0`, `0x1404FA7F0`, `0x1404FC1A0`~~ — DONE
2. ~~Trace call-tree from each unfold poll body~~ — DONE (depth≥5 confirmed via translator chain)
3. ~~Confirm SSE chunk parse → TranslatorState field remapping → WS output format~~ — DONE (translator_feed_line/flush callees confirmed)
4. Confirm `image_compat` branch in `make_relay_model_info` equivalent on Win (separate relay_image_compat scope, already tracked)
5. Write dim6 (test/acceptance mapping) to promote relay_sse Win to `readyToImplement`
6. Update INDEX.jsonl + REVERSE-STATUS.md SoT
