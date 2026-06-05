# Accounts Runtime Workorder Current Entrypoint Sync - AiMaMi 1.0.9

Produced: 2026-06-02T20:52:00+08:00

Scope: accounts-only current entrypoint sync for the existing runtime
acceptance workorder. This reducer does not execute runtime, does not launch
the app, does not append `INDEX.jsonl`, does not write raw evidence, and does
not promote any gate.

## Evidence Consumed

Research lane conclusions consumed:

- Runtime route research concluded that app launch, localhost listener,
  WebDriver/Safari readiness, LLDB failures, static strings, and UI clicks do
  not prove accepted AiMaMi WKWebView/Tauri IPC reachability.
- Static readiness research selected
  `accounts.preview_account_import.missing_path.v1` because same-version
  frontend wrapper and IDA owner/parser facts indicate a low-risk no-write
  first fixture, while runtime IPC/envelope/bytes/UI acceptance remain missing.
- Queue research concluded the accounts lane must not expand beyond the first
  preview missing-path runtime proof until a same-version accepted trace is
  reduced.

Existing reducers consumed:

- `logic/ACCOUNTS-NEXT-STRICT-PROOF-QUEUE-109.md`
- `logic/ACCOUNTS-PREVIEW-IMPORT-MISSING-PATH-RUNTIME-READINESS-STATIC-109.md`
- `logic/ACCOUNTS-RUNTIME-HARNESS-ROUTE-DECISION-109.md`

Workorder inputs consumed:

- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/targets/accounts-runtime-acceptance-targets.jsonl`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/targets/accounts-lane-c-preview-import-export-fixture-rows.jsonl`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/targets/switch-account-strict-full-leaf-fixture-rows.jsonl`

## Decision

- Correct current entrypoint:
  `<source-location>/audits/macos-1.0.9-accounts/`
- Correct current accounts reducer for this workorder sync:
  `<source-location>/audits/macos-1.0.9-accounts/logic/ACCOUNTS-RUNTIME-WORKORDER-CURRENT-ENTRYPOINT-SYNC-109.md`
- First runtime proof remains
  `accounts.preview_account_import.missing_path.v1`.
- No non-repeating static reducer remains after this sync; the remaining
  blocker is accepted runtime IPC/envelope/side-effect/UI/acceptance evidence.
- Workorder pointers must resolve to the current audit root and this sync
  reducer when they identify the current entrypoint, current accounts reducer,
  latest accounts reducer, or required reducer output.

## Changed And Synced Fields

Synced fields:

- `current_entrypoint`
- `current_accounts_reducer`
- `currentAccountsReducer` where present or useful for row consumers
- `latestAccountsReducer` where present or useful for row consumers
- `latestReducer` / `latest` in accounts audit metadata
- `accountsRuntimeWorkorderCurrentEntrypointSync`
- `accountsLogicReducers`
- `outputs` in `data/task-plan.json`

Execution and gate booleans stay false:

- `runtime_acceptance_executed=false`
- `accepted_ipc_harness=false`
- `accounts_commands_invoked=false`
- `reducer_acceptance=false`
- `reducer_acceptance_boolean=false`
- `strictImplementationUse=false`
- `readyToImplement=false`
- `implementation_use=false`
- `gate_accepted=false`
- `full_leaf_100=false`
- `moduleExitAllowed=false`

## Rejected And Non-actions

- No app launch.
- No runtime probe.
- No accepted IPC harness claim.
- No accounts command invocation.
- No raw write.
- No `INDEX.jsonl` append.
- `moduleExitAllowed=false` until the required macOS accounts gate closes.
- No product repo source edit.
- No `implementation_use` promotion.
- No historical Ghidra/pseudocode cleanup.

## No-promotion JSON

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

## Gate Effect

No promotion. Accounts remains active. The next accepted proof is still the
same-version runtime trace for
`accounts.preview_account_import.missing_path.v1`.
