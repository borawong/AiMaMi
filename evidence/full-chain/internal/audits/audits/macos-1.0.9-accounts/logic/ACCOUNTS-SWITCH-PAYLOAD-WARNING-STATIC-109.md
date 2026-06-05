# Accounts Switch Payload / Warning Static - AiMaMi 1.0.9

Scope: accounts-only static reducer for `switch_account` and
`switch_account_and_restart_codex` payload, warning, and restart-recovery error
composition.

This reducer uses same-version AiMaMi 1.0.9 IDA HTTP MCP evidence from the
active IDA database plus the existing accepted Ghidra producer pseudocode:

`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

It writes no raw evidence, appends no `INDEX.jsonl` row, edits no regulation
or skill, runs no product test, changes no product code, and promotes no gate.

## Functions Reduced

| Function | Address | Role |
|---|---:|---|
| `SwitchPayload::serialize` | `0x1001d88d0` | switch success payload map serializer |
| `CoreEnvelope<T>::ok_with_warnings` | `0x1001d8a48` | success envelope with warnings |
| `append_switch_warning` | `0x1001e375c` | runtime refresh warning append helper |
| `switch_account_and_restart_sync` | `0x1001e6be4` | restart / rollback / recovery composition context |

## Switch Payload Static Shape

`SwitchPayload::serialize` opens a JSON map and serializes five visible entries
in this static order:

1. `previousAccountKey`
2. `activeAccountKey`
3. `activeAccount`
4. `authUpdated`
5. `registryUpdated`

IDA string byte checks confirm those field names at these references:

| Field | String address | Length in serializer |
|---|---:|---:|
| `previousAccountKey` | `0x100ee11e5` | 18 |
| `activeAccountKey` | `0x100ee0a72` | 16 |
| `activeAccount` | `0x100ee0a8c` | 13 |
| `authUpdated` | `0x100ee11f7` | 11 |
| `registryUpdated` | `0x100ee0ea0` | 15 |

`CoreEnvelope<T>::ok_with_warnings` allocates the static status/message strings
`ok` and `Success`, copies the payload into the envelope, and carries a warnings
array/vector area. This proves the static success-envelope class, not exact
runtime JSON bytes.

## Warning / Restart-Recovery Static Composition

`append_switch_warning` always appends a warning code string:

`RUNTIME_REFRESH_FAILED_AFTER_SWITCH`

The warning message value is copied from its string argument. The Ghidra
pseudocode for `switch_account_and_restart_codex` shows the warning argument is
formatted from the runtime snapshot refresh failure after a successful switch
and successful relaunch path, with the visible prefix:

`Switched account, but runtime...`

Static restart failure composition follows this shape:

1. after a successful switch, `relaunch_codex_after_success` is called;
2. if relaunch fails, an error string with prefix
   `Codex restart failed: ...` is inserted into an error vector;
3. `FileRestoreState::restore` is attempted for captured rollback files;
4. any rollback failure appends `Rollback failed: ...`;
5. a recovery relaunch path may append `Codex recovery failed: ...`;
6. the error vector is joined with ` | `;
7. the joined string is returned as an error variant, not a success envelope.

This narrows static implementation planning for restart/recovery error text
classes and warning payload classes. It does not prove exact runtime envelope
bytes, process relaunch behavior, rollback file bytes, or UI behavior.

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
- exact request and decode envelopes for switch/restart commands;
- exact success/error/warning transport bytes and CoreEnvelope field presence;
- auth/registry/quota/backup/restore before-after bytes;
- switch failure rollback and restart failure recovery fixtures;
- restart/process observation;
- visible pure-switch UI-state and restart UI behavior;
- executed source archive acceptance mapping;
- independent Windows closure where required by the gate.
