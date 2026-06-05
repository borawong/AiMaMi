# Accounts AccountSummary Serializer Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
top-level `AccountSummary` DTO serializer used by accounts list/registry summary
surfaces.

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
- `AccountSummary::serialize`:
  `0x1001d1b5c` and `0x1001d1e88`
- AccountSummary field visitor cross-check:
  `0x1001eb63c`

## Serializer Field Map

The two observed `AccountSummary::serialize` bodies emit the same 19-field JSON
map. IDA top-level refs plus helper `serialize_field` call-sites and direct SOT
byte checks resolve this field set:

| Order | Field | Field ref / source | Length arg | Value pointer / condition |
|---:|---|---:|---:|---|
| 1 | `accountKey` | `0x100edee6e` | `10` | `a1 + 176` |
| 2 | `email` | `0x100ee0904` | `5` | `a1 + 200` |
| 3 | `alias` | `0x100ee0909` | `5` | `a1 + 224` |
| 4 | `accountName` | `0x100ee090e` | `11` | `a1 + 248` |
| 5 | `workspaceName` | `0x100ee0919` | `13` | `a1 + 272` |
| 6 | `profileName` | `0x100ee0926` | `11` | `a1 + 296` |
| 7 | `plan` | `0x100edef33` | `4` | `a1 + 333` |
| 8 | `authMode` | `0x100ee0931` | `8` | `a1 + 328` |
| 9 | `hasActiveSubscription` | `0x100ee0939` | `21` | `a1 + 331` |
| 10 | `subscriptionExpiresAt` | `0x100ee094e` | `21` | `a1` |
| 11 | `subscriptionWillRenew` | `0x100ee0963` | `21` | `a1 + 332` |
| 12 | `isActive` | `0x100ee0978` | `8` | `a1 + 329` |
| 13 | `createdAt` | `0x100ee0046` | `9` | `a1 + 320` |
| 14 | `lastUsedAt` | `0x100ee0980` | `10` | `a1 + 16` |
| 15 | `lastUsageAt` | `0x100ee098a` | `11` | `a1 + 32` |
| 16 | `usageSource` | `0x100edee82` | `11` | `a1 + 330` |
| 17 | `primaryWindow` | `0x100edee8d` | `13` | `a1 + 48` |
| 18 | `secondaryWindow` | `0x100edee9a` | `15` | `a1 + 88` |
| 19 | `tokenStatus` | `0x100edeea9` | `11` | `a1 + 128`; conditional nested `AccountTokenStatus` |

The `plan`, `authMode`, `usageSource`, and `tokenStatus` field names are passed
through specialized `SerializeStruct::serialize_field` helpers; their field
strings were cross-checked from the same SOT byte clusters instead of inferred
from Rust type names alone.

## Accepted Static Facts

- `AccountSummary` exposes 19 account summary fields in the static serializer.
- `tokenStatus` is a conditional nested field; its nested shape is covered by
  `ACCOUNTS-sensitive-field-STATUS-SERIALIZER-STATIC-109.md`.
- This reducer links account summary DTO shape to subscription flags,
  activity timestamps, usage source, rate-limit windows, and nested sensitive-field
  status surfaces.
- This evidence is serializer-only. It does not prove runtime value sources,
  registry/auth/quota side effects, frontend rendering, or accepted IPC bytes.

## Still Missing Before Strict

- exact runtime command/event returning `AccountSummary`;
- exact request and response IPC envelope bytes;
- runtime source and value matrix for every AccountSummary field;
- auth, registry, quota, and temp before/after bytes;
- rollback/no-write fixtures;
- frontend rendering, toast, and query invalidation state;
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
