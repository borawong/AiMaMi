# fetch_usage_snapshot — Distilled Evidence (macOS 1.0.9)

**Function**: `codexmate_lib::core::api_client::fetch_usage_snapshot`  
**Owner VA**: `0x1005441b0`  
**Module scope**: `core::api_client`  
**Platform**: macOS arm64  
**Binary SHA12**: 1db044e8efab  
**Session (current)**: <audit-session>  
**Machine**: <workstation>
**Produced**: 2026-06-04  
**authoritative**: true  
**Supersedes**: local-outtake from <audit-session> (CWD bug blocked prior write)  
**IDB**: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

---

## Owner Gate

Gate run: `cd <source-location> && python3 prewrite-owner-gate.py --target <source-location>/audits/macos-1.0.9-system --scope fetch_usage_snapshot --machine <workstation> --session <audit-session>

Result: **ALLOW**, `write_mode: owner`, canonical_bundle = `<source-location>/audits/macos-1.0.9-system`, owner basis = `bundle_manifest (<workstation>)`.

---

## dim1 — IPC / Entry Point

`fetch_usage_snapshot` is **not** an IPC command. It is an internal helper called exclusively by:

- `codexmate_lib::core::repository::enrich_active_account_usage_via_api @ 0x1005f50e0`

xrefs_to confirm two callers:
1. `__rust_begin_short_backtrace` wrapper shim @ `0x10052a810` (artifact of Rust backtrace registration)
2. `enrich_active_account_usage_via_api @ 0x1005f50e0` — the live call path

No IPC invoke string (not in command table). This is a pure internal function.

---

## dim2 — Real Body Confirmation

**Not async / not shim.** Body is sync blocking:

- Symbol: `codexmate_lib::core::api_client::fetch_usage_snapshot::h9cea8e5793abaeb5`
- Size: `0x86c` bytes
- Signature (reconstructed): `fn fetch_usage_snapshot(access_token: &str, proxy_config: &ProxyConfig) -> UsageSnapshotResult`
- Arguments: `a1 = *access_token (X0)`, `a2 = *proxy_config (X1)`, return via `a3 (X8)`
- Uses `reqwest::blocking::client::Client::request` — **synchronous HTTP call**, no async executor

fake-wall taxonomy exhausted:
- Not `drop_in_place`: body is full sync HTTP function, no destructor pattern
- Not `architecture_only`/budget bail: fully decompiled, 0x86c bytes, HexRays produced clean pseudocode
- Not `async decompile failed`: sync, no `Future::poll`, no state machine
- Not wrong VA: symbol name in refs confirms `fetch_usage_snapshot` at `0x1005441b0`
- Not `HTTP-terminal` unverifiable: the wrapper body is fully reversed; request build, headers, parse are all in body
- Not vtable/dynamic dispatch: direct call to `reqwest::blocking::client::Client::request`
- Not oversized bail: 0x86c = 2156 bytes, entirely decompiled in single call

`recovery_attempts`: N/A — no fake wall encountered, body fully decompiled on first attempt.

---

## dim3 — Call Tree Depth

**Depth from `fetch_usage_snapshot`:**

```
fetch_usage_snapshot (0x1005441b0)
├── api_client::http_client (0x100543a54)          [CLIENT cache + reqwest::blocking::ClientBuilder::build]
│   ├── sanitize_proxy_config (0x100544aec)        [proxy URL validate/normalize]
│   ├── reqwest::blocking::client::ClientBuilder::default
│   ├── reqwest::blocking::client::ClientBuilder::proxy
│   └── reqwest::blocking::client::ClientBuilder::build
├── alloc::fmt::format::format_inner               [URL construction: "https://chatgpt.com/backend-api/wham/usage?account_id={sensitive-field}"]
├── reqwest::blocking::client::Client::request     [GET request builder]
├── RequestBuilder::header_sensitive (×4)          [Authorization: Bearer {sensitive-field}, ChatGPT-Account-Id, Accept, User-Agent: AiMaMi/1.0.9]
├── RequestBuilder::send                           [HTTP send — terminal leaf]
├── reqwest::blocking::response::Response::json    [parse response body as serde_json Value]
├── parse_plan_from_usage_json (0x1001bdf50)       [6-path plan label extraction]
│   ├── index_into (serde_json) ×6 paths
│   ├── plan_type_json_to_label
│   └── parse_chatgpt_plan_label
├── index_into("rate_limit")                       [rate_limit array extraction from JSON]
└── alloc::raw_vec::RawVec::grow_one               [rate_limit entry Vec construction]
```

Terminal leaves: `reqwest::blocking::request::RequestBuilder::send` (HTTP terminal — external server response not known, but wrapper fully reversed), `serde_json` parse, Rust allocator.

---

## dim4 — DTO / Error / Side Effects

### Request

**URL**: `https://chatgpt.com/backend-api/wham/usage?account_id={access_token}`
- Format string: rodata `a6httpsChatgptC` @ `0x100eaca08` = `"https://chatgpt.com/backend-api/wham/usage?account_id="`
- `access_token` appended via `Display` formatter

