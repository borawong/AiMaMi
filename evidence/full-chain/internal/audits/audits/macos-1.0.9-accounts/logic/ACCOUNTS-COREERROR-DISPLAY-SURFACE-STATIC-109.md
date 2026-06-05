# Accounts CoreError Display Surface Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
shared `CoreError Display -> Err<String>` surface used by accounts command
wrappers.

This reducer consumes IDA Pro MCP HTTP decompilation from the active current
IDA database:

`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

It writes no raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no
rule/spec/skill file, runs no product test, changes no product code, and
promotes no gate.

## Function Reduced

| Function | Address | Static role |
|---|---:|---|
| `<CoreError as core::fmt::Display>::fmt` | `0x10020c20c` | shared CoreError string formatter used by command wrappers |

## Prefix Surface

IDA decompilation of `CoreError::fmt` branches on the CoreError variant tag and
writes formatted strings through `core::fmt::write`. The confirmed static
prefixes are:

```text
IO error:
JSON error:
TOML parse error:
TOML serialize error:
HTTP error:
Not found:
Invalid data:
Operation failed:
```

The first six are directly visible in the nearby string cluster. The final two
are also confirmed by byte-nearby string inspection around the formatter's
format argument addresses.

## Accounts Wrapper Impact

The same formatter is xrefed by current accounts wrapper paths including:

- `switch_account_sync`;
- `perform_switch_payload_with_restart`;
- `preview_account_import`;
- `export_accounts_to_file`;
- `import_accounts_from_file`;
- `import_chatgpt_session_account`;
- `remove_accounts`;
- `logout`;
- `begin_add_account_attach_monitor`.

Static interpretation:

- when a wrapper has a `CoreError` branch and formats it through Display, the
  command-side `Err<String>` content uses one of the shared prefix categories
  above plus the inner error value;
- wrapper-specific plain strings such as poisoned-lock text remain outside
  `CoreError::fmt`;
- command-specific business strings may be wrapped by the `Invalid data`,
  `Not found`, or `Operation failed` families depending on the CoreError
  variant, but exact variant choice per runtime case still needs accepted
  execution.

## Strict Boundary

This reducer does not prove live Tauri/WebView error transport bytes. It also
does not prove direct IPC omitted/null/wrong-type decode behavior, exact
frontend `Error.message`, success envelope bytes, before/after filesystem
state, rollback/no-rollback, executed acceptance, or independent Windows
closure.

It is implementation-planning evidence for static error-string families only.

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
