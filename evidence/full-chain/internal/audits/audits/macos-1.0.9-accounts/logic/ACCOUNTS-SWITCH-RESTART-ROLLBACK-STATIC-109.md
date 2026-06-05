# Accounts Switch / Restart Rollback Static - AiMaMi 1.0.9

Scope: accounts-only static reducer for `switch_account` and
`switch_account_and_restart_codex`.

This reducer uses same-version AiMaMi 1.0.9 IDA HTTP MCP evidence from the
active IDA database:

`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

It writes no raw evidence, appends no `INDEX.jsonl` row, edits no regulation
or skill, runs no product test, changes no product code, and promotes no gate.

## Functions Reduced

| Function | Address | Role |
|---|---:|---|
| `commands::accounts::switch_account_sync` | `0x1001e32c4` | command-side lock, repository call, `CoreError Display -> Err<String>` conversion |
| `commands::accounts::switch_account_and_restart_sync` | `0x1001e6be4` | capture rollback, switch, relaunch, restore/recovery orchestration |
| `core::repository::Repository::switch_account` | `0x1005e3cd0` | core switch side-effect order and success envelope |
| `commands::accounts::perform_switch_payload_with_restart` | `0x1001e8258` | pending auto-switch confirmation plus switch/restart recovery path |
| `commands::accounts::capture_switch_rollback_state` | `0x1001e48d4` | static rollback snapshot capture helper |

## `switch_account` Static Order

`switch_account_sync` first resolves the repository state from Tauri state and
serializes repository errors through `CoreError Display -> Err<String>`. A
poisoned command lock formats `poisoned lock: another task failed inside`
before returning an error string. These are wrapper/static facts only; exact
Tauri error transport bytes are still runtime-only.

`Repository::switch_account` then follows this static order:

1. metadata check for the registry path;
2. if registry metadata fails, return `No AiMaMi registry exists yet`;
3. load registry;
4. search registry rows for matching `accountKey`;
5. if not found, format `Account not found: ...`;
6. read the matched row's snapshot path;
7. metadata check for the snapshot path;
8. if snapshot metadata fails, format `Snapshot file missing: ...`;
9. ensure target directories;
10. if current auth exists, copy it to a timestamped backup path;
11. copy selected account snapshot over the active auth path;
12. copy selected `accountKey` into the registry active field and timestamp
    the selected row;
13. persist registry;
14. clear auto-switch transient state;
15. reload auth file;
16. make auth snapshot;
17. load quota store or default;
18. find quota item and build account summary;
19. return `CoreEnvelope<T>::ok_with_warnings` with
    `CLIENT_RESTART_RECOMMENDED` and message
    `Restart Codex clients for the new auth snapshot to take effect.`

This closes only static ordering for the command. It does not prove exact
success envelope bytes, exact error envelope bytes, auth/registry/quota/
backup before-after bytes, or rollback/no-rollback behavior under runtime
failure.

## Restart / Rollback Static Order

`switch_account_and_restart_sync` wraps the switch with rollback capture and
restart/recovery logic:

1. call `capture_switch_rollback_state` before switching;
2. abort early if rollback capture fails;
3. call `switch_account_sync`;
4. on switch failure, run repeated `FileRestoreState::restore` calls against
   captured rollback files and aggregate restore errors;
5. refresh full runtime snapshot after rollback attempt;
6. on switch success, call `relaunch_codex_after_success`;
7. if relaunch fails, format `Codex restart failed: ...`, restore captured
   files, try relaunch recovery again, and format `Codex recovery failed: ...`
   when the recovery relaunch also fails;
8. refresh full runtime snapshot and append warning candidate
   `RUNTIME_REFRESH_FAILED_AFTER_SWITCH` when snapshot refresh reports an
   error;
9. join accumulated messages into an error string when rollback/recovery
   fails, otherwise return the switch payload.

`perform_switch_payload_with_restart` is the pending-auto-switch variant. It
confirms pending auto-switch inside the same repository lock, converts
`CoreError` to a display string on failure, then follows the same restore /
relaunch / recovery pattern around a successful pending switch payload.

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

- accepted live Tauri IPC invocation for both commands;
- exact request body and omitted/null/wrong-type `accountKey` decode
  envelopes;
- exact success/error/restart/recovery transport bytes;
- auth, registry, quota, backup, and restore before-after bytes;
- switch failure rollback and restart failure recovery fixtures;
- visible pure-switch UI-state for `switch_account`;
- restart/process observation for `switch_account_and_restart_codex`;
- executed source archive acceptance mapping;
- independent Windows closure where required by the gate.
