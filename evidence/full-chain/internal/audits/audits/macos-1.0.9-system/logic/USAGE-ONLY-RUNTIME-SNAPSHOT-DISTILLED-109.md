# load_usage_only_runtime_snapshot — Distilled Evidence (macOS 1.0.9)

**Target**: `codexmate_lib::commands::accounts::load_usage_only_runtime_snapshot` @ `0x1001e74d0`
**Platform**: macOS arm64
**Binary SHA256**: `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482` (SOT `.app` == `_ida.app`, byte-verified this pass)
**Session**: <audit-session>
**Machine**: <workstation>
**Producer**: claude-opus-4-8
**Produced**: 2026-06-04
**Owner-gate**: ALLOW / write_mode=owner (bundle manifest owner <workstation> == this machine)
**gate_tier**: strictImplementationUse — dim1-5 closed; dim6 (test/acceptance mapping) is source archive-side, out of reverse scope
**is_upstream**: true (usage refresh path present in upstream codex-cli usage command set; `fetch_usage_snapshot` hits the same chatgpt.com/backend-api/wham/usage endpoint)

> **Distinct from `USAGE-CLUSTER-DISTILLED-109.md`.** That doc covers the registered IPC command `refresh_usage_snapshot` (`refresh_usage_snapshot_with_retry` @ 0x1001e7eec) and the get/set interval commands. **This doc covers the shared synchronous worker `load_usage_only_runtime_snapshot` @ 0x1001e74d0**, which was previously documented only as a *callee* of refresh_usage_snapshot, never as its own leaf. It is an orphan pure-backend core, not in any prior bundle.

---

## Classification (important)

`load_usage_only_runtime_snapshot` @ `0x1001e74d0` is **NOT a standalone registered Tauri IPC command**. It is the **shared synchronous CORE WORKER** behind the usage-only runtime-snapshot refresh. Positive evidence:

- Owner symbol `__ZN13codexmate_lib8commands8accounts32load_usage_only_runtime_snapshot17h076cdd7c2ed9594fE`, size **0x81c = 2076 B**, 91 basic blocks, 497 instructions, 27 callees, `has_type=true`.
- **Absent from both command-name registry blobs**: `0x100f2ecf6` (device/analytics/relay/plugins invoke_handler) and `0x100edc37e` (accounts invoke_handler: `...export_accounts_to_file|refresh_usage_snapshot|load_sessions|confirm_pending_auto_switch_and_restart_codex|import_chatgpt_session_account...`). Neither blob lists `load_usage_only_runtime_snapshot` nor `refresh_usage_only_runtime_snapshot_async`.
- Reached only via two backend callers (xrefs_to = 3 sites):
  1. **`refresh_usage_snapshot_with_retry` @ 0x1001e7eec** — 2 call sites (`0x1001e7f58`, `0x1001e8000`) = the initial call + the single retry in the registered `refresh_usage_snapshot` IPC command.
  2. **`<tokio BlockingTask<refresh_usage_only_runtime_snapshot_async::{{closure}}::{{closure}}>>::poll` @ 0x10030dbb8** — 1 call site (`0x10030dc88`). This is the async wrapper `refresh_usage_only_runtime_snapshot_async` run via tokio `spawn_blocking`. Its closure is fully inlined into the BlockingTask poll; no standalone `::poll` body exists. Caller chain: `tokio::runtime::task::core::Core<T,S>::poll` @ 0x100149504 → BlockingTask::poll @ 0x10030dbb8 → 0x1001e74d0.

So the "distinct usage-only path" is real (a separate code path from the cluster doc), but it materializes as a **shared sync core** invoked by the `refresh_usage_snapshot` command and by an internal `..._async` spawn_blocking wrapper — not as its own registered command.

---

## Signature & Return

```
double __usercall load_usage_only_runtime_snapshot(
    __int64 a1@<X0>,   // &Repository state (OnceBox<Mutex<Repository>>; a1+16 = Repository, a1+8 = poison flag)
    __int64 a2@<X1>,   // auto_switch / cached service-state bool (forwarded to make_status_payload_with_service_state)
    char   *a3@<X8>)   // sret: CoreEnvelope<CoreSnapshotPayload>, 0x2F8 = 760 bytes
```

Return: `CoreEnvelope<CoreSnapshotPayload>` written to `*a3` (760 B). On success `ok_with_warnings`; on early failure `*(u64*)a3 = 3` (CoreError envelope tag).

---

## Behavior (synchronous, no await)

