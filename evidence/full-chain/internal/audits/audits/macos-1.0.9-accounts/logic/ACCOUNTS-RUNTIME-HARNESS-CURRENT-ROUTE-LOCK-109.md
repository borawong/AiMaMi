# Accounts Runtime Harness Current Route Lock 1.0.9

## Scope

This reducer is macOS accounts only.

- product: AiMaMi
- version: 1.0.9
- platform: macos-universal
- module: accounts
- reducer: `logic/ACCOUNTS-RUNTIME-HARNESS-CURRENT-ROUTE-LOCK-109.md`

## Accepted Route Shape

The only currently accepted runtime execution route is a same-version trace
inside the real AiMaMi 1.0.9 WKWebView/Tauri JavaScript context, or an
explicitly equivalent same-platform native callback/helper substitute that
captures the same fields.

The trace must prove:

- real AiMaMi SOT app and executable SHA binding;
- reachability of AiMaMi WebView/Tauri internals, not only app launch;
- exact `preview_account_import` command name;
- exact JSON request body for
  `accounts.preview_account_import.missing_path.v1`;
- exact success absence and exact error/CoreError envelope bytes;
- warnings/errors field presence, empty, null, or omitted semantics;
- before/after no-write bytes for auth, registry, quota, temp, and selected
  adjacent state paths;
- visible failure UI state or accepted same-platform callback state;
- `source archive-ACCOUNTS-LANE-C-004` PASS/FAIL;
- fixture-level reducer acceptance boolean.

## Selected First Fixture

`accounts.preview_account_import.missing_path.v1`

```json
{
  "command": "preview_account_import",
  "body": {
    "filePath": "<fixture>/import/missing.json"
  },
  "expected_static_side_effect": "metadata failure before read/json/registry/active/write; no auth/registry/quota/snooze/temp mutation"
}
```

## Rejected As Accepted Proof

These routes remain rejected as strict/full runtime proof:

- app launch alone;
- local listener presence alone;
- localhost GET/POST endpoint sweeps;
- `TAURI_WEBVIEW_AUTOMATION=1` listener probes;
- HTTP 404 or malformed curl history;
- `safaridriver` ready/status/session metadata without AiMaMi WebView command
  invocation;
- WebDriver/CDP `/json/*`, `/status`, or `/session` endpoint probes;
- inspector/menu absence scans;
- AX/JXA WebArea absence scans;
- LLDB attach/start failure;
- static IPC strings, static frontend CCF, or IDA backend closure alone.

## Evidence Pointers

- route decision: `logic/ACCOUNTS-RUNTIME-HARNESS-ROUTE-DECISION-109.md`
- macOS WebView automation limit:
  `logic/ACCOUNTS-MACOS-WKWEBVIEW-AUTOMATION-LIMIT-109.md`
- endpoint sweep: `logic/ACCOUNTS-RUNTIME-ENDPOINT-SWEEP-109.md`
- WebDriver session probe: `logic/ACCOUNTS-WEBDRIVER-SESSION-PROBE-109.md`
- inspector route probe: `logic/ACCOUNTS-WEBVIEW-INSPECTOR-ROUTE-PROBE-109.md`
- LLDB route probe: `logic/ACCOUNTS-LLDB-WEBVIEW-ROUTE-PROBE-109.md`
- static IPC surface audit: `logic/ACCOUNTS-WEBVIEW-IPC-SURFACE-AUDIT-109.md`
- static Tauri transport audit:
  `logic/ACCOUNTS-TAURI-IPC-TRANSPORT-STATIC-AUDIT-109.md`

## Gate Effect

No runtime trace was accepted in this reducer.

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
