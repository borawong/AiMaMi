# WIN Orphan-Callers — Caller-Chain Verdict (AiMaMi 1.0.9 Windows x64)

> First-party caller/xref re-review. session: <audit-session> | machine: <workstation> | model: claude-opus-4-8 | date: 2026-06-05
> binary SHA256: a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b (`AiMaM 1.0.9 win64.exe`)
> IDB: `<source-location>\raw\binary\AiMaM 1.0.9 win64.exe.i64`, imagebase 0x140000000, hexrays_ready
> write_mode: owner-gate ALLOW (owner=<workstation>, bundle_manifest); ADDITIVE first-party re-review (does not overwrite canonical relay-core conclusions)

## Scope / why this doc exists

`<audit-session> (win frontend CCF first-party dim1 closure) flagged **6 backend functions as "orphans"** — backend symbols/commands with no obvious frontend `invoke()` caller. This re-review resolves, for each, whether the orphan is:
(a) a genuinely-reachable function with a real backend trigger chain (caller chain proven), or
(b) dead code, or
(c) "not-yet-reversed" (i.e. the prior pass just didn't trace it).

**Verdict (all 6): every target has a real backend trigger source. None is dead code. None is "未逆完". Targets 3/4 are `IPC-registered-but-no-UI` (backend command registered, no frontend `invoke`). Target 6 is a pseudo-target (the named function does not exist).** Zero `genuine_unclosed`.

This was a **read-only** xrefs/decompile analysis against the genuine live IDB. No raw evidence files written; only this consumer-conclusion DISTILLED.

---

## Per-target verdict

### Target 1 — `execute_proxy_tools` @ 0x1401DFC70
**Trigger source: `frontend-cmd-via-relay`** (relay forwards an upstream request that carries tools).

Two direct callers, each with its own upstream caller:
- `stream_codex_responses_native_sys` @ 0x14012ae30 ← **`route_codex_request_and_dispatch_sys` @ 0x140140040** (3 sites: 0x140140b00 / 0x1401418d5 / 0x140141eac), plus per-provider streaming-dispatch monomorphizations (sub_1401BE7D0 / sub_1401C07F0 / sub_1401source archiveE60 / sub_1401C7E30).
- `forward_codex_responses_internal_sys` @ 0x140838820 ← **`handle_codex_router_ws_core_sys` @ 0x140829ec0** (3 sites) · **`handle_codex_active_ws_core_sys` @ 0x140829290** · **`handle_codex_by_provider_ws_state_machine_sys` @ 0x140831f60**.

Chain: frontend → local relay proxy → `route_codex_request_and_dispatch_sys` (HTTP request routing) / `handle_codex_*_ws_*` (WS handlers) → when the upstream request/response carries tools, calls the stream/forward responder → `execute_proxy_tools`. **Not dead** — this is the tool-execution entry for relay-forwarded upstream Codex requests.

### Target 2 — `rollback_threads_for_router` @ 0x1403903a0
**Trigger source: `daemon/account-switch`** (account switch → stop Codex / restart → parallel rollout rollback).

True identity (live decompile): source file `src\core\relay\codex_thread_visibility.rs`; per-thread rollback worker consuming a 15-qword (0xF0) stride `Thread` slice (`while (a2 != a3) { ...; a2 += 15; }`). Per thread: reads rollout JSON, validates `session_meta`, calls `replace_first_session_meta_line_sys`, emits progress event `"rolling_back_threads"`.

The 3 callers the prior pass listed (sub_14025BA20 / sub_1401AE7B0 / sub_1401CE910) are **generic slice split_at_mut / drop-tail glue** (`mid > len` panic + `&a3[15*len]` tail-slice) — a fake wall (`drop_in_place` ≠ real semantic caller). The real semantic chain (function name + IDB pre-annotation + xrefs reverse):
- `rollback_threads_for_router_sys` ← **`rollback_rollouts_in_parallel_sys` @ 0x1403da4f0** (parallel rollback orchestrator, 0x5007 body)
- `rollback_rollouts_in_parallel_sys` ← **`switch_account_stop_codex_restart` @ 0x14014asource archive0** (VA 0x14014b45f)
- The same `switch_account_stop_codex_restart` also calls `relay_manager_set_router_enabled_rollback_sys` @ 0x14014a620 (3 sites)

I.e. router-disable / account-switch path triggers parallel rollout rollback → per-thread rollback (this function). **Not dead** — consistent with the prior `set_codex_router_enabled`-disable-path hypothesis. Cross-witness: `set_codex_router_enabled_owner_sys` @ 0x140894be0 exists.

### Target 3 — `cmd_fetch_data_store_identifiers_coroutine` @ 0x1408f2ad0
**Trigger source: `IPC-registered-no-UI`** (backend command registered; frontend has no `invoke`).

Callers `sub_1409CD000` / `sub_1409E7190` are **tokio async poll resonators (coroutine resume thunks)**, reached from `0x1405EExxxx` `jmp` jump-table entries (`loc_1405EE250: jmp sub_1409CD000` … the align-packed dense jmp table = Tauri command future poll-fn vtable region). The data-xref slots (0x1416c49ec / 0x1418f94bc) are runtime-called function-pointer table entries.

Live body byte-confirm: the only string xref is `"fetch_data_store_identifiers"` @ 0x14129f610 (IPC command name), namespace `"app"`, zero params, terminates at `tauri_ipc_resolve_sys` @ 0x140062230; reads the Repository data-store identifier vec (96B element, 16B UUID field), serializes to a JSON array-of-arrays. `caller_disambiguation_tried=true`, `genuine_ceiling=false`.

**Verdict: backend IPC command `fetch_data_store_identifiers` (app namespace) is really registered and driven by the Tauri async runtime via vtable poll, but the frontend has no matching `invoke` (registered-no-UI orphan). Not dead code — the backend command exists, the UI just doesn't call it.**

### Target 4 — `cmd_remove_data_store_coroutine` @ 0x1408f1e20
**Trigger source: `IPC-registered-no-UI`** (backend command registered; frontend has no `invoke`).

Isomorphic to target 3: callers `sub_1409CF080` / `sub_1409ED4B0` are coroutine resume thunks (`__alloca_probe` 0x14A0 frame + var=-2 generator sentinel), same `0x1405EExxxx` IPC jmp table.

Live body byte-confirm: command name `"remove_data_store"` @ 0x14129f63e, arg `"uuid"` @ 0x14129f64f, namespace `"app"`; parses/validates 16B UUID via `sub_140462500`; on Ok(tag==6) walks the data-store vec (96B stride) calling `sub_1400CA020` per item (Arc dec + free), writes a 128B result buffer with 
ull` sentinel (0x6c6c756e), terminates at `tauri_ipc_resolve_sys`. No HTTP / spawn / FS.

