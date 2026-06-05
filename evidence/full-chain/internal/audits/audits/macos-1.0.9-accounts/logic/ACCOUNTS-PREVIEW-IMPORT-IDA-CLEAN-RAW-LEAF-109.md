# Accounts preview_account_import IDA clean raw leaf - 1.0.9 macOS

Status: accepted static IDA raw leaf, no gate promotion.

Raw leaf:
`<source-location>/raw/aimami/1.0.9/macos/accounts/preview_account_import/`

Manifest:
`<source-location>/raw/aimami/1.0.9/macos/accounts/preview_account_import/manifest.json`

Manifest SHA-256:
`af20edb801d1994208ecd09fc2c240f467de1827854a635e525f566source archivefb2aae9`

## Threading Model

Frontend wrapper `previewAccountImport(filePath)` invokes Tauri command
`preview_account_import`. IDA xrefs bind the command body `0x10032c93c` to
Tokio blocking task poll `0x100149270`, callsite `0x100149354`.

The command body obtains Tauri state, locks the account repo mutex, copies the
decoded `filePath`, calls core owner `0x1005dd788`, maps `CoreError` display to
`Err<String>`, and wraps success through `CoreEnvelope::ok @ 0x1001db70c`.

## Static Owner Chain

- `0x100149270` Tokio blocking task poll entry
- `0x10032c93c` Tauri blocking command body
- `0x1005dd788` `codexmate_lib::core::account_io::preview_import`
- `0x1005e13fc` `parse_import_file`
- `0x1005e2b64` `read_registry_or_empty_keys`
- `0x1005e29f4` `read_active_account_key`

## Accepted Branch

Fixture selector:
`accounts.preview_account_import.missing_path.v1`

Request:
`{ "filePath": "<disposable>/import/missing.json" }`

IDA confirms `parse_import_file` starts with metadata at `0x1005e142c`.
Metadata failure returns before file read, JSON decode, registry field read,
active-account read, preview classification, or persistence helpers.

This proves the missing-path branch is static no-write/no-registry/no-mutation.
It does not prove runtime envelope bytes or UI acceptance.

## Cleanup

Legacy raw `call-trees/` files were moved to:
`<source-location>/intermediate/aimami/1.0.9/macos/accounts/preview_account_import/legacy-call-trees-from-raw/call-trees/`

Raw leaf now contains only:
- `AI.md`
- `README.md`
- `SYSTEM-DIFF.md`
- `audits/preview_account_import-ida-closure.json`
- `validation/result.json`
- `manifest.json`
- `file-manifest.json`

## INDEX

The global INDEX already has duplicate exact-field rows 524 and 525 for
`aimami/1.0.9/macos/accounts/preview_account_import`. This cleanup did not
append a third exact-field row. The raw manifest records the historical duplicate
rows and the no-append decision.

## Gate

No promotion:
- `consumerStartReady`: unchanged false at module level
- `strictImplementationUse`: false
- `readyToImplement`: false
- `implementation_use`: false
- `gate_accepted`: false
- `full_leaf_100`: false
- `moduleExitAllowed`: false

## IDA HTTP MCP Fresh Recheck - 2026-06-02

This recheck used the active HTTP `ida-pro-mcp` route required by the current
reverse skill. `server_health` returned the active IDB:

`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

The active IDB input binary and the normal SOT app binary both hash to:

`1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`

Fresh `lookup_funcs`, `xrefs_to`, `callees`, and `decompile` calls reconfirmed
the same owner chain:

- `0x100149270` Tokio task core poll entry.
- `0x100149354` callsite from Tokio poll to the command body.
- `0x10032c93c` `preview_account_import` blocking command body.
- `0x10032cb40` callsite from command body to core owner.
- `0x1005dd788` `core::account_io::preview_import`.
- `0x1005dd7c4` callsite from `preview_import` to parser.
- `0x1005e13fc` `parse_import_file`.
- `0x1005e142c` first filesystem touch, `metadata(filePath)`.

The fresh decompile confirms the selected missing-path fixture still exits
inside `parse_import_file` on metadata failure before file read, JSON decode,
registry field read, active-account field read, preview classification, or any
observed persistence helper. The command body still maps `CoreError Display`
to `Err<String>` and wraps success through `CoreEnvelope::ok`; exact live
transport bytes remain unproven.

Fresh recheck gate effect: no promotion. This is IDA static evidence only; it
does not close runtime IPC, exact response/error envelope bytes, UI/native
state, side-effect byte snapshots, executed acceptance, or Windows parity.
