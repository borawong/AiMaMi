# Accounts change analytics payload serializers static reducer

Scope: AiMaMi 1.0.9 macOS accounts usage/change analytics DTO serialization.

Evidence source: SOT confirmed via `<source-location>/source-binary/`. IDA HTTP MCP is attached to `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`, source executable SHA-256 `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`.

## Confirmed Static Evidence

`ChangeAnalyticsPayload::serialize` at `0x1001d5a74` writes a JSON object. The same-version serializer emits these top-level fields:

| Field | Evidence |
|---|---|
| `totalCommands` | `serialize_entry` at `0x1001d5ad4`, string ref `0x100ee0e62`, length `13` |
| `writeCommands` | `serialize_entry` at `0x1001d5b20`, string ref `0x100ee0e6f`, length `13` |
| `readCommands` | `serialize_entry` at `0x1001d5b44`, string ref `0x100ee0e7c`, length `12` |
| `otherCommands` | `serialize_entry` at `0x1001d5b68`, string ref `0x100ee0e88`, length `13` |
| `series` | helper chain `0x100210998` -> `0x1005d7da4`; field string ref `0x100ee0de8` |

The `series` helper serializes a vector of `ChangeDaySeries` rows. `serde_core::ser::SerializeMap::serialize_entry::hcd9c47434d63e38d` at `0x1005d7da4` writes the field name, opens `[`, serializes the first item with `ChangeDaySeries::serialize`, then iterates items at 40-byte stride before closing `]`.

`ChangeDaySeries::serialize` at `0x1001d2468` writes each row with:

| Field | Evidence |
|---|---|
| `date` | `serialize_entry` at `0x1001d24c8`, string ref `0x100ee0998`, length `4` |
| `commands` | `serialize_entry` at `0x1001d2514`, string ref `0x100ee09d7`, length `8` |
| `writeOps` | `serialize_entry` at `0x1001d2538`, string ref `0x100ee09df`, length `8` |
| `readOps` | `serialize_entry` at `0x1001d255c`, string ref `0x100ee09e7`, length `7` |

## Reducer Conclusion

The 1.0.9 macOS accounts static DTO map now covers the change analytics payload shape:

```json
{
  "totalCommands": "<number>",
  "writeCommands": "<number>",
  "readCommands": "<number>",
  "otherCommands": "<number>",
  "series": [
    {
      "date": "<string>",
      "commands": "<number>",
      "writeOps": "<number>",
      "readOps": "<number>"
    }
  ]
}
```

This reducer only proves same-version static serializer field shape. It does not prove runtime `load_change_analytics` IPC envelopes, source file bytes, calculation semantics, ordering, empty/error/corrupt behavior, frontend chart/query state, accepted fixture execution, or Windows parity.

## Gate Effect

No promotion.

- `consumerStartReady` remains Gate 1 static only.
- `strictImplementationUse=0`.
- `readyToImplement=0`.
- `implementation_use=false`.
- `gate_accepted=false`.
- `full_leaf_100=false`.
- `moduleExitAllowed=false`.

No raw evidence was created, no `INDEX.jsonl` row was appended, no regulation/spec/skill file was edited, no product code was changed, and no product tests were run.
