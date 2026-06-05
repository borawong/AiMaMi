# Accounts Preview Import Registry Path Source Static - AiMaMi 1.0.9

Scope: accounts-only static reducer for the current AiMaMi 1.0.9 macOS
`frontend-relay-diff` bundle.

This reducer creates no raw evidence, appends no `INDEX.jsonl` row, edits no
regulation, edits no product code, runs no product test, executes no runtime
fixture, and promotes no gate.

## Evidence

- IDA source:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- Source executable SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- `preview_import`: `0x1005dd788`
- `CodexPaths::from_home`: `0x100526a40`
- `CodexPaths::clone`: `0x1006169b8`
- `read_registry_or_empty_keys`: `0x1005e2b64`
- `read_active_account_key`: `0x1005e29f4`

## Static Finding

After `parse_import_file` succeeds, `preview_import` clones `CodexPaths` and
passes the same cloned registry path slice into both valid-preview helper
reads:

- `read_registry_or_empty_keys`
- `read_active_account_key`

`CodexPaths::from_home` constructs that path from the accounts directory joined
with `registry.json`. The static assignment places this `accounts/registry.json`
path in the `CodexPaths` field whose owning object offsets are
`216/224/232` in the observed IDA layout.

Both helper bodies use their path arguments for `metadata` and `read_to_string`.
They do not receive the import source file path, auth file path, quota path,
auto-switch snooze path, temporary path, or backup path as their helper path
argument in this valid-preview branch.

The import source `filePath` remains a separate request/path value. It is used
for parser input and for formatting the response payload `filePath`, not as the
registry/active helper path.

This also clarifies the wording in the earlier registry/active reducer: the
active-field helper reads active-account state from the same registry path slice;
this static reducer does not prove a separate active-field file.

## Gate Effect

No promotion. This is static path-source and valid-preview helper-routing proof
only. It does not prove live Tauri IPC, exact success/error transport bytes,
registry before/after bytes, durable no-write bytes, frontend UI-state,
executed acceptance, Windows closure, `strictImplementationUse`,
`readyToImplement`, `implementation_use`, `gate_accepted`, or
`full_leaf_100`.

Accounts remains the active module and `moduleExitAllowed=false`.
