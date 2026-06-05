# Accounts export_accounts_to_file Static Strict Boundary - AiMaMi 1.0.9

## Scope

This reducer narrows `export_accounts_to_file` toward
`strictImplementationUse` using only active-route evidence:

- backend: IDA MCP against the AiMaMi 1.0.9 IDB
- frontend: packaged frontend extraction

It creates no raw dump, appends no `INDEX.jsonl` row, runs no product code, and
does not promote any gate.

## Evidence

- raw leaf:
  `<source-location>/raw/aimami/1.0.9/macos/accounts/export_accounts_to_file/manifest.json`
- frontend IPC:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ipc-contracts.jsonl:14`
- frontend control flow:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/frontend-control-flow.jsonl:1`
- IDB:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

## Frontend Boundary

Packaged frontend extraction proves:

- wrapper: `exportAccountsToFile`
- command: `export_accounts_to_file`
- arg keys: `targetPath`, `accountKeys`
- arg object: `{ targetPath: t, accountKeys: e ?? null }`
- control-flow owner: `assets/accounts-page-CJFT2P5o.js`
- trigger type: `useMutation.mutationFn`
- semantic i18n field: `accounts.io.saveDialogTitle`

This closes the static IPC DTO entry for the command. It does not prove live
save dialog state, selected-row UX, success/error toast bytes, query state, or
same-run acceptance.

## Threading Boundary

IDA xrefs and decompilation prove:

- Tokio task poll: `0x10014c474`
- poll-to-command callsite: `0x10014source archive6c`
- command body: `0x10032ce58`
- wrapper-to-core callsite: `0x10032d0cc`
- core owner: `0x1005ddd0c`

The command body retrieves Tauri state, locks the repository mutex, copies
`targetPath`, forwards nullable/vector `accountKeys`, maps `CoreError` Display
to `Err<String>`, wraps success through `CoreEnvelope::ok`, and unlocks the
repository mutex on return.

## Static Core Order

IDA analysis of `export_accounts @ 0x1005ddd0c` proves this order:

```text
registry metadata
  -> registry read_to_string
  -> registry JSON decode
  -> optional accountKeys HashSet construction
  -> per-registry-row accountKeys membership
  -> selected auth snapshot load
  -> hostname field source
  -> SystemTime exportedAt source
  -> ExportFile and nested AuthFile serialization
  -> target filename suffix normalization
  -> write_atomic
```

## accountKeys Semantics

Static DTO behavior:

- `accountKeys` omitted/null maps to absent option and exports all registry rows
  with readable auth snapshots.
- `accountKeys` present builds a HashSet at `0x1005de060`.
- Per-registry-row membership at `0x1005de158` skips non-members before
  `load_auth_file` and before export payload inclusion.

This proves the static filter order. It does not prove runtime omitted/null,
empty-array, wrong-type, duplicate-field, or nonexistent-field envelope bytes.

## Export Payload And Filename Boundary

Static field sources:

- registry file supplies account rows;
- `load_auth_file @ 0x1005de3f0` supplies selected auth snapshot data;
- `hostname::get @ 0x1005de818` supplies `exportedHostname` or fallback path;
- `SystemTime::now @ 0x1005de91c` supplies `exportedAt`;
- serializer cluster starting `0x1005deaa4` writes export top-level fields;
- nested auth serializer `0x1005df188` writes account auth payloads;
- serializer end before filename normalization is `0x1005df2b0`;
- filename suffix normalization trims `.aimami-accounts` at `0x1005df3d8`
  before setting the final file name;
- `write_atomic @ 0x1005df458` persists final export JSON bytes.

## Error And Side-Effect Boundary

Pre-write branches:

- missing registry metadata returns a core error before read/decode/filter;
- registry read and decode failures return before snapshot reads and writes;
- filtered-out registry rows do not load auth snapshots and do not enter the
  export payload;
- missing/unreadable selected auth snapshots prevent those accounts from
  entering a successful complete export;
- no-exportable-account state returns before final write;
- serialization failure returns before `write_atomic`.

Write branch:

- target write uses shared `write_atomic`, not a direct ad hoc write.
- write failure maps to `CoreError` and returns through the command wrapper
  error path.
- exact temp/rename bytes and residue remain runtime-only gaps.

## Six-Dimension Status

| Dimension | Status | Evidence |
|---|---|---|
| frontend control-flow + UI/state | static IPC/handler partial | IPC row 14, CCF row 1; live save dialog/toast/query state missing |
| backend owner + body | satisfied static macOS | `0x10014c474 -> 0x10032ce58 -> 0x1005ddd0c` |
| implementation leaves | static boundary strong | registry, filter, auth read, serialization, filename, write leaves identified |
| interface/error/side-effect | partial static | DTO/defaults and branch order known; exact exported bytes and write residue missing |
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

`export_accounts_to_file` is closer to strict because the static frontend DTO,
threading path, owner body, accountKeys filter, export payload field sources,
filename normalization, and atomic write boundary are now separated from
runtime-only gaps. It still cannot enter `strictImplementationUse` because exact
runtime envelope bytes, exported JSON bytes, before/after side-effect bytes,
write-residue fixtures, live UI state, executed acceptance, and Windows
same-version closure are not accepted.