**Verdict: backend IPC command `remove_data_store` (app namespace, removes a data-store entry + decrements Arc refcount) is really registered, runtime vtable-poll driven, frontend has no `invoke` (registered-no-UI orphan). Not dead code — the backend command exists, the UI just doesn't call it.**

### Target 5 — `append_assistant_and_tool_results` @ 0x1402395c0
**Trigger source: `relay SSE stream callback`** (vtable dynamic dispatch).

Direct caller `sub_140248910` is an **SSE line parser**: reverse-scans UTF-8 for `\r`(CR), tests the literal `data:` prefix (0x61746164="data" + 0x3A=":") and the `[DONE]` marker (0x4E4F445B="[DON" + 0x5D45="E]"); on a normal data line calls `append_assistant_and_tool_results_owner_sys`.

`sub_140248910`'s upstream = `sub_1404F8BF0` (0x1098 body, SSE stream driver); its callers are data-xref only. Byte-confirmed data slots: 0x141285388 is a **vtable struct** `{ size=8, drop_glue=0x1404F8BF0, method=0x140549950 }`, and 0x1415e8cb0 is a **dropck / type-descriptor** `{ -1, 0x1004FA1D0, 0x1004F8BF0, -1 }`. So `sub_1404F8BF0` (args arg0/arg1/arg2 = self/state, accumulator, line_bytes — the SSE-decode signature) is installed as a **`Fn`/`FnMut` trait object vtable slot**, dispatched per-line by the relay's SSE stream decoder.

