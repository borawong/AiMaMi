# Accounts PlanType Serializer Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
`PlanType` enum serializer used by account summary, preview import entry, export
account rows, and ChatGPT session import result payloads.

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
- `PlanType::serialize`:
  `0x1001d7254` and `0x1001d7378`

## Enum String Map

Both observed `PlanType::serialize` bodies emit the same string set by the
discriminant byte. Direct SOT byte checks resolve the anonymous refs to:

| Discriminant path | IDA string ref | Length arg | JSON string |
|---|---:|---:|---|
| `0` | `0x100edef01` | `4` | `free` |
| `1` | `0x100edef05` | `4` | `plus` |
| `2` | `0x100ee1040` | `5` | `pro5x` |
| `3` | `0x100ee1045` | `6` | `pro20x` |
| `4` | `0x100edef09` | `4` | `team` |
| `5` | `0x100edef0d` | `8` | `business` |
| `6` | `0x100edef15` | `10` | `enterprise` |
| `7` | `0x100edef1f` | `3` | `edu` |
| fallback / else | `0x100edeee5` | `7` | `unknown` |

The string names were resolved by direct byte reads from the arm64 slice in the
SOT universal binary, not inferred from nearby `chatgpt_plan_type` strings.

## Accepted Static Facts

- `PlanType::serialize` has two observed serializer bodies and both use the
  same enum string set.
- The `plan` field in `AccountSummary` and `ChatGptSessionImportPayload` points
  to this serializer; preview/import/export account row payloads share the same
  account plan string vocabulary.
- This reducer closes the enum serializer shape only. It does not prove runtime
  source parsing, plan upgrade/downgrade decisions, subscription state, or UI
  rendering.

## Still Missing Before Strict

- exact runtime source for each plan value;
- ChatGPT session parser branch that maps raw session fields to each plan value;
- preview/import/export/account-summary runtime envelopes and field values;
- auth/registry/quota before-after bytes;
- frontend rendering and toast/query state for plan values;
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
