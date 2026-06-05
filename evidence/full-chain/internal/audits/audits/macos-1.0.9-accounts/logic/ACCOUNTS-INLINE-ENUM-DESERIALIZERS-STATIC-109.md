# Accounts Inline Enum Deserializers Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for enum
deserializers used by account summary, auth mode, usage source, and sensitive-field
status DTO parsing.

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
- IDA functions:
  - `AuthMode::deserialize` at `0x1001d749c`
  - `AuthMode::__FieldVisitor::visit_bytes` at `0x1001e950c`
  - `UsageSource::deserialize` at `0x1001d7b44`
  - `UsageSource::__FieldVisitor::visit_bytes` at `0x1001e9c9c`
  - `AccountTokenStatusCode::deserialize` at `0x1001d5f8c`
  - `AccountTokenStatusCode::__FieldVisitor::visit_bytes` at `0x1001ecfb0`
  - `AccountTokenStatusCode::__FieldVisitor::visit_str` at `0x1001ed2c0`

## Accepted Parse Maps

`AuthMode` accepts two string variants:

| Visitor | Input length | Accepted string | Decoded variant |
|---|---:|---|---|
| `0x1001e950c` | `7` | `chatgpt` | default / byte `0` |
| `0x1001e950c` | `6` | `apikey` | byte `1` |

`UsageSource` accepts two string variants:

| Visitor | Input length | Accepted string | Decoded variant |
|---|---:|---|---|
| `0x1001e9c9c` | `5` | `local` | default / byte `0` |
| `0x1001e9c9c` | `3` | `api` | byte `1` |

`AccountTokenStatusCode` accepts five string variants:

| Visitor | Input length | Accepted string | Decoded variant |
|---|---:|---|---|
| `0x1001ecfb0`, `0x1001ed2c0` | `5` | `fresh` | default / byte `0` |
| `0x1001ecfb0`, `0x1001ed2c0` | `9` | `refreshed` | byte `1` |
| `0x1001ecfb0`, `0x1001ed2c0` | `14` | 
oRefreshToken` | byte `2` |
| `0x1001ecfb0`, `0x1001ed2c0` | `13` | `refreshReused` | byte `3` |
| `0x1001ecfb0`, `0x1001ed2c0` | `13` | `refreshFailed` | byte `4` |

Unknown input strings call `serde_core::de::Error::unknown_variant`, so the
static parse boundary rejects values outside the accepted variant set above.

## Accounts Boundary

These deserializers belong to accounts because the same enum values are used by
account import/export parsing, account summary roundtrip, sensitive-field status parsing,
and auth/usage source DTO handling. This reducer complements the serializer
reducers by closing the reverse parse direction for these enum string sets.

## Still Missing Before Strict

- runtime fixture proving omitted/null/default behavior for enum fields;
- exact IPC envelopes for parse failures and successful roundtrip;
- account import/export before-after bytes;
- frontend state for invalid enum input and sensitive-field status values;
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
