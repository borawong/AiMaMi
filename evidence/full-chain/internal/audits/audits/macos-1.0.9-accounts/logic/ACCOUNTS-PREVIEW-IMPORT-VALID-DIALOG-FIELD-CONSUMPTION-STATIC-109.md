# Accounts Preview Import Valid Dialog Field Consumption Static - AiMaMi 1.0.9

Scope: accounts-only same-version static reducer for the valid
`preview_account_import` dialog field consumption path. It links the backend
success payload fields to the bundled accounts page preview dialog, confirm
guard, confirm import mutation, close/reset behavior, import toast branches,
and query invalidation.

This reducer writes no raw evidence, appends no `INDEX.jsonl` row, edits no
regulation/spec/skill file, runs no product/main test, and promotes no gate.

## Evidence

- Frontend asset:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/accounts-page-CJFT2P5o.js`
- IPC wrapper asset:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/index-CL22l5v8.js`
- IDA database:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- Binary SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- IDA MCP evidence:
  `AccountImportPreviewPayload::serialize @ 0x1001d6e34`,
  `AccountImportPreviewEntry::serialize @ 0x1001d6source archive0`,
  `preview_import @ 0x1005dd788`, and command-body callsite
  `0x10032cb40`.
- IDB writeback: comments were added to `0x1001d6e34`, `0x1001d6source archive0`,
  and `0x1005dd788`; `idb_save` returned OK.

## Frontend Trigger And Preview State

The import button in the accounts IO control calls the preview mutation:

```text
Import button onClick -> N.mutate()
disabled = N.isPending || importAccountsFromFile.isPending
aria-busy = disabled
```

The preview mutation opens the native JSON picker with:

```text
title = accounts.io.openDialogTitle
multiple = false
directory = false
filters = AiMaMi Accounts Backup / json
```

If the picker returns no string path, the frontend throws `CANCELLED`; that
case is swallowed and no destructive preview toast is shown. If a string path
is returned, the wrapper sends:

```text
previewAccountImport(path) -> invoke("preview_account_import", { filePath: path })
```

On preview success the page stores the returned `data` payload and opens the
preview dialog:

```text
setPreview(payload)
setPreviewDialogOpen(true)
```

On preview failure other than `CANCELLED`, the page shows destructive toast
`accounts.io.previewFailed` with the thrown error string.

## Backend Payload To Dialog Field Crosswalk

Current IDB decompilation confirms the `preview_account_import` success payload
serializes these fields. The right column records the current bundled dialog
consumption, including fields serialized but not rendered by this branch.

| Payload field | Backend static source | Frontend consumption |
|---|---|---|
| `filePath` | payload serializer `0x1001d6e34`, field `0x100edf523`; built by `preview_import @ 0x1005dd788` from the selected path display | not displayed as dialog metadata; forwarded on confirm as `filePath` to `import_accounts_from_file` |
| `schemaVersion` | field `0x100edee45`, payload offset `128` | serialized but not directly rendered in the valid preview dialog |
| `kind` | field `0x100ee0f7f`, payload offset `24` | serialized but not directly rendered in the valid preview dialog |
| `appVersion` | field `0x100ee0f83`, payload offset `48` | rendered as `v${appVersion}` when truthy |
| `exportedAt` | field `0x100edf4f8`, payload offset `120` | converted with 
ew Date(exportedAt * 1000).toLocaleString()` and rendered via `accounts.io.exportedAt` when present |
| `exportedHostname` | field `0x100ee0f8d`, payload offset `96` | rendered as truncated text with `title=exportedHostname` when present |
| `accountCount` | field `0x100ee0a66`, payload offset `132` | rendered through `accounts.io.previewCount` and used as the select-all counter denominator |
| 
ewCount` | field `0x100ee0f9d`, payload offset `136`; computed by scanning inverse conflict bytes | serialized but not directly rendered in the current dialog branch |
| `conflictCount` | field `0x100ee0fa5`, payload offset `140`; computed by scanning conflict bytes | used in `accounts.io.overwriteLabel` when selected conflicting non-active rows exist |
| `entries` | array items use `AccountImportPreviewEntry::serialize @ 0x1001d6source archive0` | drives list rows, selected-field set, active-local lockout, conflict status, select-all, and confirm enablement |

