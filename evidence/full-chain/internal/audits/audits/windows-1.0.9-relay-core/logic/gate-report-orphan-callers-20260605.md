# Gate Report — Orphan-Callers Caller-Chain Re-Review (win 1.0.9)

> session: <audit-session> | machine: <workstation> | model: claude-opus-4-8 | date: 2026-06-05
> binary: `AiMaM 1.0.9 win64.exe` SHA256 a5822387fa3f56dc03893111f4ffdd074daa882e8887ec4e7c394879c0e9fe0b
> prewrite_gate_decision: ALLOW | write_mode: owner (bundle_manifest, <workstation>) | ADDITIVE
> logic: `logic/WIN-ORPHAN-CALLERS-CHAIN-109-DISTILLED.md`

## What this gates

This is a **caller-chain / reachability verdict** for the 6 backend functions flagged as orphans by `<audit-session> (INDEX `backend_orphan_reconfirmed` list). It is NOT a new per-leaf `full_leaf_100_definition_v2` closure; it resolves the orphan-uncertainty flag (real-vs-dead-vs-not-reversed) only.

## Verdict per target

| # | target @VA | trigger source | reachability | dead? | not-reversed? | already-canonical leaf? |
|---|---|---|---|---|---|---|
| 1 | execute_proxy_tools @0x1401DFC70 | frontend-cmd-via-relay (route_codex_request_and_dispatch_sys @0x140140040 / handle_codex_*_ws_*) | reachable | no | no | yes — `relay_web_executor` cluster (readyToImplement) |
| 2 | rollback_threads_for_router @0x1403903a0 | daemon/account-switch (switch_account_stop_codex_restart @0x14014asource archive0 → rollback_rollouts_in_parallel_sys @0x1403da4f0) | reachable | no | no | relay/daemon path (codex_thread_visibility.rs) |
| 3 | cmd_fetch_data_store_identifiers_coroutine @0x1408f2ad0 | IPC-registered-no-UI (Tauri future poll vtable; cmd `fetch_data_store_identifiers` app ns) | reachable (runtime poll) | no | no | data_store (registered-no-UI) |
| 4 | cmd_remove_data_store_coroutine @0x1408f1e20 | IPC-registered-no-UI (Tauri future poll vtable; cmd `remove_data_store` app ns) | reachable (runtime poll) | no | no | data_store (registered-no-UI) |
| 5 | append_assistant_and_tool_results @0x1402395c0 | relay SSE stream callback (FnMut trait object via vtable 0x141285388 → sub_1404F8BF0 → sub_140248910) | reachable (vtable dispatch) | no | no | yes — `relay_web_executor` / `relay_sse` (poll body 0x1404F8BF0) |
| 6 | mystery_unlock | pseudo-target — function does not exist; real fns get_/merge_mystery_unlock_grants @0x14027e640/0x1402719b0 ← auto_switch_multiplex_dispatcher_sys @0x1402663e0 | N/A | N/A | N/A | macos-1.0.9-mystery-unlock (the grant fns) |

## Closure
- `genuine_unclosed`: **0**. All 6 traced to a named trigger source.
- Anti-cheat fake-walls broken: target 2 (drop_in_place slice-glue caller masquerade) and target 5 (vtable dynamic dispatch) per `ida-deep-recovery.md §1`; `caller_disambiguation_tried=true` both.
- Orphan-uncertainty flag from `<audit-session> is **retired** for all 6.
- gate_accepted / implementation_use: **unchanged** (this re-review does not promote any cluster; targets 1 & 5 already readyToImplement/strictImplementationUse in the relay-core gate-report.json under relay_web_executor / relay_sse).

## Product note (registered-no-UI)
Targets 3 & 4 (`fetch_data_store_identifiers` / `remove_data_store`, app namespace) are real backend IPC commands, runtime-pollable, but have **no frontend `invoke`** in the 1.0.9 frontend. This is a registered-no-UI condition (backend command exists, UI doesn't call it) — flagged for the consumer side, not a reverse gap.
