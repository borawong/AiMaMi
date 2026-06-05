# ACCOUNTS-IDB-WRITEBACK-CURRENT-SYNC-109

Status: `accepted_accounts_idb_writeback_current_sync_no_promotion`

Produced at: `2026-06-02T22:42:00+08:00`

Scope: AiMaMi `1.0.9` macOS accounts only.

Current reducer:
`logic/ACCOUNTS-IDB-WRITEBACK-CURRENT-SYNC-109.md`

## IDA Session

IDA MCP `server_health` was `status=ok` against the AiMaMi 1.0.9 SOT IDB:

- IDB: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- input binary: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi`
- SHA-256: `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- `auto_analysis_ready=true`
- `hexrays_ready=true`
- `strings_cache_ready=true`

## Writeback

This reducer closes the IDB writeback gap left by
`logic/ACCOUNTS-FULL-IDA-CLOSURE-ROLLUP-109.md`.

IDA MCP `set_comments` wrote 38 reuse comments for the current macOS accounts
owner, wrapper, callsite, parser, write, rebuild, monitor, event, and
conversion anchors.

IDA MCP `idb_save` returned:

```json
{
  "ok": true,
  "path": "<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64"
}
```

## Commented Anchors

| target | comments written |
|---|---|
| `switch_account` | `0x1005e3cd0`, `0x1001e32c4`, `0x1001e3444` |
| `switch_account_and_restart_codex` | `0x1001e6be4`, `0x10030ddfc`, `0x100332708` |
| `preview_account_import` | `0x1005dd788`, `0x10032c93c`, `0x10032cb40`, `0x1005e13fc` |
| `import_accounts_from_file` | `0x1005dfb6c`, `0x10032d77c`, `0x10032d97c`, `0x1005e0764`, `0x1005e0924` |
| `export_accounts_to_file` | `0x1005ddd0c`, `0x10032ce58`, `0x10032d0cc`, `0x1005df458` |
| `logout` | `0x1005f1d84`, `0x100330e20`, `0x100330f84` |
| `remove_accounts` | `0x1005e4850`, `0x100330a08`, `0x100330be8` |
| `begin_add_account_attach_monitor` | `0x100262db4`, `0x1003250c0`, `0x100325278`, `0x100529504`, `0x100262aec`, `0x10030d508`, `0x1001e3ad0` |
| `import_chatgpt_session_account` | `0x1005e1d6c`, `0x10032dbf0`, `0x10032dd64`, `0x100625bc4`, `0x1005e2250`, `0x1005e2278` |

## Current Accounts Position

The current macOS accounts static IDA layer remains closed for 9/9 required
targets. This reducer adds the missing IDB comment/save state and keeps the
runtime queue unchanged.

Current non-promoting runtime queue:

`logic/ACCOUNTS-MACOS-RUNTIME-GATE-AFTER-IDA-QUEUE-109.md`

Remaining macOS strict/full gates:

- live WKWebView/Tauri IPC request, response, and error envelope bytes
- exact runtime success/error payload bytes
- before/after filesystem bytes and no-write residue fixtures
- rendered UI/toast/dialog/query-state proof
- executed source archive acceptance fixtures
- terminal frontend listener consumption for monitor/runtime event delivery

## Gate Effect

No promotion and no module switch:

```json
{
  "strictImplementationUse": false,
  "readyToImplement": false,
  "implementation_use": false,
  "gate_accepted": false,
  "full_leaf_100": false,
  "moduleExitAllowed": false
}
```
