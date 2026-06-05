# Accounts ChatGPT Session Import Payload Serializer Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
`import_chatgpt_session_account` result payload serializer
`ChatGptSessionImportPayload::serialize`.

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
- `ChatGptSessionImportPayload::serialize`:
  `0x1001d704c`

## Serializer Field Map

IDA decompilation of `ChatGptSessionImportPayload::serialize` emits a JSON map
with nine observed fields. Direct SOT byte checks resolve the anonymous field
symbols to:

| Order | Field | IDA field ref | Length arg | Value pointer |
|---:|---|---:|---:|---|
| 1 | `imported` | `0x100ee0fb9` | `8` | `a1 + 124` |
| 2 | `accountKey` | `0x100edee6e` | `10` | `a1` |
| 3 | `email` | `0x100ee0904` | `5` | `a1 + 24` |
| 4 | `plan` | `0x100edef33` | `4` | `a1 + 126` |
| 5 | `snapshotPath` | `0x100ee0fc1` | `12` | `a1 + 48` |
| 6 | `registryAccountCount` | `0x100ee0c8d` | `20` | `a1 + 120` |
| 7 | `activeAccountKey` | `0x100ee0a72` | `16` | `a1 + 72` |
| 8 | `refreshTokenPlaceholder` | `0x100ee0fcd` | `23` | `a1 + 125` |
| 9 | 
ote` | `0x100ee0fe4` | `4` | `a1 + 96` |

The field names were resolved by direct byte reads from the arm64 slice in the
SOT universal binary, not inferred from surrounding strings alone.

## Accepted Static Facts

- `import_chatgpt_session_account` has a distinct result payload serializer
  named `ChatGptSessionImportPayload`.
- The payload exposes the account identity fields `accountKey`, `email`, and
  `plan`, plus persistence/status fields `snapshotPath`,
  `registryAccountCount`, `activeAccountKey`, `refreshTokenPlaceholder`, and
  
ote`.
- This reducer complements existing ChatGPT session import frontend, DTO,
  helper, persistence, and strict-gap reducers; it does not replace them.
- This evidence is serializer-only. It does not prove direct IPC decode
  behavior for `sessionJson` / `overwriteExisting`, parse branches, persistence
  bytes, rollback behavior, frontend state, or accepted runtime traces.

## Still Missing Before Strict

- exact runtime request and response IPC envelope bytes;
- direct IPC omitted/null/default decode behavior for `sessionJson` and
  `overwriteExisting`;
- runtime values for every `ChatGptSessionImportPayload` field under accepted
  fixtures;
- parser branch bytes for malformed session payloads;
- auth snapshot and registry before/after bytes;
- rollback/no-write fixtures for write and rebuild failure;
- frontend dialog/toast/query-invalidation runtime state;
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
