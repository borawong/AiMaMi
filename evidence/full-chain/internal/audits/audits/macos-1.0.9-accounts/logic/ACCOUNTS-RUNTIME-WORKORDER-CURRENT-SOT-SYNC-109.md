# Accounts Runtime Workorder Current SOT Sync 1.0.9

## Scope

This reducer is macOS accounts only.

- product: AiMaMi
- version: 1.0.9
- platform: macos-universal
- module: accounts
- reducer: `logic/ACCOUNTS-RUNTIME-WORKORDER-CURRENT-SOT-SYNC-109.md`

## Change

The runtime acceptance workorder has been synchronized to the current accounts
reducer:

`logic/ACCOUNTS-RUNTIME-SOT-PRESENT-MACOS-CORRECTION-109.md`

This replaces stale workorder bindings that still treated
`logic/ACCOUNTS-IDB-WRITEBACK-CURRENT-SYNC-109.md` as the current accounts
reducer. IDB writeback remains valid as the closed backend/static evidence
component, but future runtime traces must bind to the runtime SOT correction as
the current reducer.

## Selected First Runtime Fixture

The selected first low-risk fixture is:

`accounts.preview_account_import.missing_path.v1`

Rationale:

- command: `preview_account_import`
- request body: `{ "filePath": "<fixture>/import/missing.json" }`
- expected static shape: metadata failure before read/json/registry/active/write
- expected side effect: no auth/registry/quota/snooze/temp mutation
- source archive acceptance id: `source archive-ACCOUNTS-LANE-C-004`

This fixture is not executed yet. It is selected because it is the smallest
same-platform no-write lane that can prove real AiMaMi WKWebView/Tauri IPC
reachability, exact request body, exact error/CoreError envelope, UI failure
mapping, and no-write bytes without mutating account state.

## Updated Workorder Files

- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/summary.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/proof-criteria.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/targets/accounts-runtime-acceptance-targets.jsonl`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/targets/accounts-lane-c-preview-import-export-fixture-rows.jsonl`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/targets/switch-account-strict-full-leaf-fixture-rows.jsonl`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/file-manifest.json`

## Gate Effect

This is a workorder synchronization and fixture selection reducer only.
No runtime trace has been accepted.

```json
{
  "runtime_acceptance_executed": false,
  "accepted_ipc_harness": false,
  "accounts_commands_invoked": false,
  "strictImplementationUse": false,
  "readyToImplement": false,
  "implementation_use": false,
  "gate_accepted": false,
  "full_leaf_100": false,
  "moduleExitAllowed": false
}
```

Accounts remains the active module.
