# Accounts Export Accounts Write Atomic Helper Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
`export_accounts_to_file` handoff into the shared
`relay::atomic_write::write_atomic` helper.

This reducer consumes existing static evidence and IDA HTTP MCP output only. It
creates no raw bundle, appends no `INDEX.jsonl` row, edits no regulation or
skill, changes no product code, runs no product/main test, and promotes no
gate.

## Evidence

- SOT binary root:
  `<source-location>/source-binary/`
- IDA input:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- Source binary SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Existing export reducer:
  `logic/ACCOUNTS-EXPORT-ACCOUNTS-ACCOUNTKEYS-WRITE-STATIC-109.md`
- Existing shared static crosscheck:
  `logic/ACCOUNTS-WRITE-ATOMIC-REBUILD-IDACROSSCHECK-109.md`
- Existing intermediate pseudocode:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/0009_relay_atomic_write_write_atomic_4ce6e7c3.c`
- IDA HTTP MCP decompile of
  `codexmate_lib::core::relay::atomic_write::write_atomic` at `0x1006729f8`.

## Non-Duplicate Boundary

`logic/ACCOUNTS-EXPORT-ACCOUNTS-ACCOUNTKEYS-WRITE-STATIC-109.md` already proves
that `export_accounts_to_file` normalizes the target path and calls
`write_atomic`; it does not independently reduce the helper's internal
filesystem sequence.

`logic/ACCOUNTS-WRITE-ATOMIC-REBUILD-IDACROSSCHECK-109.md` records the shared
helper at a cross-check level for import/export/rebuild fixture design. This
reducer narrows only the export-facing consumer boundary for the helper's
static ordering and cleanup semantics.

## Static Helper Order

IDA HTTP MCP confirms the helper at `0x1006729f8` follows this static order:

```text
Path::parent(target)
  -> if missing parent, return io error "atomic write: missing parent"
  -> DirBuilder::_create(parent)
  -> Path::file_name(target)
  -> build temp file name from target file name, process id, and UUID
  -> parent.join(temp file name)
  -> OpenOptions::_open(temp)
  -> Write::write_all(temp, bytes)
  -> File::sync_data(temp)
  -> close(temp)
  -> std::sys::fs::rename(temp, target)
  -> on rename success: sync_parent_dir(parent), return ok
  -> on rename failure: remove_file(temp), return rename error
```

The static temporary file name is formatted from the target basename, current
process id, and a UUID. If `Path::file_name` is absent or not UTF-8, the helper
uses its fallback basename component before formatting the temp path.

Open, write, and sync failures close the temp file before returning the error.
Rename failure attempts temp cleanup through `std::sys::fs::remove_file` before
returning the rename error. Cleanup failure is dropped as an internal
best-effort detail.

## Export-Specific Meaning

For `export_accounts_to_file`, the static write sequence is:

```text
export_accounts builds export JSON bytes
  -> target filename is normalized to .aimami-accounts.json when needed
  -> write_atomic creates parent directory if missing
  -> write_atomic writes bytes to a temp file under the same parent
  -> write_atomic fsyncs the temp file
  -> write_atomic renames temp to target
  -> write_atomic syncs the parent directory after rename success
```

This proves only helper ordering and cleanup branches. It does not prove exact
export JSON bytes, target overwrite behavior under a live filesystem fixture,
the exact CoreError/Tauri IPC envelope for open/write/sync/rename failure,
or the final temp/target before-after bytes.

## Still Missing Before Strict

- exact runtime IPC request/response/error envelope bytes;
- direct runtime matrix for `targetPath` and `accountKeys` omitted/null/wrong
  type/empty/duplicate/unknown-field cases;
- exact export JSON bytes, field order, escaping, timestamp, hostname, and
  optional/null account field mapping;
- target overwrite and write failure before/after filesystem bytes;
- temp file residue for open/write/sync/rename/remove cleanup failures;
- frontend runtime close/toast/loading/query-invalidation state;
- executed source archive acceptance mapping;
- independent platform closure.

## Gate Effect

No promotion.

- `consumerStartReady`: unchanged Gate 1 static context only.
- `strictImplementationUse=false`.
- `readyToImplement=false`.
- `implementation_use=false`.
- `gate_accepted=false`.
- `full_leaf_100=false`.
- `moduleExitAllowed=false`.

Accounts remains the active locked module. This reducer does not permit
switching to plugins, relay, system, or tray.