Entry field consumption:

| Entry field | Backend static source | Frontend consumption |
|---|---|---|
| `accountKey` | field `0x100edee6e` | React row field, selected-field set member, select-all member, and confirm `selectedKeys` item |
| `email` | field `0x100ee0904` | primary row label |
| `plan` | field `0x100edef33` | serialized but not rendered in this preview dialog branch |
| `authMode` | field `0x100ee0931` | serialized but not rendered in this preview dialog branch |
| `workspaceName` | field `0x100ee0919` | secondary row text when present |
| `profileName` | field `0x100ee0926` | secondary row text; rendered before workspace when both exist |
| `conflict` | field `0x100ee0f68` | controls `statusOverwrite` vs `statusNew` for selected non-active rows and exposes overwrite checkbox when selected conflicts exist |
| `isActiveLocally` | field `0x100ee0f70` | disables row checkbox, shows `activeLocally`, and excludes the row from default selection/select-all |

## Dialog Guard, Selection, And Confirm

Opening the dialog recomputes default selected keys from:

```text
entries.filter(!isActiveLocally && !conflict).map(accountKey)
```

Busy state blocks dialog open-state changes and row mutation. Closing the
dialog resets:

```text
overwriteExisting = false
selectedKeys = new Set()
```

The select-all set includes non-active entries, including conflict rows:

```text
entries.filter(!isActiveLocally).map(accountKey)
```

The row checkbox is disabled for active-local rows. The confirm button is
disabled when:

```text
busy || !preview || selectedKeys.size <= 0
```

Confirm forwards:

```text
onConfirm(overwriteExisting, Array.from(selectedKeys))
  -> importAccountsFromFile(preview.filePath,
                            overwriteExisting,
                            selectedKeys)
  -> invoke("import_accounts_from_file", ...)
```

This reducer only records the frontend valid-dialog import handoff. It does not
promote the import mutation's backend write semantics.

## Import Result Consumption

After confirm, `import_accounts_from_file` success closes the preview dialog,
clears the stored preview payload, and invalidates quota history:

```text
setPreviewDialogOpen(false)
setPreview(null)
invalidateQueries({ queryKey: ["quota-history"] })
```

The import success toast branches are:

| Import result condition | Toast branch |
|---|---|
| `importedCount <= 0` | warning `accounts.io.importNothingTitle`; description from skipped reasons |
| `importedCount > 0` and no skipped rows | success `accounts.io.importSuccess`; description `accounts.io.importSuccessDesc` |
| `importedCount > 0` and skipped rows exist | warning `accounts.io.importSuccess`; description `accounts.io.importSuccessDescPartial` |

Import failure shows destructive toast `accounts.io.importFailed` with the
thrown error string.

## Static Acceptance Mapping

Valid-preview static fixture rows should assert:

| Fixture shape | Expected static UI / mutation result |
|---|---|
| one non-active non-conflict entry | row selected by default; confirm sends that `accountKey`; no overwrite checkbox |
| one non-active conflict entry | row not selected by default; selecting it exposes overwrite checkbox and status overwrite |
| one active-local entry | checkbox disabled; row excluded from default and select-all; active-local badge shown |
| zero selectable rows | confirm disabled and label uses `accounts.io.nothingToImport` |
| successful import after confirm | preview dialog closes, stored preview clears, `["quota-history"]` invalidates, toast branch follows `importedCount/skipped` |

These are static fixture expectations only. Runtime proof still needs live
WKWebView/Tauri IPC request/response bytes, rendered dialog/toast state,
before/after filesystem bytes, executed acceptance, and independent Windows
closure.

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
