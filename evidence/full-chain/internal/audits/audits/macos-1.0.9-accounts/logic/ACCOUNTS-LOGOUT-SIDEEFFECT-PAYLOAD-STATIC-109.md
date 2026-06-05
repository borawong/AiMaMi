# Accounts Logout Side-Effect / Payload Static - AiMaMi 1.0.9

Scope: accounts-only static reducer for `logout`.

This reducer uses same-version AiMaMi 1.0.9 IDA HTTP MCP evidence from the
active IDA database:

`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

It writes no raw evidence, appends no `INDEX.jsonl` row, edits no regulation
or skill, runs no product test, changes no product code, and promotes no gate.

## Functions Reduced

| Function | Address | Role |
|---|---:|---|
| `commands::accounts::logout::{closure}::{closure}` | `0x100330e20` | command-side repository lock, `CoreError Display -> Err<String>` conversion |
| `core::repository::Repository::logout` | `0x1005f1d84` | core logout side-effect order |
| `Repository::clear_auto_switch_snooze` | `0x1005ea754` | snooze file removal helper |
| `LogoutPayload::serialize` | `0x1001d8660` | success payload field serializer |

## Command Wrapper Static Boundary

The command closure resolves repository state from Tauri state, locks the
repository, calls `Repository::logout`, and serializes repository errors
through `CoreError Display -> Err<String>`.

If the repository lock is poisoned, the wrapper formats:

`poisoned lock: another task failed inside`

This is a static command-wrapper boundary only. Exact Tauri command transport
bytes are still runtime-only.

## Core Logout Static Order

`Repository::logout` follows this static order:

1. ensure Codex/CodexMate directories;
2. metadata-check the current auth file path;
3. when current auth exists, build a timestamped backup path under the auth
   backup root;
4. copy the current auth file to the backup path;
5. remove the current auth file;
6. load registry;
7. if registry load fails, construct a default/empty registry-shaped state
   rather than returning the registry load error directly;
8. clear the active-account field and update registry timestamp/status bytes;
9. persist registry;
10. clear auto-switch snooze for two stored snooze paths;
11. drop snooze-clear errors after static inspection;
12. return `CoreEnvelope<T>::ok` with logout payload.

`clear_auto_switch_snooze` calls `remove_file`. A missing-file-like result is
accepted as success at the static layer; other IO kinds are converted to
`CoreError`, but `Repository::logout` drops those clear-snooze errors before
returning success.

## Success Payload Static Shape

`LogoutPayload::serialize` serializes exactly two visible fields in this
function:

- `authRemoved`
- `authBackedUp`

Static inference from `Repository::logout`:

- `authRemoved` is tied to whether current auth removal succeeded in the
  static branch;
- `authBackedUp` is tied to whether the backup copy succeeded in the static
  branch.

Exact JSON bytes, boolean values for each runtime branch, and CoreEnvelope
transport order remain runtime evidence.

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

- live Tauri IPC invocation acceptance;
- exact request body and omitted/null/wrong-type decode envelope, even if
  logout has no visible frontend arguments;
- exact success/error transport bytes;
- current-auth present/missing before-after bytes;
- backup file bytes and failure behavior;
- auth remove failure behavior;
- registry active-field and persist before-after bytes;
- auto-switch snooze before-after bytes and non-fatal failure behavior;
- terminal frontend CCF or accepted runtime UI-state;
- executed source archive acceptance mapping;
- independent Windows closure where required by the gate.
