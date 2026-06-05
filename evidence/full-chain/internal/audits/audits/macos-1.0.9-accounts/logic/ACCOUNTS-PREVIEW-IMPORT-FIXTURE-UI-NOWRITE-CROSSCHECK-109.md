# Accounts Preview Import Fixture UI / No-Write Crosscheck - AiMaMi 1.0.9

Scope: accounts-only same-version static crosscheck for the first strict
fixture lane, `accounts.preview_account_import.missing_path.v1`.

This reducer creates no raw evidence, appends no `INDEX.jsonl` row, edits no
regulation, edits no product code, runs no product/main test, and promotes no
gate. It uses existing frontend static evidence plus IDA MCP current IDB
crosscheck. No raw dump, pseudocode corpus, log, or binary is copied into
`source archive`.

## Evidence

- Frontend asset:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/accounts-page-CJFT2P5o.js`
- IPC wrapper asset:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/index-CL22l5v8.js`
- Frontend CCF row:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/frontend-control-flow.jsonl` row 2.
- IPC contract row:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/ipc-contracts.jsonl` row 15.
- IDA database:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- Binary SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- IDB writeback: comments were added to `0x10032c93c`, `0x10032cb40`,
  `0x1005dd788`, `0x1005dd7c4`, `0x1005e13fc`, and `0x1005e142c`;
  `idb_save` returned OK.

## Frontend Fixture Shape

The bundled accounts page exposes the preview fixture through the import
button path:

```text
open native file picker
  title = accounts.io.openDialogTitle
  multiple = false
  directory = false
  filter = AiMaMi Accounts Backup / json
if no string path is returned -> throw Error("CANCELLED")
else W.previewAccountImport(path).data
```

Static consumption:

- `CANCELLED` is swallowed before destructive toast.
- preview success stores the returned preview payload and opens the preview
  dialog.
- preview failure shows destructive toast field `accounts.io.previewFailed` with
  the thrown error string.
- preview dialog title/description/count/export metadata use
  `accounts.io.previewTitle`, `accounts.io.previewDesc`,
  `accounts.io.previewCount`, and `accounts.io.exportedAt`.
- confirm is disabled when there is no preview, when busy, or when the selected
  count is zero.
- dialog confirm forwards `overwriteExisting` and `Array.from(selectedKeys)`
  to the import mutation; this reducer does not promote the import mutation.

The IPC wrapper statically sends:

```text
previewAccountImport(path) -> invoke("preview_account_import", { filePath: path })
```

## Backend No-Write Selector

IDA MCP current IDB confirms the static no-write selector for the
missing-path fixture:

- blocking command body `0x10032c93c` receives decoded `filePath` bytes, copies
  them, and calls `preview_import` at `0x10032cb40`;
- `preview_import` owner `0x1005dd788` calls `parse_import_file` first at
  `0x1005dd7c4`;
- registry and active-account helper reads occur only after parser success:
  `read_registry_or_empty_keys @ 0x1005e2b64` and
  `read_active_account_key @ 0x1005e29f4`;
- `parse_import_file @ 0x1005e13fc` starts with `metadata(filePath)` at
  `0x1005e142c`, before size guard, file read, JSON decode, kind/schema/count
  validation, registry helper reads, or preview classification.

Therefore the selected missing-path fixture is statically a backend metadata
failure. It is not omitted/null DTO decode, not JSON parse, and not
registry/active-field classification. The static side-effect expectation is
no auth, registry, quota, snooze, temp, or source-file mutation before the
failure boundary.

## Acceptance Mapping

The first runtime acceptance row should assert:

```text
fixture_id = accounts.preview_account_import.missing_path.v1
command = preview_account_import
request = { "filePath": "<disposable>/import/missing.json" }
frontend expected = destructive accounts.io.previewFailed toast, no preview dialog
backend expected = metadata failure before read/json/registry/active-field helpers
side effects expected = no auth/registry/quota/snooze/temp/source mutation
```

This is a fixture design and static selector reducer only. It does not prove
live WKWebView/Tauri IPC reachability, exact runtime request bytes, exact
error/CoreError JSON envelope, runtime toast rendering, before/after bytes, or
PASS/FAIL execution.

## Gate Effect

No promotion.

- `consumerStartReady=9/9` remains Gate 1 static context only.
- `consumerStartBlocked=0/9` remains Gate 1 static context only.
- `strictImplementationUse=false`.
- `readyToImplement=false`.
- `implementation_use=false`.
- `gate_accepted=false`.
- `full_leaf_100=false`.
- `moduleExitAllowed=false`.

Accounts remains the active module.