**Method**: `GET`
- `anon_d14e5830d43f1d27ed5f4537e19a210d_1` @ `0x100f3a2e0` (method discriminant for GET)

**Headers** (in order, from `header_sensitive` calls):
1. `Authorization: Bearer {access_token}` — rodata `aBearer` @ `0x100ea846a` = `"\x07Bearer "`
2. `ChatGPT-Account-Id: {value}` — rodata ref `anon_d14e5830d43f1d27ed5f4537e19a210d_157`
3. `Accept: {value}` — 3rd `header_sensitive` call
4. `User-Agent: AiMaMi/1.0.9` — rodata @ `0x100f3a400` contains `"AiMaMi/1.0.9"` string

**Client**: Obtained via `http_client` mutex-cached `OnceLock<Arc<reqwest::blocking::Client>>`:
- `CLIENT` static: `0x1013903a0`
- Mutex for cache: `qword_1013903A8`
- Cache field: proxy config comparison; if proxy changed, rebuilds client
- Poison flag: `byte_1013903B0`

### Response Status Handling

```
if HTTP status code outside [200, 299]:
    format error: "HTTP {status_code}"
    return Err tag=9 (non-2xx HTTP error)
```

Status code extracted from response: `(unsigned __int16)v75 - 200 >= 0x64` = status not in [200, 299].

### Response Body Parse

```
Response::json() → serde_json::Value
if json parse error:
    return Err tag=6

parse_plan_from_usage_json(json_value) → plan label (u8)
index_into(json_value, "rate_limit") → Option<rate_limit_array>
if rate_limit found:
    iterate rate_limit entries, filter by (flags & 1) conditions:
        - flag & 1 set + limit < 361 → "low-limit" entries
        - flag & 1 set + (limit >> 6) <= 0x86 → normal entries  
        - flag & 1 set + limit > 8639 → "high-limit" entries
    build filtered Vec<RateLimitEntry> (40-byte entries)
```

### Return DTO (tag=10, success path)

Written to `a3` output struct at offsets:
```
a3+0:  tag = 10 (Ok)
a3+8:  plan_type (u64 discriminant from parse_plan_from_usage_json)
a3+16: plan_name_ptr (String ptr)
a3+24: plan_flags (1 = has data)
a3+28: plan_detail_1
a3+32: rate_limit_slot_1 (128-bit)
a3+48: rate_limit_discriminant
a3+56: rate_limit_ptr
a3+64: rate_limit_flags
a3+68: rate_limit_detail
a3+72: rate_limit_slot_2
a3+88: plan_label_u8 (v16)
```

### Error Tags

| tag | meaning | condition |
|-----|---------|-----------|
| 6 | network/reqwest error | `RequestBuilder::send` failed or json parse failed |
| 9 | non-2xx HTTP status | status code outside [200, 299] |
| 10 | Ok | success path |
| 8 (pass-through) | plan Unknown (no plan in json) | all 6 `parse_plan_from_usage_json` paths returned Unknown |

`xmmword_100F35550` written to `a3` when `plan_label == 8 (Unknown) && rate_limit discriminant == 2 (no rate limit)` — this is the "completely empty/unknown" terminal.

### Side Effects

- HTTP GET to `chatgpt.com/backend-api/wham/usage?account_id=...`
- `reqwest::blocking::Client` Arc refcount increment/decrement (`atomic_fetch_add`)
- Client cache mutation (`xmmword_1013903B8`, `xmmword_1013903C8`, `qword_1013903D8`) when proxy config changed
- Mutex acquire/release on `qword_1013903A8` (client cache mutex)
- Heap allocations for URL string, rate_limit Vec, error messages

---

## dim5 — Platform / Upstream

**Platform**: macOS arm64 only.
- Uses `reqwest::blocking` (sync) — same pattern as other mac api_client functions
- No NSWindow, NSWorkspace, NSNotification (no mac-native side effects)
- `fetch_usage_snapshot` is called by `enrich_active_account_usage_via_api` which is part of `load_usage_only_runtime_snapshot` → `refresh_usage_snapshot` IPC chain (confirmed in USAGE-CLUSTER-DISTILLED-109.md)

**Upstream status**: not an IPC command, internal helper. Not in upstream codex-cli command table. Upstream relevance: feeds `CoreSnapshotPayload.usage` data.

---

## parse_plan_from_usage_json — 6 JSON paths

