# Accounts Monitor IDB Lifecycle / Event Crosscheck - AiMaMi 1.0.9

Scope: accounts-only same-version IDB-first static crosscheck for
`begin_add_account_attach_monitor`.

This reducer creates no raw evidence, appends no `INDEX.jsonl` row, edits no
regulation, edits no product code, runs no product test, and promotes no gate.
It uses the IDB-first method fused into `rust-reverse-pipeline` itself; no
external HOWTO path is an execution dependency.

## IDB Source

- Binary SOT root:
  `<source-location>/source-binary/`
- IDA database:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- IDA input:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi`
- IDA health: `auto_analysis_ready=true`, `hexrays_ready=true`.
- IDB writeback: comments were added to owner/callsite/leaf addresses below;
  `idb_save` returned OK.

## Static Chain

- Command owner:
  `codexmate_lib::commands::system::begin_add_account_attach_monitor`
  at `0x100262db4`.
- Tauri wrapper callsite: `0x100325278` inside wrapper `0x1003250c0`.
  The command string cluster includes
  `begin_add_account_attach_monitorrun_daemon_once`.
- Thread vtable shim callsite: `0x100185790` inside `0x100185678`, which calls
  monitor polling body `0x100529504`.
- Polling body: `0x100529504` loops while elapsed is at most `0x77` seconds,
  sleeps `2` seconds per iteration, locks repository state, calls
  `Repository::load_snapshot_local`, compares the captured account field/string
  and status field, and calls `schedule_full_runtime_refresh` only after a
  detected snapshot/status change.
- Refresh trigger callsite: `0x1005297e0` calls
  `schedule_full_runtime_refresh` at `0x100262aec`.
- Refresh scheduler: `0x100262aec` is guarded by
  `FULL_RUNTIME_REFRESH_IN_FLIGHT`, debounces requests under `8` seconds, and
  dispatches a `tokio::spawn_blocking` task when accepted.
- Spawned refresh task: `0x10030d508`, with callsite `0x10030d5c0`, calls
  `refresh_full_runtime_snapshot` at `0x1001e6a1c` and clears
  `FULL_RUNTIME_REFRESH_IN_FLIGHT`.
- Runtime refresh: `0x1001e6a1c` calls `load_full_runtime_snapshot` at
  `0x1001e3bc4`; on success it calls `broadcast_runtime_snapshot` at
  `0x1001e3858` with reason string `progressive`.
- Broadcast/event: `0x1001e3858` refreshes the tray/menu and calls
  `tauri::Emitter::emit` at `0x1001e3ad0` with event name
  `runtime-state-updated`.

## Accepted Static Facts

The monitor command starts a native polling thread after an initial successful
snapshot load. The polling thread does not directly mutate account files; its
observed side effect is to schedule a full runtime refresh after it detects
snapshot/status drift. The native refresh chain can emit
`runtime-state-updated` through Tauri after loading and broadcasting a full
runtime snapshot.

The command wrapper static surface is also narrowed: argument/state decode
failures return through `InvokeResolver::return_result`, successful owner
completion returns through `InvokeResolver::respond`, and spawn failure uses
the static string `failed to spawn thread` through `unwrap_failed`.

## Non-Accepted Dimensions

This reducer is not proof of a frontend callback. It does not prove that any
Accounts page listener was registered, invoked, or rendered state changes from
`runtime-state-updated`. It does not provide live Tauri IPC request/response
bytes, exact runtime event payload bytes, spawn-failure transport bytes,
duplicate monitor/reentry behavior under live execution, executed acceptance,
or independent Windows closure.

## Gate Effect

No promotion.

- `consumerStartReady` stays Gate 1 static context only.
- `strictImplementationUse=false`.
- `readyToImplement=false`.
- `implementation_use=false`.
- `gate_accepted=false`.
- `full_leaf_100=false`.
- `moduleExitAllowed=false`.

Accounts remains the active module.
