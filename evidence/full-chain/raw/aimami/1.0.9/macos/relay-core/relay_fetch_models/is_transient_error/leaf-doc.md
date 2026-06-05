# is_transient_error — relay_fetch_models cluster

**VA**: `0x100238948`  
**Owner**: `codexmate_lib::core::relay::fetch_models::is_transient_error::h2ca96654d31d0f62`  
**SHA12**: `1db044e8efab`  
**Session**: `relay-missed-109`  
**Machine**: `<workstation>`  
**Produced**: 2026-06-03  

## Role

Classifies whether a relay fetch error is transient (should be retried) or permanent. Used by the retry logic in `fetch_openai_async` to decide whether to retry a failed model-list fetch.

## Interface

**Input**: `(str_ptr, str_len)` — error message string  
**Output**: `bool` (1 = transient, 0 = not transient)

## Transient Error Patterns (checked via lowercase substring match)

| Pattern | Match type |
|---------|-----------|
| `"request failed"` | substring |
| `"timed out"` | substring + exact length-9 byte match |
| `"timeout"` | substring + exact length-7 byte match |
| `"connection"` | substring + exact length-10 byte match |
| `"size overflows MAX_SIZE"` | substring (from http::HeaderMap capacity overflow) |
| `"extraHeaders must be a JSON object"` | substring (from parse_extra_headers validation error) |

**Note**: The last two patterns (`size overflows MAX_SIZE`, `extraHeaders must be a JSON object`) appear in the pattern string but are unlikely to cause retries in practice — they are structural errors from `parse_extra_headers` and `HeaderMap::try_with_capacity`.

## Logic

1. Lowercase the error message string (heap-allocates if needed)
2. Multi-stage substring search: if string length > 14, search full pattern; fall back to progressively shorter patterns
3. Byte-comparison fast paths for exact-length matches (`"timed out"` = 9, `"timeout"` = 7, `"connection"` = 10)
4. Free lowercase allocation if heap-allocated
5. Return bool

## Call-tree

Terminal leaf — all callees stdlib/alloc:
- `str::to_lowercase` (alloc)
- `str::pattern::StrSearcher::new` + `next_match` (stdlib)
- `__rust_dealloc` (allocator)

**terminated_reason**: all callees are stdlib/allocator primitives

## Gate Status

- dim2: Accepted (owner + pseudocode confirmed)  
- dim3: Accepted (terminated at stdlib, depth=1)  
- dim4: Accepted (`(str_ptr, len) -> bool`; no error path)  
- dim5: macOS only; Windows Unknown  
- dim1/dim6: Unknown  

**overall**: `in-progress` / not gate-promoted