1. **Lock Repository Mutex** — `atomic_load_explicit(a1, acquire)`; if 0, `OnceBox::initialize` then `Mutex::lock` (`0x100d3499c`). Poison-checked via `GLOBAL_PANIC_COUNT` + `is_zero_slow_path`.
   - Poison path: format `"poisoned lock: another task failed inside"` (`0x100f305e9`) → CoreError → `*(u64*)a3 = 3`, unlock, return.
2. **`Repository::load_local_state_synced`** (`0x1005ea2c8`) into a LoadedState (`v43`, ~0x3E0 B). fs read of local state.
   - If result tag == 2 (Err): clone CoreError via `CoreError::Display::fmt` (`0x10020c20c`), write `*(u64*)a3 = 3` (error envelope), `drop_in_place<CoreError>`, unlock, return.
3. **Clone account-field/buffered region** at `a1+408` (ptr) / `a1+416` (len) — alloc (`__rust_alloc`) + memcpy; this is the per-call input string passed to enrichment. (Empty len → sentinel 1.)
4. **`enrich_active_account_usage_via_api`** (`0x1005f50e0`, a2=cloned-buf ptr, a3=len) — the HTTP enrichment loop (see Call-tree below). Mutates per-account API contexts in the Repository.
5. **Re-lock Mutex** (same OnceBox/poison pattern). Poison → same CoreError tag-3 envelope path, plus dealloc cloned buf + `drop_in_place<LoadedState>`.
6. **`Repository::persist_progressive_state`** (`0x1005ec64c`, into `v49`; result in `v43[50/51]` warnings Vec).
   - If tag != 10 (not-ok): build error string `"PROGRESSIVE_STATE_SAVE_FAILED"` (29 B) + `format_inner("+Failed to persist refreshed runtime state: ", CoreError)` (`0x100ea78c0`) and **push a warning entry (48-byte stride) into the LoadedState warnings Vec** (`grow_one` if full). Non-fatal — execution continues.
7. **`Repository::make_status_payload_with_service_state`** (`0x1005f0944`, a1+16, LoadedState, **a2** = service/auto_switch state) → status payload (`v38`, 0x290 B).
8. **`Repository::store_bootstrap_snapshot_progressive`** (`0x1005f0660`, a1+16, payload). On tag != 10 → `drop_in_place<CoreError>` (error swallowed, not propagated).
9. **`CoreEnvelope::ok_with_warnings`** (`0x1001d8a48`) — wraps `(snapshot payload, warnings Vec ptr/len)` → final envelope; **`memcpy(a3, env, 0x2F8)`** (760 B sret).
10. **Unlock** + dealloc cloned buf + extensive `drop_in_place` cleanup of LoadedState: `AppPathState`, `CodexMateSettings`, `RegistryItem[]` (stride 360), `AccountSummary`, plus several raw Vec/String deallocs (RawVec stride-136 entries, sentinel `0x8000000000000000` skip-checks).

