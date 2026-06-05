# Accounts import_accounts_from_file Static Strict Boundary - AiMaMi 1.0.9

## Scope

This reducer narrows `import_accounts_from_file` toward
`strictImplementationUse` using only active-route evidence:

- backend: IDA MCP against the AiMaMi 1.0.9 IDB
- frontend: packaged frontend extraction

It creates no raw dump, appends no `INDEX.jsonl` row, runs no product code, and
does not promote any gate.

## Evidence

- raw leaf:
  `<source-location>/raw/aimami/1.0.9/macos/accounts/import_accounts_from_file/manifest.json`
- frontend IPC:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ipc-contracts.jsonl:16`
- frontend control flow:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/frontend-control-flow.jsonl:3`
- IDB:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

## Frontend Boundary

Packaged frontend extraction proves:

- wrapper: `importAccountsFromFile`
- command: `import_accounts_from_file`
- arg keys: `filePath`, `overwriteExisting`, `selectedKeys`
- arg object: `{ filePath: t, overwriteExisting: e, selectedKeys: o ?? null }`
- control-flow owner: `assets/accounts-page-CJFT2P5o.js`
- trigger type: `useMutation.mutationFn`

This closes the static IPC DTO entry for the command. It does not prove live
dialog state, selected-row UX, success/error toast bytes, query invalidation
timing, or same-run acceptance.

## Threading Boundary

IDA xrefs and decompilation prove:

- Tokio task poll: `0x100145658`
- poll-to-command callsite: `0x100145750`
- command body: `0x10032d77c`
- wrapper-to-core callsite: `0x10032d97c`
- core owner: `0x1005dfb6c`

The command body retrieves Tauri state, locks the repository mutex, copies the
frontend `filePath` bytes, reads `overwriteExisting`, forwards the
`selectedKeys` option/vector, maps `CoreError` Display to `Err<String>`, and
unlocks the repository mutex on return.

## Static Core Order

IDA decompilation of `import_accounts @ 0x1005dfb6c` proves this order:

```text
parse_import_file
  -> ensure_directories
  -> selectedKeys HashSet construction when selectedKeys is present
  -> read_registry_or_empty_keys
  -> read_active_account_key
  -> per-entry selectedKeys membership
  -> sensitive-field/field validation
  -> registry conflict + overwriteExisting branch
  -> active-account overwrite guard
  -> make_snapshot_path
  -> make_auth_snapshot
  -> account-field mismatch guard
  -> serde_json::to_vec_pretty
  -> write_atomic
  -> rebuild_registry after at least one write success
```

## SelectedKeys And Overwrite Semantics

Static DTO behavior:

- `selectedKeys` omitted/null maps to absent option and imports every parsed
  entry.
- `selectedKeys` present builds a HashSet.
- Per-entry membership at `0x1005dfe8c` skips non-members before sensitive-field/field
  validation, snapshot creation, serialization, atomic write, or error append.
- Existing registry field plus `overwriteExisting=false` appends
  `CONFLICT_SKIPPED` before snapshot/write.
- Existing registry field plus `overwriteExisting=true` can proceed only if the
  imported account is not the active account.
- Active account match appends `ACTIVE_ACCOUNT_PROTECTED` before
  snapshot/write.

## Error And Side-Effect Boundary

Pre-write branches:

- parser failure returns before directory creation, registry read, active-field
  read, or writes;
- directory ensure failure returns before selectedKeys filtering and writes;
- non-selected entry skips before validation and writes;
- missing sensitive-field appends `ACCOUNT_MISSING_TOKEN` before snapshot/write;
- invalid account field appends `INVALID_ACCOUNT_KEY` before snapshot/write;
- conflict and active-account guards append skipped/error rows before
  snapshot/write;
- snapshot creation, account-field mismatch, and serialization failures append
  per-entry error rows before `write_atomic`.

Write/rebuild branches:

- `write_atomic @ 0x1005e0764` persists an account snapshot.
- write failure appends a per-entry error and does not append the imported field.
- write success appends the imported field.
- `rebuild_registry @ 0x1005e0924` runs only after one or more write successes.
- rebuild failure formats `Rebuild registry failed: ...`.
- no static rollback, delete, or restore call is observed after rebuild
  failure in this owner.

## Six-Dimension Status

| Dimension | Status | Evidence |
|---|---|---|
| frontend control-flow + UI/state | static IPC/handler partial | IPC row 16, CCF row 3; live dialog/toast/query state missing |
| backend owner + body | satisfied static macOS | `0x100145658 -> 0x10032d77c -> 0x1005dfb6c` |
| implementation leaves | static boundary strong | parser, directory, selectedKeys, validation, write, rebuild leaves identified |
| interface/error/side-effect | partial static | DTO/defaults and branch order known; exact envelopes and bytes missing |
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

`import_accounts_from_file` is closer to strict because the static frontend
DTO, threading path, owner body, selectedKeys/overwrite semantics, and
write/rebuild side-effect ordering are now separated from runtime-only gaps.
It still cannot enter `strictImplementationUse` because exact runtime envelope
bytes, before/after side-effect bytes, rollback/no-rollback residue, live UI
state, executed acceptance, and Windows same-version closure are not accepted.
