# Accounts AccountSummary Inline Enum Serializers Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
inline `authMode` and `usageSource` enum serializers used by
`AccountSummary::serialize`.

This reducer consumes IDA Pro MCP HTTP decompilation against the SOT universal
binary and direct arm64-slice byte checks from `<source-location>/source-binary/`.
It writes no raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no
product code or rule/spec file, runs no product test, and does not promote any
gate.

## Evidence

- SOT binary root:
  `<source-location>/source-binary/`
- IDA active input:
  `AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi`
- IDA active endpoint:
  `<local-tool-endpoint>`
- SOT universal SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Parent `AccountSummary::serialize`:
  `0x1001d1b5c` and `0x1001d1e88`
- `authMode` helper call chain:
  `0x100210ad8` -> `0x1005d873c`,
  `0x100211058` -> `0x1005ccfe4`
- `usageSource` helper call chain:
  `0x100210c18` -> `0x1005ce7b4`,
  `0x100210818` -> `0x1005cb674`

## Inline Enum String Map

`authMode` is serialized through specialized helper bodies rather than a
separate named `AuthMode::serialize` function in the current IDA symbol set.
Both observed helper variants choose the same string set:

| Field | Branch | IDA string ref | Length arg | JSON string |
|---|---|---:|---:|---|
| `authMode` | default / non-`1` | `0x100ee1033` | `7` | `chatgpt` |
| `authMode` | `1` | `0x100ee103a` | `6` | `apikey` |

`usageSource` is also serialized through specialized helper bodies. Both
observed helper variants choose the same string set:

| Field | Branch | IDA string ref | Length arg | JSON string |
|---|---|---:|---:|---|
| `usageSource` | `1` | `0x100ee0995` | `3` | `api` |
| `usageSource` | default / non-`1` | `0x100ee104e` | `5` | `local` |

The string values were resolved by direct byte reads from the arm64 slice in the
SOT universal binary. `0x100ee0995` sits in a longer usage analytics cluster,
but the helper length argument is `3`, so the emitted value is only `api`.
`0x100ee104e` sits before `ApiProxyMode`, but the helper length argument is `5`,
so the emitted value is only `local`.

## Accepted Static Facts

- `AccountSummary.authMode` serializes as `chatgpt` or `apikey`.
- `AccountSummary.usageSource` serializes as `api` or `local`.
- The current IDA symbol set does not expose separate named serializer
  functions for these two fields; they are inline helper serializers under
  `AccountSummary::serialize`.
- This reducer complements `ACCOUNTS-ACCOUNT-SUMMARY-SERIALIZER-STATIC-109.md`
  by resolving the nested enum/string value sets for two fields that were
  previously field-name-only.

## Still Missing Before Strict

- runtime source and value matrix for `authMode` and `usageSource`;
- exact commands/events returning AccountSummary;
- exact IPC request and response envelope bytes;
- auth, registry, quota, and usage before/after bytes;
- frontend rendering and query state for these values;
- executed source archive acceptance mapping;
- independent Windows closure.

## Gate Effect

- `consumerStartReady`: unchanged.
- `strictImplementationUse`: false / `0`.
- `readyToImplement`: false / `0`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Accounts remains the active locked module. This reducer does not permit
switching to plugins, relay, system, or tray.
