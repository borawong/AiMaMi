# Accounts usage analytics payload serializers static reducer

Scope: AiMaMi 1.0.9 macOS accounts usage analytics command/DTO static boundary.

Evidence source: SOT confirmed via `<source-location>/source-binary/`. IDA HTTP MCP is attached to `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`, source executable SHA-256 `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`.

## Confirmed Static Evidence

`load_usage_analytics` at `0x1005f894c` locks/clones `CodexPaths`, calls `compute_usage_analytics` at `0x1005f699c`, wraps the success payload with `CoreEnvelope::ok` at `0x1001d9230`, and formats `CoreError` through Display on failure. This proves the same-version backend command owner outline, but not runtime envelope bytes or file-level source data.

`UsageAnalyticsPayload::serialize` at `0x1005f6334` writes a JSON object with three top-level fields:

| Field | Evidence |
|---|---|
| `today` | `format_escaped_str` at `0x1005f6394`, length `5`; top-level field visitor `0x1005fd208` accepts length `5` |
| `sessionStats` | `format_escaped_str` at `0x1005f64b8`, length `12`; top-level field visitor `0x1005fd208` accepts length `12` |
| `dailyActivity` | `format_escaped_str` at `0x1005f6640`, length `13`; top-level field visitor `0x1005fd208` accepts length `13` |

The nested `today` object serializes:

| Field | Evidence |
|---|---|
| `sessionCount` | `serialize_entry` at `0x1005f63fc`, length `12`; `TodaySummary` visitor `0x1005fc138` accepts length `12` |
| `totalFileSize` | `serialize_entry` at `0x1005f641c`, length `13`; `TodaySummary` visitor `0x1005fc138` accepts length `13` |
| `activeMinutesEstimate` | `serialize_entry` at `0x1005f6440`, length `21`; `TodaySummary` visitor `0x1005fc138` accepts length `21` |

The nested `sessionStats` object serializes:

| Field | Evidence |
|---|---|
| `totalSessions` | `serialize_entry` at `0x1005f652c`, length `13`; `SessionStats` visitors `0x1005fba90` / `0x1005fbf58` accept length `13` |
| `totalSizeBytes` | `serialize_entry` at `0x1005f654c`, length `14`; `SessionStats` visitors accept length `14` |
| `activeDays` | `serialize_entry` at `0x1005f656c`, length `10`; `SessionStats` visitors accept length `10` |
| `avgSessionsPerActiveDay` | `serialize_entry` at `0x1005f658c`, length `23`; `SessionStats` visitors accept length `23` |
| `mostActiveDate` | `serialize_entry` at `0x1005f65ac`, length `14`; `SessionStats` visitors accept length `14` |
| `mostActiveCount` | `serialize_entry` at `0x1005f65ec`, length `15`; `SessionStats` visitors accept length `15` |

The `dailyActivity` array serializes each `DailyActivity` row inline. Each row includes:

| Field | Evidence |
|---|---|
| `date` | `format_escaped_str` at `0x1005f66a8` and loop body `0x1005f683c`, length `4`; `DailyActivity` visitor `0x1005fc3b8` accepts length `4` |
| `sessionCount` | `serialize_entry` at `0x1005f66e4` and loop body `0x1005f6870`, length `12`; visitor accepts length `12` |
| `totalFileSize` | `serialize_entry` at `0x1005f6704` and loop body `0x1005f688c`, length `13`; visitor accepts length `13` |
| `activityLevel` | `serialize_entry` at `0x1005f6728` and loop body `0x1005f68a8`, length `13`; visitor accepts length `13` |

## Reducer Conclusion

The 1.0.9 macOS accounts static DTO map now covers the usage analytics payload shape:

```json
{
  "today": {
    "sessionCount": "<number>",
    "totalFileSize": "<number>",
    "activeMinutesEstimate": "<number>"
  },
  "sessionStats": {
    "totalSessions": "<number>",
    "totalSizeBytes": "<number>",
    "activeDays": "<number>",
    "avgSessionsPerActiveDay": "<number>",
    "mostActiveDate": "<string-or-null>",
    "mostActiveCount": "<number>"
  },
  "dailyActivity": [
    {
      "date": "<string>",
      "sessionCount": "<number>",
      "totalFileSize": "<number>",
      "activityLevel": "<number>"
    }
  ]
}
```

This reducer proves same-version static owner outline plus serializer/deserializer field shape only. It does not prove runtime `load_usage_analytics` IPC envelopes, source file bytes, computation rules, date bucketing, sort/order, corrupt/empty/error behavior, frontend chart/query state, accepted fixture execution, or Windows parity.

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
