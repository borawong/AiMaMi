# Accounts WebDriver Session Probe - AiMaMi 1.0.9

Scope: accounts-only runtime route probe for the current macOS AiMaMi 1.0.9
entrypoint.

Current entrypoint:
`<source-location>/audits/macos-1.0.9-accounts/`

Raw evidence:
`<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-webdriver-session-probe/manifest.json`

Index field:
`aimami/1.0.9/macos/accounts/runtime-webdriver-session-probe`

## Result

This probe closes the narrow gap left by the previous endpoint sweep: it tried
`POST /session` against the observed AiMaMi `TAURI_WEBVIEW_AUTOMATION=1`
listener.

Observed listener:

- `127.0.0.1:25818`

Requests attempted:

- `GET /status`
- `POST /session` with `browserName=Safari`
- `POST /session` with `browserName=safari`
- `POST /session` with empty W3C `alwaysMatch`

All responses were `404` with empty bodies. No WebDriver session was created,
no JavaScript execution was available, no real AiMaMi WebView/Tauri IPC context
was reached, and no accounts command was invoked.

## SOT Binding

The probe used the shared binary SOT:
`<source-location>/source-binary/AiMaMi 1.0.9.app`

Executable SHA256:
`1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`

Executable size: `53618480` bytes.

## Gate Effect

No promotion.

- `webdriver_session_created=false`
- `javascript_eval_available=false`
- `reaches_aimami_tauri_internals=false`
- `accepted_ipc_harness=false`
- `accounts_command_invoked=false`
- `runtime_acceptance_executed=false`
- `strictImplementationUse=false`
- `readyToImplement=false`
- `implementation_use=false`
- `gate_accepted=false`
- `full_leaf_100=false`
- `moduleExitAllowed=false`

Current blocker remains:
`sot_app_present_but_no_accepted_ipc_runtime_harness_or_executed_accounts_acceptance_trace`

## Boundary

WebDriver is allowed only as a candidate transport for proving a real
same-version AiMaMi WebView/Tauri IPC harness. It is not a third-party
implementation substitute for accounts. The relay-only cc-switch substitute
exception does not apply to accounts.

The next accepted accounts proof still requires entry into the real AiMaMi
1.0.9 `window.__TAURI_INTERNALS__.invoke` context, then controlled
`preview_account_import` fixture execution with exact request body, response or
error envelope, no-write bytes, UI or native consumption proof, fixture
PASS/FAIL, and reducer acceptance.
