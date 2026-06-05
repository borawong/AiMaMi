# Accounts Logout Auth Branch Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for
`logout`, narrowing current-auth present/missing control flow, success payload
boolean sources, and non-fatal auto-switch snooze clearing.

This reducer consumes IDA Pro MCP HTTP decompilation from the active current
IDA database:

`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

It writes no raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no
rule/spec/skill file, runs no product test, changes no product code, and
promotes no gate.

## Functions Reduced

| Function | Address | Static role |
|---|---:|---|
| `Repository::logout` | `0x1005f1d84` | current-auth metadata branch, backup/remove booleans, registry clear/persist, snooze-clear handoff |
| `LogoutPayload::serialize` | `0x1001d8660` | success payload field serializer |
| `commands::accounts::logout::{closure}::{closure}` | `0x100330e20` | no-arg command wrapper, repository lock, `CoreError Display -> Err<String>` |
| `Repository::clear_auto_switch_snooze` | `0x1005ea754` | remove-file helper with missing-file-like success branch |

## Current-Auth Branch

IDA decompilation of `Repository::logout` shows the first branch after
`CodexPaths::ensure_directories` is a metadata check on the current auth file
path.

If current auth metadata is present:

- the function builds a timestamped backup path under the auth backup root;
- it calls `std::sys::fs::copy` for current auth to backup;
- it derives one boolean from whether that copy returned success;
- it calls `std::sys::fs::remove_file` on the current auth path;
- it derives a second boolean from whether that remove returned success;
- it then proceeds to registry load/default construction, active-account clear,
  registry persist, snooze clears, and success envelope construction.

If current auth metadata is absent:

- the function drops the metadata result;
- it sets both success payload booleans to false before the registry work;
- it still proceeds to registry load/default construction, active-account
  clear, registry persist, snooze clears, and success envelope construction.

Static interpretation:

```text
current auth metadata present:
  authRemoved source = remove_file(current_auth_path) success
  authBackedUp source = copy(current_auth_path, timestamped_backup_path) success

current auth metadata absent:
  authRemoved source = false
  authBackedUp source = false
```

This is static branch/source proof only. It does not prove runtime filesystem
bytes, exact error envelopes, or boolean values for permission-denied,
cross-device, partial-copy, remove-failure, or race cases.

## Success Payload Fields

`LogoutPayload::serialize` writes exactly two map entries:

- `authRemoved`
- `authBackedUp`

The serializer writes `authRemoved` first and `authBackedUp` second in the
static serde path. Runtime JSON bytes, enclosing `CoreEnvelope` ordering, and
transport framing remain unaccepted until a live Tauri/WebView IPC trace exists.

## Snooze Clear Semantics

`Repository::clear_auto_switch_snooze` calls `std::sys::fs::remove_file`.
Static branch shape:

- remove success returns success;
- a missing-file-like `ErrorKind` branch is also converted to success;
- other IO kinds return a `CoreError`-shaped value.

`Repository::logout` calls this helper for two snooze paths after registry
persist succeeds. If a clear returns an error-shaped value, `logout` drops that
`CoreError` and still builds the `CoreEnvelope::ok` success payload from the
auth backup/remove booleans.

This narrows implementation planning for snooze cleanup: snooze clear failure
is not a command-failing branch at this static return boundary. It remains
runtime-only to prove exact before/after snooze bytes and the exact envelope
when snooze removal fails.

## Command Wrapper Boundary

The no-arg command closure at `0x100330e20`:

- obtains repository state through `tauri::state::StateManager::try_get`;
- locks the repository mutex;
- formats poisoned lock as `poisoned lock: another task failed inside`;
- calls `Repository::logout`;
- copies a success `CoreEnvelope` to the Tauri result path;
- converts `CoreError` through its Display implementation into `Err<String>`.

This proves there is no command payload field to decode for normal frontend
calls, but direct Tauri/WebView transport framing and exact success/error bytes
remain runtime-only.

## Still Missing Before Strict

- live AiMaMi 1.0.9 WebView/Tauri IPC invocation;
- exact request, success, and error transport bytes;
- current-auth present/missing before-after bytes;
- backup-file bytes and failure behavior;
- auth remove failure behavior;
- registry active-field and persist before-after bytes;
- snooze before-after bytes and non-fatal error envelope;
- terminal frontend CCF or accepted runtime UI-state;
- executed source archive acceptance mapping;
- independent Windows closure where required by the gate.

## Gate Effect

- `consumerStartReady`: unchanged.
- `consumerStartBlocked`: unchanged.
- `strictImplementationUse`: false / `0`.
- `readyToImplement`: false / `0`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Accounts remains the active locked module. This reducer does not permit
switching to plugins, relay, system, or tray.
