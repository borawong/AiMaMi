# Accounts Auto Switch Payload Serializers Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
account auto-switch DTO serializers exposed under `codexmate_lib::core::models`.

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
  - `AutoSwitchConfigPayload::serialize` at `0x1001d622c`
  - `AutoSwitchStatusPayload::serialize` at `0x1001d6330`
  - `PendingAutoSwitchPayload::serialize` at `0x1001d6830`
  - `PendingAutoSwitchPayload::serialize` at `0x1001d6998`

## Serializer Field Map

`AutoSwitchConfigPayload::serialize` emits one top-level config field:

| Function | Field ref | Length arg | JSON field |
|---|---:|---:|---|
| `0x1001d622c` | `0x100ee0a99` | `10` | `autoSwitch` |

`AutoSwitchStatusPayload::serialize` emits the active auto-switch status shape:

| Function | Field ref | Length arg | JSON field |
|---|---:|---:|---|
| `0x1001d6330` | `0x100ee0b71` | `7` | `enabled` |
| `0x1001d6330` | `0x100ee0eb6` | `18` | `threshold5hPercent` |
| `0x1001d6330` | `0x100ee0ec8` | `22` | `thresholdWeeklyPercent` |
| `0x1001d6330` | `0x100ee0ad4` | `12` | `serviceState` |
| `0x1001d6330` | `0x100ee0ede` | `12` | `serviceLabel` |

`PendingAutoSwitchPayload::serialize` has two serializer instantiations with
the same emitted field order:

| Function | Field ref | Length arg | JSON field |
|---|---:|---:|---|
| `0x1001d6830`, `0x1001d6998` | `0x100ee0f1c` | `11` | `requestedAt` |
| `0x1001d6830`, `0x1001d6998` | `0x100ee0f27` | `14` | `currentAccount` |
| `0x1001d6830`, `0x1001d6998` | `0x100ee0f35` | `16` | `candidateAccount` |
| `0x1001d6830`, `0x1001d6998` | `0x100ee0eb6` | `18` | `threshold5hPercent` |
| `0x1001d6830`, `0x1001d6998` | `0x100ee0ec8` | `22` | `thresholdWeeklyPercent` |

The field refs sit in longer adjacent string clusters in `.rodata`. The length
arguments above are the serializer arguments observed in IDA, so the emitted
JSON field names are the exact prefixes shown in the table.

## Accounts Boundary

These serializers are accepted under the accounts module because the payloads
carry account auto-switch configuration, status, and pending current/candidate
account summaries. This reducer does not claim system lifecycle, tray watcher,
or process-restart closure. Watcher ownership and relaunch behavior remain
covered only by their parent module rows until those modules are active.

## Accepted Static Facts

- Auto-switch config response payload has top-level field `autoSwitch`.
- Auto-switch status payload has fields `enabled`, `threshold5hPercent`,
  `thresholdWeeklyPercent`, `serviceState`, and `serviceLabel`.
- Pending auto-switch payload has fields `requestedAt`, `currentAccount`,
  `candidateAccount`, `threshold5hPercent`, and `thresholdWeeklyPercent`.
- The two pending serializer instantiations at `0x1001d6830` and `0x1001d6998`
  emit the same JSON field sequence.

## Still Missing Before Strict

- runtime value sources for thresholds, service state, service label, and
  pending current/candidate account summaries;
- exact commands/events returning these payloads;
- exact IPC request and response envelope bytes;
- auto-switch config/snooze/transient-state before-after bytes;
- frontend rendering, query state, and pending-switch dialog state;
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
