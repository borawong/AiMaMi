# Accounts switch_account_and_restart_codex Static Strict Boundary 1.0.9

## Scope

This reducer records the current active-route static boundary for
`accounts/switch_account_and_restart_codex` on AiMaMi 1.0.9 macOS.

It uses only:

- frontend packaged extraction already recorded in the raw leaf;
- IDA MCP `server_health`, `decompile`, `xrefs_to`, `callees`,
  `set_comments`, and `idb_save`.

It does not promote any consumer gate. It does not add raw dumps, generated
source, call-tree corpora, run bundles, product-code changes, or main tests.

## Evidence Pointers

- Raw leaf:
  `<source-location>/raw/aimami/1.0.9/macos/accounts/switch_account_and_restart_codex/`
- Raw manifest:
  `<source-location>/raw/aimami/1.0.9/macos/accounts/switch_account_and_restart_codex/manifest.json`
- Existing INDEX field:
  `aimami/1.0.9/macos/accounts/switch_account_and_restart_codex`
- Existing INDEX row:
  `727`
- IDB:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- Source binary SOT:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi`
- Source SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`

## Frontend Boundary

Frontend extraction already records:

- wrapper: `switchAccountAndRestartCodex`;
- command: `switch_account_and_restart_codex`;
- DTO field: `accountKey`;
- IPC contract row: `4`;
- frontend control-flow row: `4`.

Static frontend evidence proves the wrapper and DTO field, but not live WebView
state, exact IPC request/response bytes, loading/toast behavior, or executed
acceptance.

## Threading And Entry Model

Threading was checked before behavior:

- Primary IPC path:
  `Tokio BlockingTask<T>::poll @ 0x10030dd34`
  calls `switch_account_and_restart_sync @ 0x1001e6be4`
  at `0x10030ddfc`.
- The owner therefore performs account switch, rollback, process stop/launch,
  sleep/poll loops, and runtime refresh off the UI thread.
- Alternate tray path:
  tray closure `0x1003326e8` calls the same owner at `0x100332708`.
- Rollback capture:
  `capture_switch_rollback_state @ 0x1001e48d4` uses Tauri
  `StateManager::try_get` and a repository mutex; poisoned lock maps to the
  explicit error string `poisoned lock: another task failed inside`.

IDA `xrefs_to(0x1001e6be4)` returns exactly the primary blocking-task callsite
and the alternate tray closure callsite. This reducer treats the tray path as
same-owner alternate entry, not a separate accounts command.

## Static Owner Order

Owner `switch_account_and_restart_sync @ 0x1001e6be4` has this static order:

1. `capture_switch_rollback_state @ 0x1001e48d4` before switch mutation.
2. `switch_account_sync @ 0x1001e32c4`, which inherits the already recorded
   pure `switch_account` registry/auth/quota behavior.
3. If switch fails:
   - call `FileRestoreState::restore @ 0x1001e2f98` across captured states;
   - call `refresh_full_runtime_snapshot @ 0x1001e6a1c`;
   - return joined error strings.
4. If switch succeeds:
   - call `relaunch_codex_after_success @ 0x1001e4794`.
5. If first relaunch succeeds:
   - call `refresh_full_runtime_snapshot @ 0x1001e6a1c`;
   - if refresh fails, call
     `append_switch_warning @ 0x1001e375c` with
     `RUNTIME_REFRESH_FAILED_AFTER_SWITCH`;
   - return the original `SwitchPayload` with warning appended.
6. If first relaunch fails:
   - append `Codex restart failed: ...`;
   - restore captured file states;
   - retry `relaunch_codex_after_success @ 0x1001e4794`;
   - append `Codex recovery failed: ...` when retry fails;
   - call `refresh_full_runtime_snapshot @ 0x1001e6a1c`;
   - return joined restart/rollback/recovery errors.

## Process Restart Boundary

Helper `relaunch_codex_after_success @ 0x1001e4794` proves:

- `stop_codex_app_gracefully @ 0x100674f50` is called first;
- `launch_codex_app @ 0x1006743ac` is called only after stop succeeds;
- stop or launch failure is formatted as CoreError Display and returned to the
  owner.

Helper `stop_codex_app_gracefully @ 0x100674f50` proves:

- no-op success when the process is already not running;
- graceful quit command path when running;
- 50 ms polling loop after graceful quit;
- `kill_process @ 0x1006740bc` fallback after graceful timeout;
- second 50 ms polling loop after kill fallback;
- persistent process returns
  `CODEX_APP_QUIT_TIMEOUT: Codex did not quit in time; please quit Codex manually and try again`.

Helper `launch_codex_app @ 0x1006743ac` proves:

- `open`-style command attempts by bundle/path fallback;
- metadata checks on candidate app paths;
- 80 ms polling loops waiting for `is_process_running`;
- fallback path using home-dir derived app path;
- final timeout returns `Codex launch timed out`.

## Rollback And Restore Boundary

`capture_switch_rollback_state @ 0x1001e48d4` captures file restore states
before `switch_account_sync` mutates account/auth/registry state. It uses the
repository mutex and records enough file state for restore attempts.

`FileRestoreState::restore @ 0x1001e2f98` proves two terminal side-effect
classes:

- If original content exists, create parent directory and write bytes back with
  `std::fs::write`; create/write errors are formatted and returned.
- If original content is absent, call `remove_file`; missing-file-like errors
  are tolerated as success, while other IO errors are formatted and returned.

Restore is attempted after switch failure and again after relaunch failure.
Restore failure strings are accumulated; they do not erase the original switch
or restart error class.

## Interface And Error Surface

DTO:

```json
{
  "accountKey": "required string"
}
```

Output:

- success uses the same `SwitchPayload` shape as `switch_account`;
- restart-specific warning may be appended after successful switch/relaunch
  when runtime refresh fails;
- hard errors are joined strings assembled from switch failure, rollback
  failure, restart failure, recovery failure, and refresh failure branches.

Known restart-specific strings include:

- `Codex restart failed: ...`
- `Rollback failed: ...`
- `Codex recovery failed: ...`
- `Switched account, but runtime refresh failed: ...`
- `RUNTIME_REFRESH_FAILED_AFTER_SWITCH`
- `CODEX_APP_QUIT_TIMEOUT: Codex did not quit in time; please quit Codex manually and try again`
- `Codex launch timed out`

## Callee/Xref Note

IDA `callees()` returned empty lists for the Rust-mangled owner/helper
functions in the current MCP response. This reducer therefore records terminal
callee proof from Hex-Rays decompile refs and `xrefs_to` callsites, not from a
synthetic call-tree. No generated call-tree corpus is written.

## Six-Dimensional Status

Static macOS backend dimensions narrowed:

- frontend wrapper/DTO row: present;
- backend owner decompile: present;
- threading/process model: present;
- terminal process helpers: present;
- rollback/restore side-effect classes: present;
- IDB comments: written and saved.

Still missing for strict/highest gate:

- exact runtime IPC request/response/error envelope bytes;
- durable before/after bytes for registry/auth/rollback/restore files;
- observed process restart fixture;
- live frontend UI state, toast/loading/disabled/query invalidation behavior;
- executed source archive acceptance mapping;
- independent Windows 1.0.9 closure.

## Gate Effect

```json
{
  "strictImplementationUse": 0,
  "readyToImplement": 0,
  "implementation_use": false,
  "gate_accepted": false,
  "full_leaf_100": false,
  "moduleExitAllowed": false,
  "gateEffect": "static_strict_boundary_narrowed_no_gate_promotion"
}
```
