# Accounts remove_accounts IDA clean raw leaf - 1.0.9 macOS

Status: accepted static IDA raw leaf, no gate promotion.

Raw leaf:
`<source-location>/raw/aimami/1.0.9/macos/accounts/remove_accounts/`

Manifest:
`<source-location>/raw/aimami/1.0.9/macos/accounts/remove_accounts/manifest.json`

Manifest SHA-256:
`315c379190e90d305964649d2047fd57fe382be68867c4438fcc18a26c6fc0c8`

## Threading Model

Frontend wrapper `removeAccounts(accountKeys)` invokes Tauri command
`remove_accounts`. IDA xrefs bind the command body `0x100330a08` to Tokio
blocking task poll `0x100145060`, callsite `0x10014514c`.

The command body obtains Tauri state, locks the repository mutex, passes the
decoded `accountKeys` vector, calls `Repository::remove_accounts @ 0x1005e4850`,
maps `CoreError` display to `Err<String>`, unlocks, and drops `AppHandle`.

## Static Owner Chain

- `0x100145060` Tokio blocking task poll entry
- `0x100330a08` Tauri blocking command body
- `0x1005e4850` `codexmate_lib::core::repository::Repository::remove_accounts`
- `0x1005e2e80` registry load
- `0x1005e49a8` active-account guard
- `0x1005e4adc` snapshot metadata
- `0x1005e4af8` snapshot file remove
- `0x1005e4cf4` registry persist
- `0x1005e4d60` quota save
- `0x1005e4d80` / `0x1005e4da4` snooze clears
- `0x1005e4e30` success envelope

## Accepted Branches

- Missing local registry returns before delete, registry persist, quota, and
  snooze side effects.
- Requested active account returns conflict before delete, registry persist,
  quota, and snooze side effects.
- Non-active removals check snapshot metadata, attempt delete only for existing
  snapshot paths, retain registry and quota rows, persist registry, save quota
  when changed, clear snooze state, and return success.
- Snapshot delete failure is non-fatal in static flow. Exact residue and
  response bytes remain runtime fixture requirements.

## Cleanup

Legacy generated traversal JSON was moved to:
`<source-location>/intermediate/aimami/1.0.9/macos/accounts/remove_accounts/legacy-traversal-json-from-raw/traversal-json/`

Raw leaf now contains only the current leaf template files.

## INDEX

The global INDEX already has exact-field row 687 for
`aimami/1.0.9/macos/accounts/remove_accounts`. This cleanup did not append a
duplicate row. The raw manifest records the existing row and the no-append
decision.

## Gate

No promotion:
- `consumerStartReady`: unchanged false at module level
- `strictImplementationUse`: false
- `readyToImplement`: false
- `implementation_use`: false
- `gate_accepted`: false
- `full_leaf_100`: false
- `moduleExitAllowed`: false