### Contrast vs `refresh_usage_snapshot` (0x1001e7eec)
- **NO** `broadcast_runtime_snapshot` Tauri event emit (the cluster command emits `"load_snapshot"` event tag 11).
- **NO** 200 ms sleep + retry loop (the cluster command's `upstream==true && status==Refreshing` retry lives in `refresh_usage_snapshot_with_retry`, which wraps THIS body twice).
- This body is the pure "load + enrich + persist + payload" worker; orchestration (event, retry) is the caller's job.

---

## Call-tree (depth ≥ 5, terminals reached)

```
load_usage_only_runtime_snapshot (0x1001e74d0)
├─ std::sys...Mutex::lock / unlock (0x100d3499c / 0x100d349b8)            [sync primitive]
├─ Repository::load_local_state_synced (0x1005ea2c8)                       [fs READ — local state]
├─ enrich_active_account_usage_via_api (0x1005f50e0)   per registry account:
│   ├─ oauth_refresh::ensure_fresh_token (0x100546114)
│   │   └─ token_remaining_seconds (0x1005472ec)
│   ├─ api_client::test_api_connectivity (0x100544e70)
│   ├─ auth::make_api_request_context (0x10062590c)
│   ├─ api_client::fetch_usage_snapshot (0x1005441b0)                      [HTTP TERMINAL]
│   │   ├─ api_client::http_client (0x100543a54)
│   │   ├─ reqwest::blocking::Client::request (0x10059e558)  GET
│   │   │      https://chatgpt.com/backend-api/wham/usage?account_id=<id>
│   │   ├─ RequestBuilder::header_sensitive ×4  (Authorization: Bearer <tok>,
│   │   │      ChatGPT-Account-Id, Accept, User-Agent: AiMaMi/1.0.9)
│   │   ├─ RequestBuilder::send (0x1009b8ab0)   → transport err tag3 → CoreError tag6
│   │   ├─ status check (<200 || >=300) → CoreError tag9 (status string)
│   │   ├─ Response::json (0x10059ed14)
│   │   └─ plan_mapping::parse_plan_from_usage_json (0x1001bdf50) + serde index "rate_limit"
│   ├─ repository::apply_usage_result (0x1005f2798)
│   ├─ quota_store::upsert_item (0x1001bc200)                              [quota store WRITE]
│   ├─ reqwest::error::Error::is_connect / is_timeout (0x10099fd18/0x10099fdc4)
│   └─ sync_token_status_to_quota_store (0x1005f4source archivec)
├─ Repository::persist_progressive_state (0x1005ec64c)                     [fs WRITE — progressive state]
├─ Repository::make_status_payload_with_service_state (0x1005f0944)
├─ Repository::store_bootstrap_snapshot_progressive (0x1005f0660)
└─ CoreEnvelope::ok_with_warnings (0x1001d8a48)                            [response_serialize]
```

**terminated_reason**: `external_call_recorded` (fetch_usage_snapshot reqwest::blocking send) + `persistence_commit` (persist_progressive_state + quota upsert_item) + `response_serialize` (ok_with_warnings) + `error_return` (CoreError tag-3 envelope on lock/load failure).

---

## DTO

- **Response**: `CoreEnvelope<CoreSnapshotPayload>` (sret 0x2F8 / 760 B).
  - Envelope discriminant at `*(u64*)a3`: success path built by `ok_with_warnings` (carries snapshot payload + warnings Vec); failure path writes tag `3` (CoreError envelope).
- **Input**: `a1` = Repository state ptr; `a2` = auto_switch/service-state bool; cloned account-field buffer from `a1+408/416`.
- **Usage rate-limit fields parsed** (in `fetch_usage_snapshot` via `parse_plan_from_usage_json` + serde, blob `0x100f3a400`): `limit, hard_limit, remaining, remaining_requests, used_requests, limit_window_seconds, window_seconds, period_seconds, resets_at, used_percent`.

## Error paths

- **Mutex poisoned** (either lock) → `"poisoned lock: another task failed inside"` → CoreError envelope tag 3 (early return).
- **`load_local_state_synced` Err** (tag 2) → CoreError formatted → envelope tag 3 (early return).
- **`persist_progressive_state` fail** (tag != 10) → warning `"PROGRESSIVE_STATE_SAVE_FAILED"` + `"Failed to persist refreshed runtime state: <e>"` pushed into warnings Vec; **non-fatal**, continues to build Ok envelope.
- **`store_bootstrap_snapshot_progressive` fail** (tag != 10) → CoreError dropped silently, no propagation.
- **HTTP errors inside enrich** (per account, in `fetch_usage_snapshot`): transport err → CoreError tag6; non-2xx → CoreError tag9; connect/timeout classified via `reqwest::error::Error::is_connect/is_timeout`. These are stored into per-account API context (`v102+888/896/904`, status byte `v102+920`) — **graceful**, not propagated to the command result.
- Unexpected `Display`/uuid format → `unwrap_failed` panic (not a business path).

## Side effects

- **HTTP**: GET `chatgpt.com/backend-api/wham/usage?account_id=<id>` per active account with a subscription (reqwest::blocking, sync).
- **fs WRITE**: `persist_progressive_state` (progressive runtime state to ~/.codex data).
- **quota store WRITE**: `quota_store::upsert_item` per account.
- **Repository in-place mutation**: per-account `AccountApiContext`, `AccountSummary` (`v102+152/160`), sensitive-field-status sync to quota store, `last_*` timestamps via `SystemTime::now`.
- **No** Tauri event emit, **no** process spawn, **no** SQLite, **no** registry rebuild in THIS body (those belong to other commands).

---

## dim1 (frontend)

- Registered usage-refresh command in frontend `index-CL22l5v8.js`: `refreshUsageSnapshot: () => G("refresh_usage_snapshot")` (the `We` IPC wrapper object). The React hook also exposes `refreshUsageOnly: m` called as `x.refreshUsageOnly({retryOnFailure:!0})` from overview / proxy-saved refresh handlers (`onRefreshUsageStatus`, `onProxySavedRefresh`).
- **No** `G("refresh_usage_only_runtime_snapshot...")` or `G("load_usage_only_runtime_snapshot")` invoke string exists in the frontend — `refreshUsageOnly` is a React-Query closure that routes through the registered `refresh_usage_snapshot` command (its `retryOnFailure` flag maps to the backend `upstream`/retry behavior). The async `refresh_usage_only_runtime_snapshot_async` spawn_blocking wrapper is backend-internal.
- dim1 status: **shared core behind an active source archive consumer** (the usage-refresh UI path) — not a dormant orphan at the UX level, but with no direct 1:1 command name of its own.

---

## Fake-wall taxonomy exhaustion (recovery_attempts)

**No accepted_unknown / genuine_ceiling claimed. Real synchronous body fully recovered (HexRays-clean, single pass).** Taxonomy checked, none applicable:

- **drop_in_place ≠ async body**: the many `drop_in_place<...refresh_usage_only_runtime_snapshot_async...closure...>` symbols (0x100011968, 0x1000119c0, 0x10001781c, 0x1000ab8c8, 0x1000c3e80, …) are **tokio BlockingTask Stage/CoreStage/Cell destructors + the run_blocking_command closure destructor** — NOT the worker body. The worker @ 0x1001e74d0 is a named, typed, complete function.
- **async decompile failed (HexRays bail)**: did NOT occur. Owner decompiled fully in one pass (497 insns / 91 BB). **Positive proof of synchronous**: `func_query(name_regex='load_usage_only_runtime_snapshot.*(poll|async_fn_env|closure|resume)')` = **EMPTY** → no state machine, no `::poll`, no `async_fn_env` for this function. The body has no `.await` discriminant match — it's straight-line lock→load→enrich→persist→payload.
- **wrong VA / ICF size guess**: `func_query(name_regex='commands.*accounts.*load_usage_only')` returns **exactly one** function (0x1001e74d0, 0x81c, has_type=true) — no ICF twins, no shim/body split. Address verified against the live IDB symbol, not a neighbor.
- **architecture_only / budget rule**: no budget override needed; 2076 B decompiled whole, no `basic_blocks` chunking required.
- **body_too_large**: 2076 B is well within single-decompile range; no chunking.
- **vtable / dynamic dispatch**: all 27 callees are direct, demangled, statically-bound symbols (no fat-pointer / trait-object indirection in the worker). The async entry (0x10030dbb8) reaches the worker via a direct `BL load_usage_only_runtime_snapshot`, not a vtable.
- **HTTP-terminal external-only**: `fetch_usage_snapshot` (0x1005441b0) wrapper is **fully reversed** (URL build, 4 sensitive headers, reqwest::blocking send, status/json parse, rate-limit field extraction). Only the external chatgpt.com server **response content** is unknowable — server-controlled, does not drive binary logic → non-cap (matches relay HTTP taxonomy).
- **reqwest/rustls library internals**: not needed; the AiMaMi-side config/callsite (GET, Bearer auth header, json parse) is what matters and is recovered.
- **caller_disambiguation**: N/A — not ICF-folded (single owner, distinct VA).

---

## Gate Summary

| dim | status | evidence |
|---|---|---|
| dim1 frontend CCF/UI | ✅ | `refresh_usage_snapshot` / `refreshUsageOnly({retryOnFailure})` in index-CL22l5v8.js; shared core behind usage-refresh UI |
| dim2 owner/pseudocode | ✅ | A-level full decompile @ 0x1001e74d0 (2076B/91BB/497 insn), HexRays-clean, IDA comment written |
| dim3 deep call-tree | ✅ | depth ≥ 5; HTTP terminal (fetch_usage_snapshot reqwest::blocking) + fs persist + quota upsert + ok_with_warnings |
| dim4 interface/DTO/error/side-effect | ✅ | CoreEnvelope<CoreSnapshotPayload> 760B; tag-3 error envelope; poison/load/persist/HTTP error paths; HTTP+fs+quota side effects |
| dim5 same-platform gate | ✅ | macOS arm64; SHA `1db044e8efab…` verified SOT==IDB; Windows independent (Unknown, not inferred) |
| dim6 test/acceptance | ⬜ | source archive implementation-side acceptance mapping, out of reverse scope |

**ceiling**: strictImplementationUse — dim1-5 closed; dim6 is source archive-side. Not a real wall — full real body recovered.

---

## Evidence Paths

- IDB: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- IDA comments written: `0x1001e74d0` (worker), `0x10030dbb8` (async BlockingTask poll entry)
- Related cluster (distinct command): `logic/USAGE-CLUSTER-DISTILLED-109.md` (refresh_usage_snapshot @ 0x1001e7eec)
- Command registry blobs: `0x100edc37e` (accounts), `0x100f2ecf6` (device/analytics/relay)
