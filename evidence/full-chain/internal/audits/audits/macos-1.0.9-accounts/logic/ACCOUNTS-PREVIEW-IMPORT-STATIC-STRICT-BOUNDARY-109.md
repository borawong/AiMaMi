# Accounts preview_account_import Static Strict Boundary - AiMaMi 1.0.9

## Scope

This reducer narrows `preview_account_import` toward
`strictImplementationUse` using only the active routes:

- backend: IDA MCP
- frontend: packaged frontend extraction

It does not run product code, does not append `INDEX.jsonl`, and does not
promote any gate.

## Evidence

- raw leaf:
  `<source-location>/raw/aimami/1.0.9/macos/accounts/preview_account_import/manifest.json`
- frontend IPC:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ipc-contracts.jsonl:15`
- frontend control flow:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/frontend-control-flow.jsonl:2`
- IDB:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

## Frontend Boundary

Packaged frontend extraction proves:

- wrapper: `previewAccountImport`
- command: `preview_account_import`
- arg keys: `filePath`
- arg object: `{ filePath: t }`
- control-flow owner: `assets/accounts-page-CJFT2P5o.js`
- trigger type: `useMutation.mutationFn`
- semantic i18n field: `accounts.io.openDialogTitle`

This closes the static IPC DTO entry for the command. It does not prove rendered
dialog state, toast bytes, disabled/loading transitions, or same-run UI
acceptance.

## Threading Boundary

IDA confirms the threading path:

- Tokio blocking task poll: `0x100149270`
- poll callsite to command body: `0x100149354`
- Tauri command body: `0x10032c93c`
- core callsite: `0x10032cb40`
- core owner: `0x1005dd788`

The command body runs outside the UI render thread, obtains Tauri state, locks
the repository mutex, copies `filePath`, calls the core owner, maps `CoreError`
Display text to `Err<String>`, and wraps success through `CoreEnvelope::ok`.

## Parser And Pre-Commit Boundary

IDA decompilation of `parse_import_file @ 0x1005e13fc` proves the parser-local
error ordering:

1. `metadata(filePath)` at `0x1005e142c` is the first filesystem touch.
2. metadata failure returns immediately.
3. size guard `> 0xA00000` returns before file read.
4. file read occurs only after metadata success and size acceptance.
5. file read failure returns before JSON decode.
6. JSON decode failure returns before registry and active-account reads.
7. export kind/schema/count/empty-account validation errors are parser-local.

IDA decompilation of `preview_import @ 0x1005dd788` proves:

- `parse_import_file` is called first.
- `read_registry_or_empty_keys @ 0x1005dd878` is reached only after parser
  success.
- `read_active_account_key @ 0x1005dd888` is reached only after parser success.
- preview classification and payload construction are reached only after parser
  success plus registry/active reads.

Therefore all parser error branches above are static pre-commit branches for
registry, active-account, preview classification, and persistence helpers.

## Side-Effect Boundary

For the selected no-write fixture
`accounts.preview_account_import.missing_path.v1`, static evidence proves:

- request shape: `{ "filePath": "<disposable>/import/missing.json" }`
- first touch: metadata lookup
- no file read after metadata failure
- no JSON decode
- no registry field read
- no active account read
- no preview classification
- no snapshot write, registry write, quota write, snooze write, or temp write
  callsite is reached by this branch

This is static side-effect proof only. Exact before/after bytes are still not
accepted.

## Six-Dimension Status

| Dimension | Status | Evidence |
|---|---|---|
| frontend control-flow + UI/state | static IPC/handler partial | IPC row 15, CCF row 2; rendered UI state missing |
| backend owner + body | satisfied static macOS | `0x100149270 -> 0x10032c93c -> 0x1005dd788` |
| implementation leaves | satisfied static for selected parser errors | `0x1005e13fc`, `0x1005e142c`, parser guards, registry/active xrefs |
| interface/error/side-effect | partial static | `filePath` DTO and pre-commit branches known; exact envelope bytes missing |
| platform gate | macOS static only | Windows independent closure missing |
| test/acceptance mapping | draft only | no executed acceptance |

## Gate Decision

No promotion:

```json
{
  "consumerStartReady": "unchanged",
  "strictImplementationUse": false,
  "readyToImplement": false,
  "implementation_use": false,
  "gate_accepted": false,
  "full_leaf_100": false,
  "moduleExitAllowed": false
}
```

`preview_account_import` is closer to strict because the static frontend IPC,
threading model, backend owner, parser-local terminal errors, and no-write
ordering are now explicitly separated from the remaining runtime/platform
dimensions. It still cannot enter `strictImplementationUse` because rendered UI
state, exact runtime envelope bytes, side-effect bytes, executed acceptance,
and Windows same-version closure are not accepted.
