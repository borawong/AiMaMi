# Accounts Auto Switch Pending Commands Static - AiMaMi 1.0.9

Scope: accounts-only static reducer for pending account auto-switch command
owners and repository leaves in AiMaMi 1.0.9 macOS universal.

This reducer uses same-version IDA Pro MCP HTTP evidence against the SOT
binary under `<source-location>/source-binary/`.
It writes no raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no
rule/spec/skill file, changes no product code, runs no product test, and
promotes no gate.

## Boundary

The command symbols are under `codexmate_lib::commands::system`, but the data
and side effects are account auto-switch state: pending current/candidate
account summaries, auto-switch snooze, repository switch, and runtime snapshot
refresh. This reducer therefore belongs to the active accounts reverse bundle
as an accounts-side state/DTO/side-effect boundary. It does not claim full
system lifecycle, tray watcher, process relaunch, or module-exit closure.

This is not a repeat of:

- `ACCOUNTS-AUTO-SWITCH-PAYLOAD-SERIALIZERS-STATIC-109.md`, which only reduces
  DTO serializer field names;
- `ACCOUNTS-SWITCH-RESTART-ROLLBACK-STATIC-109.md`, which reduces ordinary
  switch/restart and the shared restart recovery helper;
- `ACCOUNTS-STATIC-NONREPEAT-GAP-AUDIT-109.md`, which audits logout, monitor,
  and remove only.

## Evidence

- IDA endpoint: `<local-tool-endpoint>`
- IDA database:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- SOT executable:
  `<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi`
- SOT universal SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`

## Functions Reduced

| Function | Address | Static role |
|---|---:|---|
| `commands::system::load_pending_auto_switch` | `0x1002606fc` | command owner, Repository lock, poison branch, pending payload handoff |
| `commands::system::confirm_pending_auto_switch` | `0x1002613d8` | command owner, Repository lock, pending confirm, accounts runtime refresh |
| `commands::system::dismiss_pending_auto_switch` | `0x1002618b4` | command owner, Repository lock, snooze persistence, unit success/error |
| `Repository::load_pending_auto_switch` | `0x1005ea840` | reads auto-switch pending file and deserializes pending payload |
| `Repository::confirm_pending_auto_switch` | `0x1005eeb54` | loads pending payload and delegates to `Repository::switch_account` |
| `Repository::dismiss_pending_auto_switch` | `0x1005eec9c` | writes snooze record, clears pending auto-switch state |
| `Repository::switch_account` | `0x1005e3cd0` | account switch side-effect owner consumed through pending confirm |
| `commands::accounts::refresh_full_runtime_snapshot` | `0x1001e6a1c` | post-confirm snapshot refresh owner |
| `CodexPaths::ensure_directories` | `0x1005267f8` | directory precondition before snooze write |
| `Repository::clear_auto_switch_snooze` | `0x1005ea754` | pending-file clear after snooze write |

## Command Owner Facts

`load_pending_auto_switch`:

- initializes or locks the shared Repository state;
- formats poisoned Repository lock as `poisoned lock: another task failed inside`;
- calls `Repository::load_pending_auto_switch`;
- copies the returned pending payload into the command result buffer.

`confirm_pending_auto_switch`:

- initializes or locks the shared Repository state;
- formats poisoned Repository lock as the same poisoned-lock string;
- calls `Repository::confirm_pending_auto_switch` while the Repository is
  locked;
- converts `CoreError` through Display into an error-shaped string branch;
- unlocks before calling `commands::accounts::refresh_full_runtime_snapshot`;
- if runtime refresh returns the error-shaped tag, the command returns that
  error-shaped result instead of treating the confirm as fully clean;
- otherwise returns the switch payload produced by the pending confirm path.

`dismiss_pending_auto_switch`:

- initializes or locks the shared Repository state;
- formats poisoned Repository lock as the same poisoned-lock string;
- calls `Repository::dismiss_pending_auto_switch`;
- maps Repository success discriminant `10` to unit/success shape;
- formats non-success Repository errors through `CoreError` Display.

These are command-owner/static facts only. Exact Tauri transport bytes,
omitted/null/wrong-type request behavior, and runtime response envelopes remain
unproved.

## Repository Leaf Facts

`Repository::load_pending_auto_switch`:

- reads the pending auto-switch file path from Repository state offsets
  `+488/+496`;
- missing/read failure returns discriminant `2`;
- read success deserializes JSON through `serde_json::de::from_trait`;
- serde failure returns discriminant `2` after dropping the JSON error;
- serde success copies the pending payload structure to the caller.

`Repository::confirm_pending_auto_switch`:

- first calls `Repository::load_pending_auto_switch`;
- when no pending payload exists, allocates the exact static message
  `No pending auto-switch request`;
- otherwise extracts the pending candidate account field and calls
  `Repository::switch_account`;
- drops the loaded pending current/candidate account summaries after the switch
  owner returns.

`Repository::dismiss_pending_auto_switch`:

- first calls `Repository::load_pending_auto_switch`;
- if no pending payload exists, returns success discriminant `10` without
  writing a snooze record;
- on pending payload success, captures current `SystemTime` and builds an
  `AutoSwitchSnoozeRecord`;
- calls `CodexPaths::ensure_directories`;
- serializes snooze JSON with fields `currentAccountKey`,
  `candidateAccountKey`, and `dismissedAt`;
- writes that JSON to the snooze path from Repository state offsets
  `+512/+520`;
- on write success, calls `Repository::clear_auto_switch_snooze` against the
  pending auto-switch path;
- returns success discriminant `10` only when the clear path returns success;
- propagates directory, serialization, write, or clear errors as error-shaped
  Repository results.

## Accepted Static Facts

- The pending auto-switch command triplet is present in AiMaMi 1.0.9:
  `load_pending_auto_switch`, `confirm_pending_auto_switch`, and
  `dismiss_pending_auto_switch`.
- `confirm_pending_auto_switch` is not just a DTO/read command. It delegates to
  `Repository::switch_account` through the pending payload's candidate account
  field and then refreshes the accounts runtime snapshot.
- `dismiss_pending_auto_switch` persists a snooze record before clearing the
  pending auto-switch state, with field names `currentAccountKey`,
  `candidateAccountKey`, and `dismissedAt`.
- `load_pending_auto_switch` read or serde failure currently shares the static
  discriminant `2`, while successful pending payload decode is copied back to
  the command owner.
- Missing pending confirm uses the exact static message
  `No pending auto-switch request`.
- The command-owner lock poison branch is the same
  `poisoned lock: another task failed inside` string used by adjacent accounts
  state commands.

## Still Missing Before Strict

- live AiMaMi 1.0.9 WebView/Tauri IPC invocation for the three commands;
- exact request bodies and omitted/null/wrong-type decode envelopes;
- exact success/error/CoreError transport bytes;
- pending-file, snooze-file, auth, registry, quota, and snapshot before-after
  bytes;
- confirm success, no-pending, switch failure, refresh failure, dismiss
  no-pending, write failure, and clear failure runtime fixtures;
- frontend pending-switch dialog/query/toast state under concrete fixtures;
- executed source archive acceptance mapping;
- independent Windows closure where required by the gate.

## Gate Effect

No promotion.

- `consumerStartReady`: unchanged, accounts remains `9/9` Gate 1 static only.
- `consumerStartBlocked`: unchanged, accounts remains `0/9` Gate 1 static only.
- `strictImplementationUse`: `0/9`.
- `readyToImplement`: `0/9`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Accounts remains the active locked module. This reducer does not permit
switching to plugins, relay, system, or tray.
