# Accounts Monitor Attach Static - AiMaMi 1.0.9

Scope: accounts-only static reducer for `begin_add_account_attach_monitor`.

This reducer uses same-version AiMaMi 1.0.9 IDA HTTP MCP evidence from the
active IDA database:

`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

It writes no raw evidence, appends no `INDEX.jsonl` row, edits no regulation
or skill, runs no product test, changes no product code, and promotes no gate.

## Functions Reduced

| Function | Address | Role |
|---|---:|---|
| `commands::system::begin_add_account_attach_monitor` | `0x100262db4` | command wrapper, repository lock, snapshot load, thread spawn boundary |
| `core::repository::Repository::load_snapshot_local` | `0x1005e8e58` | local state snapshot and status payload construction |
| `FnOnce::call_once` vtable shim | `0x100185678` | spawn closure entry shim; reaches short-backtrace body |
| `std::sys::backtrace::__rust_begin_short_backtrace` | `0x100529504` | monitor polling body candidate |
| `commands::system::schedule_full_runtime_refresh` | `0x100262aec` | refresh scheduling throttle and blocking-task handoff |
| `RuntimeStateUpdatedPayload::serialize` | `0x1001e361c` | runtime-state updated payload serializer, not monitor-specific delivery proof |
| `drop_in_place<spawn_unchecked<begin_add_account_attach_monitor closure>>` | `0x10018baf4` | closure cleanup only; not monitor lifecycle proof |

## Command Wrapper Static Boundary

`begin_add_account_attach_monitor` locks repository state through the Tauri
state object. If the repository lock is poisoned, the wrapper formats:

`poisoned lock: another task failed inside`

After acquiring the lock, the command calls
`Repository::load_snapshot_local` before any thread spawn. If snapshot loading
returns the CoreError-shaped branch, the wrapper formats that `CoreError` via
Display into the command `Err<String>` path, unlocks, drops the AppHandle, and
returns without spawning the monitor thread.

On the success path, the command copies the snapshot/status payload and app
handle data into the future thread closure payload, releases the repository
mutex, then calls `std::thread::lifecycle::spawn_unchecked`.

The decompiled command has a spawn-failure path that calls
`unwrap_failed("failed to spawn thread", ...)`. Static evidence therefore
shows that spawn failure is not normalized through the same CoreError display
conversion path. This does not prove the outer Tauri transport behavior for a
panic or aborting spawn failure.

On successful spawn, the command drops the `JoinHandle` and writes a
success-shaped result marker before cleaning copied snapshot fields.

## Monitor Polling Static Boundary

The spawn closure's vtable shim at `0x100185678` reaches a second
`__rust_begin_short_backtrace` body at `0x100529504`. That body is a more
specific static monitor candidate than the drop helper.

Static evidence from `0x100529504` shows this polling shape:

1. capture an initial instant and initial copied snapshot comparison fields;
2. loop while elapsed time is at most `0x77` seconds;
3. sleep for two seconds on each iteration;
4. obtain Tauri state through `StateManager::try_get`;
5. lock the same OnceBox/mutex-backed repository state;
6. call `Repository::load_snapshot_local`;
7. drop CoreError-shaped snapshot-load failures and continue/exit through the
   static branch without proving a user-visible event;
8. compare snapshot fields against the captured baseline;
9. when a compared snapshot field changes, call
   `commands::system::schedule_full_runtime_refresh` and break the loop.

`schedule_full_runtime_refresh` at `0x100262aec` statically proves a global
in-flight guard, an eight-second request throttle, app-handle cloning, and a
`tokio::runtime::blocking::pool::Spawner::spawn_blocking` handoff. It drops the
spawned join handle. This is refresh scheduling evidence only; it does not
prove runtime completion, callback delivery, or frontend consumption.

`RuntimeStateUpdatedPayload::serialize` at `0x1001e361c` serializes a runtime
state update payload with visible map fields of length 8 and 6. Its xref into
event-argument construction proves a static serializer/event plumbing surface
exists. It is not enough to bind the monitor polling body to an emitted
accounts-specific frontend event in a runtime trace.

## Snapshot Load Static Boundary

`Repository::load_snapshot_local` calls `Repository::load_local_state_synced`.
When that lower load returns the error-shaped branch, `load_snapshot_local`
returns a CoreError-shaped result to the command wrapper.

When local state loads successfully, it calls
`Repository::make_status_payload_with_service_state` and wraps the result with
`CoreEnvelope<T>::ok_with_warnings`. Static evidence proves status-envelope
construction, not the exact frontend-visible JSON bytes.

## Cleanup Helper Boundary

The function at `0x10018baf4` is a drop helper for the spawn closure payload.
It drops string/vector-like payload fields, AppHandle, child spawn hooks, and
an Arc reference. It is not the monitor thread body and does not prove callback
registration, event delivery, re-entry behavior, or terminal frontend state.

## Gate Effect

No promotion.

- `consumerStartReady`: unchanged, accounts remains `9/9` for Gate 1 static
  context only.
- `consumerStartBlocked`: unchanged, accounts remains `0/9` for Gate 1 static
  context only.
- `strictImplementationUse`: `0/9`.
- `readyToImplement`: `0/9`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Remaining strict blockers:

- missing live Tauri IPC invocation;
- exact request and decode envelope for monitor attach;
- exact success/error transport bytes;
- runtime behavior for poisoned lock, snapshot-load failure, and spawn failure;
- accepted monitor lifecycle proof beyond the static two-second polling loop
  and 120-second window;
- native callback or event registration proof bound to this accounts monitor;
- terminal frontend CCF/native callback consumption;
- re-entry and duplicate-monitor runtime behavior;
- accepted runtime UI-state / source archive acceptance mapping;
- independent Windows closure where required by the gate.
