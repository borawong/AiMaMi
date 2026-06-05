# forward_codex_responses_internal — Evidence

**Product**: aimami **Version**: 1.0.9 **Platform**: macos  
**Binary SHA256**: `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`  
**IDA addr**: `0x1000987a0`  
**Mangled**: `__ZN13codexmate_lib4core5relay12proxy_server32forward_codex_responses_internal28_$u7b$$u7b$closure$u7d$$u7d$17h121413bdd485af0bE`  
**Session**: deep-mac-relay-proxy-server-20260602

## Confirmed

- Async closure that polls an upstream provider HTTP response and buffers or streams it back.
- Checks `text/event-stream` content-type header via ARM64 SIMD comparison (`*v45 == 0x6576652F74786574LL && v45->i64[1] == 0x61657274732D746ELL && v45[1].i8[0] == 109` → `text/event-stream`).
- Non-SSE path (2xx, non-event-stream): calls `collect_body_bytes_limited` (`0x100094f88`) to accumulate full response body, bounded to `0x800000` (8 MB).
- After collecting body: attempts UTF-8 parse (`core::str::converts::from_utf8`); on failure formats error `non-SSE response is not valid UTF-8: …`.
- On UTF-8 success: trims whitespace from body, writes to WebSocket via `axum::extract::ws::WebSocket::send` closure.
- SSE path (2xx + `text/event-stream`): enters streaming loop via `stream_sse_body_to_ws` closure dispatch (vtable call at `a2 + 632`).
- In SSE streaming loop: buffers lines into `a2 + 424` buffer (1 MB limit: `0x100000`), calls `take_next_sse_event` to extract `data:` lines, calls `sse_event_data_payload` to join and parse payload.
- Final SSE payload sent via `axum::extract::ws::WebSocket::send`.
- Error path: `upstream_error_with_reason` (`0x1002464c4`) builds a JSON `{error, aimami_proxy_error, code}` object, then calls `_$LT$axum::json::Json ... IntoResponse$GT$::into_response`.
- Header `x-aimami-reason` read from upstream response to propagate error reason into the error payload.
- `router.ws.http_error` string used as `x-aimami-route` value on upstream 4xx/5xx.
- `compact` path detected by content-type header for compact response format.
- Error string `no relay provider configured for codexrouter` (not an unknown — explicit string evidence).
- `local compact compatibility response` — local fallback when no valid upstream SSE was received.
- Circuit-breaker string evidence: `[AiMaMi] codex relay provider N failed; circuit open until T; reason: R`.
- `[AiMaMi][codex-router] takeover relay cascade failed after N candidates; return local compatibility response`.
- `[AiMaMi] image_url rejected by upstream; retrying with text fallback` — image_url tool fallback side-effect.
- `[AiMaMi] web_search tool rejected by upstream; retrying without it` — web_search tool retry side-effect.
- Call-tree terminal: `axum::extract::ws::WebSocket::send` (WS send = response_serialize terminal).

## Inferred

- The `stream_sse_body_to_ws` vtable dispatch (`a2 + 632`) is a trait object (Futures stream) that reads chunks from the upstream HTTP body.
- The SSE line buffer limit (1 MB) is hard-coded; exceeding it produces `streaming response exceeded SSE line buffer limit (N bytes)` error.

## Unknown

- Full `stream_sse_body_to_ws` closure body (invoked via vtable, not directly decompiled in this session).
- Whether `[AiMaMi] image_url rejected` and `web_search rejected` retries modify the request body before re-forwarding or just strip the tool.
