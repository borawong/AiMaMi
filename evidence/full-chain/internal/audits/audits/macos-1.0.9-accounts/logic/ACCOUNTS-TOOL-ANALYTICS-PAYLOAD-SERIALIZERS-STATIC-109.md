# Accounts Tool Analytics Payload Serializers Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for
`ToolAnalyticsPayload` and nested `ToolRankItem` serializers used by the
`load_tool_analytics` accounts usage/tool analytics surface.

This reducer consumes IDA Pro MCP HTTP decompilation against the SOT universal
binary and direct SOT arm64-slice string checks from
`<source-location>/source-binary/`. It writes no
raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no product code
or rule/spec file, runs no product test, and does not promote any gate.

## Evidence

- SOT binary root:
  `<source-location>/source-binary/`
- IDA active endpoint:
  `<local-tool-endpoint>`
- SOT universal SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- `ToolAnalyticsPayload::serialize`:
  `0x1001d4b48`
- nested `ToolRankItem::serialize`:
  `0x1001d83ec`
- helper `topTools` array serializer:
  `0x100210b98` -> `0x1005d9830`
- SOT field refs / strings:
  `0x100ee0ce3` -> `totalCalls`,
  `0x100ee0ced` -> `distinctCount`,
  `0x100ee0cfa` -> `searchCount`,
  `0x100ee0d05` -> `editCount`,
  `0x100edeef0` -> `path`,
  `0x100ee0ba2` -> `count`
- SOT command string cluster includes:
  `load_tool_analytics`

## Accepted Static Field Map

`ToolAnalyticsPayload::serialize` emits five top-level fields:

| Order | Field | Field ref / source | Length arg |
|---:|---|---:|---:|
| 1 | `totalCalls` | `0x100ee0ce3` | `10` |
| 2 | `distinctCount` | `0x100ee0ced` | `13` |
| 3 | `searchCount` | `0x100ee0cfa` | `11` |
| 4 | `editCount` | `0x100ee0d05` | `9` |
| 5 | `topTools` | helper `0x100210b98` / `0x1005d9830` | array |

Nested `ToolRankItem::serialize` emits two fields:

| Order | Field | Field ref / source | Length arg |
|---:|---|---:|---:|
| 1 | `path` | `0x100edeef0` | `4` |
| 2 | `count` | `0x100ee0ba2` | `5` |

This closes only the static DTO serializer field names for the tool analytics
payload and nested ranking rows.

## Accounts Boundary

This evidence complements:

- `ACCOUNTS-SESSION-ANALYTICS-PAYLOAD-SERIALIZER-STATIC-109.md` for session
  analytics DTO serializer shape;
- `ACCOUNTS-sensitive-field-ANALYTICS-SERIALIZERS-STATIC-109.md` for sensitive-field analytics DTO
  serializer shape;
- `ACCOUNTS-QUOTA-HISTORY-PAYLOAD-SERIALIZERS-STATIC-109.md` for quota history
  DTO serializer shape.

## Still Missing Before Strict

- exact runtime `load_tool_analytics` request and response IPC envelope bytes;
- tool analytics source file/path discovery and before-after bytes;
- runtime `topTools` ordering, path normalization, and count calculation
  semantics;
- empty-tool-history, corrupt-history, permission-error, null/default, and
  time-window behavior;
- frontend chart/query/loading/error state;
- executed source archive acceptance mapping;
- independent Windows closure.

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