Function @ `0x1001bdf50`, size `0x1fc`:

| Pass | Method | field / Pointer |
|------|--------|---------------|
| 1 | `index_into` | `"plan_type"` (rodata @ `0x100edeef4`) |
| 2 | `index_into` | `"chatgpt_plan_type"` (rodata @ `0x100edef22`) |
| 3 | `index_into` | `"plan/subscription/plan/account/plan_type/meta/plan_type"` |
| 4 | `Value::pointer` | `"/subscription/plan/account/plan_type/meta/plan_type"` |
| 5 | `Value::pointer` | `"/account/plan_type/meta/plan_type"` |
| 6 | `Value::pointer` | `"/meta/plan_type"` |

Each path calls `plan_type_json_to_label` → `parse_chatgpt_plan_label`. First path that returns non-Unknown (not tag=8) wins. All 6 returning Unknown → outer Unknown.

Plan label values from rodata @ `0x100edeef4`: `"free"`, `"plus"`, `"team"`, `"business"`, `"enterprise"`, `"edu"`

---

## http_client — CLIENT Mutex Cache

Function @ `0x100543a54`, size `0x658`:

Statics:
```
CLIENT OnceLock<Arc<reqwest::blocking::Client>> @ 0x1013903a0
cache_mutex (qword_1013903A8)   — Mutex for the cache
cache_poisoned (byte_1013903B0) — poison flag
cache_proxy_key (xmmword_1013903B8, xmmword_1013903C8) — last proxy config snapshot
cache_arc_ptr (qword_1013903D8, qword_1013903E0, dword_1013903E8) — Arc of Client
```

Logic:
1. `sanitize_proxy_config` on input
2. If `OnceLock` not initialized → `initialize` (one-time)
3. Lock `cache_mutex`
4. If proxy config matches cache field → clone Arc, return cached Client
5. If proxy changed → rebuild `reqwest::blocking::ClientBuilder::default()` + optional `::proxy()` + `::build()` → update cache
6. Unlock mutex
7. On error (proxy URL invalid, build failure) → return `Err tag=9` with message

Error string: `"failed to lock API client cache"` (31 bytes) — written when mutex is poisoned.

---

## Fake-Wall Taxonomy — Full Exhaustion

| Taxonomy | Status | Reasoning |
|----------|--------|-----------|
| `drop_in_place` mistaken as owner | NOT APPLICABLE | Body is full sync HTTP function, not a destructor |
| `architecture_only`/budget bail | NOT APPLICABLE | 0x86c body fully decompiled in one shot, no budget limit |
| `async decompile failed` | NOT APPLICABLE | Sync function, no Future::poll, no state machine |
| Wrong VA / adjacent function | NOT APPLICABLE | Symbol `fetch_usage_snapshot::h9cea8e5793abaeb5` confirmed at 0x1005441b0 |
| vtable / dynamic dispatch unknown | NOT APPLICABLE | Direct calls to reqwest blocking API, no trait object |
| `HTTP-terminal` server response unverifiable | ACCEPTED for server response body only | Server's actual JSON content not known; but wrapper fully reversed, this is non-critical external |
| Library internals unreachable | NOT APPLICABLE | Only reqwest public API needed; not reversing reqwest internals |
| Oversized body bail | NOT APPLICABLE | 0x86c reversible in one shot |

`genuine_ceiling`: false — all logic is inside the binary and fully reversed. Server response field values are external (not binary-controlled), but wrapper logic is 100% closed.

---

## Gate Summary

| dim | status | evidence |
|-----|--------|---------|
| dim1 IPC/entry | N/A (internal helper; no IPC cmd) | xrefs_to: called from `enrich_active_account_usage_via_api` only |
| dim2 real body | CLOSED | 0x86c sync body, symbol confirmed, no async/shim |
| dim3 depth/terminals | CLOSED | depth=4 (fetch→http_client→build, fetch→send, fetch→json, fetch→parse_plan×6); HTTP terminal + serde_json |
| dim4 DTO/error/side-effect | CLOSED | URL, method, 4 headers, response status check, plan parse 6-path, rate_limit Vec, 3 error tags confirmed |
| dim5 platform | CLOSED | macOS arm64 sync blocking; no win analog (function exists only as mac callee) |
| dim6 acceptance | N/A (internal helper, source archive impl-side; parent `refresh_usage_snapshot` has dim6 assessed) | |

**gate_tier**: `strictImplementationUse` — internal helper, all dim1-5 closed; dim6 N/A for internal helpers.

**real_body_found**: true  
**genuine_ceiling**: false  
**exists_on_win**: N/A — `fetch_usage_snapshot` is called from `enrich_active_account_usage_via_api`; Windows path for usage fetching not confirmed to call this exact function (platform divergence not yet assessed)