Chain: relay receives upstream response bytes → SSE decoder calls the per-line callback `sub_1404F8BF0` through its vtable → line parser `sub_140248910` → `data:` JSON line → `append_assistant_and_tool_results_owner_sys`. **Not dead** — relay SSE streaming-response aggregation path, vtable-driven. (NOT dead code; it is dynamically dispatched through the stream decoder's vtable — this is what made it look like an orphan to a static caller scan.)

### Target 6 — `mystery_unlock`
**Verdict: function does not exist (pseudo-target).**

`func_query(name_regex='mystery_unlock')` returns only two real functions, no standalone `mystery_unlock`:
- `merge_mystery_unlock_grants` @ 0x1402719b0
- `get_mystery_unlock_grants` @ 0x14027e640

Both callers are **`auto_switch_multiplex_dispatcher_sys` @ 0x1402663e0** (merge: VA 0x14026733f; get: VA 0x1402698e6). That dispatcher is reached via `sub_14028E2A0` (memcpy 0x3B0 payload → dispatcher, IPC outer wrapper) — auto-switch multiplex IPC command dispatch.

I.e. there are only the two grant-helper functions `get_/merge_mystery_unlock_grants` (with real callers, live code); there is no function named `mystery_unlock`. List item 6 is confirmed a pseudo-target.

---

## Caller-chain summary table

| # | target fn @VA | caller VA | caller name | trigger source |
|---|---|---|---|---|
| 1 | execute_proxy_tools @0x1401DFC70 | 0x140140b00/8d5/eac | route_codex_request_and_dispatch_sys @0x140140040 (via stream_codex_responses_native_sys) | frontend-cmd-via-relay |
| 1 | execute_proxy_tools @0x1401DFC70 | 0x14082a7d2 etc. | handle_codex_router_ws_core_sys @0x140829ec0 (via forward_codex_responses_internal_sys) | frontend-cmd-via-relay (WS) |
| 2 | rollback_threads_for_router @0x1403903a0 | 0x14014b45f | switch_account_stop_codex_restart @0x14014asource archive0 (via rollback_rollouts_in_parallel_sys @0x1403da4f0) | daemon/account-switch router-rollback |
| 3 | cmd_fetch_data_store_identifiers_coroutine @0x1408f2ad0 | 0x1405ee250→sub_1409CD000 | Tauri IPC future poll vtable (cmd `fetch_data_store_identifiers`) | IPC-registered-no-UI |
| 4 | cmd_remove_data_store_coroutine @0x1408f1e20 | sub_1409CF080 / sub_1409ED4B0 | Tauri IPC future poll vtable (cmd `remove_data_store`) | IPC-registered-no-UI |
| 5 | append_assistant_and_tool_results @0x1402395c0 | sub_140248910 ← sub_1404F8BF0 (vtable 0x141285388) | relay SSE stream line callback (FnMut trait object) | relay SSE stream callback |
| 6 | mystery_unlock | — | function does not exist; real fns get_/merge_mystery_unlock_grants ← auto_switch_multiplex_dispatcher_sys @0x1402663e0 | pseudo-target (N/A) |

---

## Closure

- **Zero `genuine_unclosed`**: all 6 targets traced to a real trigger source; none needs a "未逆完 / not-yet-reversed" mark.
- Targets 3/4 are `registered-no-UI` (backend command exists but no frontend `invoke`) — **not dead code, not under-reversed**. These are the only two that need a product note: the backend IPC commands `fetch_data_store_identifiers` / `remove_data_store` are wired and runtime-pollable, but there is no UI surface that calls them in 1.0.9 frontend.
- Target 6 is a pseudo-target (named function absent).
- Anti-cheat: target 2 (fake-wall: drop_in_place slice-glue caller) and target 5 (fake-wall: vtable dynamic dispatch) were both broken per `ida-deep-recovery.md §1` — the orphan appearance was a static-caller-scan artifact, resolved by `xrefs_to_field` on the vtable slot and rodata/name-based real-caller recovery. `caller_disambiguation_tried=true` for both.

## Consumer-tier note
This DISTILLED is a **caller-chain / reachability verdict**, not a full per-leaf `full_leaf_100_definition_v2` closure of each orphan command. It establishes "these orphans are real, reachable backend functions with named trigger sources, not dead/under-reversed" — sufficient to retire the orphan-uncertainty flag from `<audit-session> It does not by itself promote any of the 6 to `strictImplementationUse` / `readyToImplement`; that would require each command's own dim1–6 leaf bundle.
