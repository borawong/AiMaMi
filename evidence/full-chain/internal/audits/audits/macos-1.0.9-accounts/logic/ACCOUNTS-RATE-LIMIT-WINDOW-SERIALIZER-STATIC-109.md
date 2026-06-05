# Accounts RateLimitWindow Serializer Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
`RateLimitWindow` DTO serializer nested under `AccountSummary.primaryWindow`
and `AccountSummary.secondaryWindow`.

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
- `RateLimitWindow::serialize`:
  `0x1001d2730` and `0x1001d2884`
- Parent static reducer:
  `logic/ACCOUNTS-ACCOUNT-SUMMARY-SERIALIZER-STATIC-109.md`

## Serializer Field Map

Both observed `RateLimitWindow::serialize` bodies emit the same four-field JSON
map. Direct SOT byte checks resolve the anonymous field symbols to:

| Order | Field | IDA field ref | Length arg | Value pointer |
|---:|---|---:|---:|---|
| 1 | `usedPercent` | `0x100ee0a36` | `11` | `a1 + 24` |
| 2 | `remainingPercent` | `0x100ee0a41` | `16` | `a1 + 32` |
| 3 | `windowMinutes` | `0x100ee0a51` | `13` | `a1 + 16` |
| 4 | `resetsAt` | `0x100ee0a5e` | `8` | `a1` |

The field names were resolved by direct byte reads from the arm64 slice in the
SOT universal binary, not inferred from adjacent account-summary clusters
alone.

## Accepted Static Facts

- `AccountSummary.primaryWindow` and `AccountSummary.secondaryWindow` use a
  nested `RateLimitWindow` DTO serializer.
- The nested window DTO exposes `usedPercent`, `remainingPercent`,
  `windowMinutes`, and `resetsAt`.
- This reducer closes the nested field shape required to interpret the static
  `AccountSummary` serializer, but it does not prove runtime quota refresh
  sources, actual percentage calculations, or UI rendering.

## Still Missing Before Strict

- exact runtime command/event returning `RateLimitWindow`;
- runtime value source and calculation matrix for usage window fields;
- quota/history store before/after bytes;
- exact IPC request and response envelope bytes;
- frontend rendering/query state for primary and secondary windows;
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
