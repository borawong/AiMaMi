# ACCOUNTS-STATIC-CC-NATIVE-EVENT-CURRENT-SYNC-109

Status: `accepted_accounts_static_cc_native_event_current_sync_no_promotion`

Produced at: `2026-06-03T00:58:00+08:00`

Scope: AiMaMi `1.0.9` macOS accounts only.

Current accounts reducer:
`logic/ACCOUNTS-FULL-IDA-CLOSURE-ROLLUP-109.md`

Source SHA-256:
`1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`

IDA IDB:
`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

## Decision

The macOS accounts static command-control layer is closed for backend/IDA and
native event emission. The remaining monitor/event gap is not the native
event-emitter call chain; it is live frontend listener delivery, rendered
UI/state, exact event payload bytes, and executed acceptance.

This reducer does not run the app, does not use localhost/WebDriver/AX/LLDB,
does not append `INDEX.jsonl`, does not edit product source, and does not
promote any gate.

## Current IDA MCP Readback

Current `server_health` returned:

- `status=ok`
- active IDB path matching the macOS AiMaMi 1.0.9 IDA SOT above
- `imagebase=0x100000000`
- `auto_analysis_ready=true`
- `hexrays_ready=true`
- `strings_cache_ready=true`

IDA MCP `find_regex` found the event surface string cluster:

- `0x100ee16d4`: `snapshotsourceprogressiveruntime-state-updated`
- `0x100f2ebf2`: `...begin_add_account_attach_monitorrun_daemon_once`
- `0x100f305e9`: `poisoned lock: another task failed inside`
- `0x100ee46a9`: `failed to spawn thread`

## IDA Static Native Event Chain

IDA MCP `xrefs_to` / `decompile` closes the static native chain:

| Evidence | IDA result |
|---|---|
| payload serializer string xref | `0x100ee16d4 -> RuntimeStateUpdatedPayload::serialize @ 0x1001e361c` |
| event-name xref | `0x100ee16ed -> broadcast_runtime_snapshot data xref` |
| command wrapper xref | `0x100325278 -> wrapper 0x1003250c0 -> owner 0x100262db4` |
| thread shim xref | `0x100185790 -> shim 0x100185678 -> polling body 0x100529504` |
| polling trigger | `0x100529504` sleeps 2s, loops until elapsed `0x77`, loads local snapshot, compares account/status fields, then calls scheduler at `0x1005297e0 -> 0x100262aec` |
| scheduler | `0x100262aec` gates on `FULL_RUNTIME_REFRESH_IN_FLIGHT`, debounces under 8s, clones Wry handle, dispatches Tokio `spawn_blocking` |
| refresh task | `0x10030d508` is the spawned blocking task poll; callsite `0x10030d5c0` calls `refresh_full_runtime_snapshot @ 0x1001e6a1c` |
| runtime refresh | `0x1001e6a1c` calls `load_full_runtime_snapshot`; success calls `broadcast_runtime_snapshot @ 0x1001e3858` with reason `progressive` and len `11`; failure returns `CoreError` and does not emit |
| broadcast | `0x1001e3858` updates display snapshot cache, refreshes tray/menu, builds `RuntimeStateUpdatedPayload`, and reaches `tauri::Emitter::emit` at `0x1001e3ad0` with event name `runtime-state-updated` at `0x100ee16ed` |

This means `begin_add_account_attach_monitor` no longer has an IDA-static
native event-emitter gap. IDA has closed owner, wrapper, thread handoff,
polling predicate, scheduler, task dispatch, runtime refresh success/failure
split, broadcast function, payload serializer string surface, event-name xref,
and Tauri emit side-effect class.

## What Remains Runtime-Only

The following are still not closed and cannot be claimed from this static
sync:

- live WKWebView/Tauri IPC command invocation;
- exact request/response/error envelope bytes;
- exact `runtime-state-updated` event payload bytes under fixtures;
- frontend listener registration and delivery to the accounts UI;
- rendered UI/toast/dialog/query-state effects;
- before/after filesystem bytes and no-write/rollback fixtures;
- executed source archive acceptance PASS/FAIL.

## Current Text Corrections

Use this reducer to read older `wrapper-only` / 
o accepted native callback`
phrasing narrowly:

- frontend visible terminal callsite for `logout` and
  `begin_add_account_attach_monitor` remains absent in the static accounts
  chunk;
- native backend event emission for `begin_add_account_attach_monitor` is
  statically closed by IDA;
- live frontend listener consumption remains runtime-only and unaccepted.

## Gate Effect

No promotion:

```json
{
  "strictImplementationUse": false,
  "readyToImplement": false,
  "implementation_use": false,
  "gate_accepted": false,
  "full_leaf_100": false,
  "moduleExitAllowed": false
}
```

Accounts remains the active module. `moduleExitAllowed=false` until the
required macOS accounts gate closes.
