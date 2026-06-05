# Accounts Runtime SOT Blocker - AiMaMi 1.0.9 current

Scope: accounts runtime strict blocker under the current macOS 1.0.9 consumer
entrypoint.

Current entrypoint:
`<source-location>/audits/macos-1.0.9-accounts/`

This reducer is logic-only. It consumes existing SOT and raw runtime blocker
evidence, writes no raw evidence, appends no `INDEX.jsonl` row, and does not
promote any gate.

## Decision

The AiMaMi 1.0.9 macOS SOT app is now present:

- SOT app:
  `<source-location>/source-binary/AiMaMi 1.0.9.app`
- executable:
  `<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi`
- SHA256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- size: `53618480`
- bundle version: `1.0.9`

Therefore the current accounts strict blocker is no longer "same-version app
unavailable". The current blocker is:

`sot_app_present_but_no_accepted_ipc_runtime_harness_or_executed_accounts_acceptance_trace`

The historical raw runtime bundle remains non-promoting evidence:

`<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/`

It recorded a stale non-SOT path lookup and never invoked any accounts command.

## Runtime Acceptance Matrix

| target | runtime invocation | request | success envelope | error envelope | side-effect bytes | acceptance |
|---|---|---|---|---|---|---|
| `switch_account` | missing | missing | missing | missing | missing | missing |
| `switch_account_and_restart_codex` | missing | missing | missing | missing | missing | missing |
| `preview_account_import` | missing | missing | missing | missing | missing | missing |
| `import_accounts_from_file` | missing | missing | missing | missing | missing | missing |
| `export_accounts_to_file` | missing | missing | missing | missing | missing | missing |
| `logout` | missing | missing | missing | missing | missing | missing |
| `remove_accounts` | missing | missing | missing | missing | missing | missing |
| `begin_add_account_attach_monitor` | missing | missing | missing | missing | missing | missing |

## Gate Effect

No promotion:

- `strictImplementationUse`: false for accounts
- `readyToImplement`: false for accounts
- `implementation_use`: false
- `gate_accepted`: false
- `full_leaf_100`: false

The SOT app presence only removes the app-location sub-blocker. It does not
prove runtime behavior and must not be used as strict parity evidence.

## 2026-06-01 Runtime IPC Minimal Probe

Additional raw probe:

`stale missing runtime-ipc-minimal-probe artifact; no current manifest; no gate promotion`

This probe launched the same AiMaMi 1.0.9 SOT app under disposable `HOME` and
`CODEX_HOME` with `TAURI_WEBVIEW_AUTOMATION=1`. It observed a listener on
`127.0.0.1:25818`, but root GET, `preview_account_import` GET, and
`preview_account_import` POST all returned `404 Not Found`.

Probe result:

- `reaches_aimami_tauri_internals=false`
- `accounts_command_invoked=false`
- `accepted_ipc_harness=false`
- `runtime_acceptance_executed=false`

Therefore the current blocker remains:

`sot_app_present_but_no_accepted_ipc_runtime_harness_or_executed_accounts_acceptance_trace`

The `TAURI_WEBVIEW_AUTOMATION` string and environment are candidate-only and do
not prove an accepted WebView/Tauri IPC route.

## Required Next Evidence

Accounts can move beyond consumer start only after an accepted same-version
runtime harness executes all 9 current accounts commands from the SOT app under
disposable fixtures and captures:

- request body;
- success and error envelopes;
- durable before/after bytes;
- rollback or no-rollback outcome;
- frontend/user-visible result where applicable;
- source archive acceptance mapping bound to the executed traces.

Windows remains independent and cannot be closed by this macOS SOT check.
