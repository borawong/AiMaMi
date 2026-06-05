# Accounts begin_add_account_attach_monitor IDA Raw Leaf

Raw leaf:
`<source-location>/raw/aimami/1.0.9/macos/accounts/begin_add_account_attach_monitor/`

Canonical INDEX row: `729`.

Manifest SHA-256:
`feca18b23090ba0f6695de19c1d5af1e3348192f1baa69f7583651cfbec2bdce`.

## Threading First

- Frontend wrapper `beginAddAccountAttachMonitor()` invokes `begin_add_account_attach_monitor` with no args.
- Tauri dispatch closure `0x1003187fc` calls per-command wrapper `0x1003250c0`.
- Wrapper extracts `AppHandle` and `StateManager`, then calls owner `0x100262db4`.
- Owner locks repository state, calls `Repository::load_snapshot_local`, unlocks, and starts an OS thread via `std::thread::lifecycle::spawn_unchecked` callsite `0x100263138`.
- Spawn dispatcher `0x100177328` uses vtable `0x1012c10e8` and FnOnce shim `0x100185678`.
- Polling body `0x100529504` sleeps 2 seconds per loop, runs until elapsed exceeds `0x77`, reloads snapshot under repo lock, compares active account field/status, and calls `schedule_full_runtime_refresh @ 0x100262aec` only after detected change.
- Refresh scheduler is debounced/in-flight guarded and schedules Tokio `spawn_blocking`; task poll `0x10030d508` calls `refresh_full_runtime_snapshot @ 0x1001e6a1c`.

## Interface

- Request keys: none.
- Frontend IPC row: `raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/ipc-contracts.jsonl:25`.
- Side effects: starts background monitor thread, reads account snapshot under repo lock, schedules runtime refresh on account/status change.
- Errors: repo lock poison display string, `failed to spawn thread`, StateManager missing panic path in polling body.

## Gate

No promotion:

- `consumerStartReady=unchanged`
- `strictImplementationUse=false`
- `readyToImplement=false`
- `implementation_use=false`
- `gate_accepted=false`
- `full_leaf_100=false`
- `moduleExitAllowed=false`

