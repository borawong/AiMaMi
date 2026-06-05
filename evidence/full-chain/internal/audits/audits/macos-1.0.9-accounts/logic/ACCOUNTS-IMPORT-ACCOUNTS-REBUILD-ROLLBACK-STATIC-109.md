# Accounts Import Accounts Rebuild Rollback Static Reducer - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
`import_accounts_from_file` terminal branch after one or more snapshot writes
have succeeded and `Repository::rebuild_registry` fails.

This reducer creates no raw/intermediate artifact, appends no `INDEX.jsonl`
row, edits no rule/spec file, edits no product code, runs no product test, and
promotes no gate.

## Evidence

- Binary SOT root:
  `<source-location>/source-binary/`
- SOT universal SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- IDA database:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- IDA owner:
  `0x1005dfb6c`
  `codexmate_lib::core::account_io::import_accounts`
- IDA rebuild failure string:
  `0x100eaefd8`
  `Rebuild registry failed: `
- Accepted Ghidra pseudocode:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/backend-owner-pseudocode-calltree/run-bundle/ghidra/pseudocode/0004_import_accounts_from_file_ddb23d82.c`
- Accepted call tree:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/backend-owner-pseudocode-calltree/run-bundle/call-trees/import_accounts_from_file.jsonl`
- IDB writeback:
  comments added at `0x1005dfb6c` and `0x100eaefd8`; `idb_save` returned OK.

## Static Terminal Branch

Existing reducers already cover `selectedKeys`, `overwriteExisting`,
validation, conflict skips, snapshot creation, JSON serialization,
`write_atomic`, skipped payload serialization, frontend toast branches, and
`quota-history` invalidation. This reducer only narrows the rebuild-failure
terminal after successful writes.

Static order from the accepted pseudocode and IDA cross-check:

```text
per-entry loop
  -> serde_json::ser::to_vec_pretty
  -> relay::atomic_write::write_atomic(snapshot)
  -> on write success: append account field to imported vector
after loop
  -> Repository::rebuild_registry
  -> if rebuild fails:
       format "Rebuild registry failed: <CoreError>"
       return CoreError / error-shaped result
       drop local vectors and temporaries
```

The rebuild-failure branch does not show a static call to delete the just-written
snapshot, restore the previous registry, restore auth bytes, or otherwise roll
back the successful `write_atomic` side effect. The visible static cleanup after
the formatted CoreError is local allocation/vector cleanup, not filesystem
rollback.

## Implementation Reading Boundary

For implementation planning, the safe static reading is:

```text
write_atomic success before rebuild_registry
rebuild_registry failure returns "Rebuild registry failed: ..."
static rollback/delete/restore call is not observed in this owner branch
```

This is still not runtime proof of exact residue bytes. It narrows the static
branch from "unknown rollback/no-rollback shape" to "no rollback call observed
in same-version static owner"; strict implementation still needs a live fixture
to prove the actual filesystem state after rebuild failure.

## Still Missing Before Strict

- exact Tauri IPC request/response/error envelope bytes;
- direct IPC omitted/null/wrong-type behavior for `filePath`,
  `overwriteExisting`, and `selectedKeys`;
- runtime matrix for `selectedKeys` and `overwriteExisting`;
- exact success, skipped, write failure, and rebuild failure envelopes;
- before/after auth, registry, quota, temp, and snapshot bytes;
- live rebuild-failure residue fixture proving actual rollback/no-rollback bytes;
- frontend runtime dialog/toast/loading/query-invalidation state;
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
