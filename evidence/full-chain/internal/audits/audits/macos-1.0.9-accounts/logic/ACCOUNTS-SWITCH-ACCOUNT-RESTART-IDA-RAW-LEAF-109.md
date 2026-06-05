# Accounts Switch Account Restart IDA Raw Leaf 1.0.9

## Result

Raw leaf:
`<source-location>/raw/aimami/1.0.9/macos/accounts/switch_account_and_restart_codex/`

Status: `accepted_static_ida_raw_leaf_no_gate_promotion`.

This reducer is a lightweight pointer to the clean raw leaf. It does not carry
backend pseudocode dumps, callgraph dumps, `.c` files, Ghidra output, rizin
output, or runtime scratch.

## Threading Model

Threading was analyzed before implementation semantics:

- Frontend IPC path runs through `Tokio BlockingTask<T>::poll @ 0x10030dd34`
  and calls `switch_account_and_restart_sync @ 0x1001e6be4` at
  `0x10030ddfc`.
- The blocking task is polled by Tokio runtime core poll `0x10014bdb4`.
- Alternate tray closure `0x1003326e8` calls the same owner at `0x100332708`
  and is polled by Tokio runtime core poll `0x10014a110`.
- Rollback capture uses repository state through `StateManager::try_get` plus
  a mutex lock; poisoned lock maps to `poisoned lock: another task failed inside`.
- Process stop/kill/launch and sleep/poll loops run inside the blocking owner
  path, not on the UI thread.

## Static Behavior

Owner `switch_account_and_restart_sync @ 0x1001e6be4`:

1. captures rollback file state before mutation,
2. calls `switch_account_sync @ 0x1001e32c4`,
3. restores captured files and refreshes runtime snapshot on switch failure,
4. relaunches Codex on switch success,
5. restores and retries relaunch on restart failure,
6. refreshes runtime snapshot after success or recovery,
7. appends `RUNTIME_REFRESH_FAILED_AFTER_SWITCH` when post-success refresh fails.

Terminal helpers:

- rollback capture `0x1001e48d4`
- restore `0x1001e2f98`
- restart orchestration `0x1001e4794`
- stop process `0x100674f50`
- launch process `0x1006743ac`
- runtime refresh `0x1001e6a1c`
- warning append `0x1001e375c`

## Interface And Side Effects

- Frontend wrapper: `switchAccountAndRestartCodex`.
- Command: `switch_account_and_restart_codex`.
- Args: `{ accountKey }`.
- Success: `SwitchPayload`.
- Side effects: pure switch registry/auth/quota mutation, rollback snapshot and
  restore/remove/write, Codex process stop/kill/launch, sleep/poll loops,
  runtime snapshot broadcast, tray refresh on tray error.

## Gate Effect

No promotion:

- `strictImplementationUse=false`
- `readyToImplement=false`
- `implementation_use=false`
- `gate_accepted=false`
- `full_leaf_100=false`
- `moduleExitAllowed=false`

Missing strict/highest dimensions remain runtime IPC bytes, exact envelopes,
durable side-effect and rollback/recovery fixtures, observed restart,
executed acceptance mapping, and independent Windows closure.
