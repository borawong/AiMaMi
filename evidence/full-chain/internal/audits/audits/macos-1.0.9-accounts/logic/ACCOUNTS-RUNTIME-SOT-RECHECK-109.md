# Accounts Runtime SOT Recheck - AiMaMi 1.0.9

Scope: accounts 9 rows, current macOS 1.0.9 runtime strict blocker.

This reducer started as a current disk-evidence correction and was later
updated with a separate accounts-only SOT feasibility probe. The probe did run
the SOT app under disposable `HOME` / `CODEX_HOME`, wrote raw evidence, and
appended canonical `INDEX.jsonl`; it still did not reach an accepted IPC
harness or invoke any accounts command.

It is now also updated with the fixed `runtime-acceptance-execution` recheck.
That recheck used the current binary SOT path directly, launched the app under
disposable `HOME` / `CODEX_HOME`, observed the same local listener class, and
still did not obtain an accepted WKWebView/Tauri IPC execution context or
invoke any accounts command.

## Decision

The old `runtime-acceptance-execution` raw bundle remains valid as history for
the run it records, but its "exact same-version app unavailable" blocker is
stale for current planning.

Current SOT state:

- Binary SOT:
  `<source-location>/source-binary/AiMaMi 1.0.9.app`
- Executable:
  `<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi`
- Executable SHA256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Executable size: `53618480`
- `CFBundleShortVersionString`: `1.0.9`

Current blocker:

`sot_app_present_runtime_attempted_no_accepted_ipc_harness_no_gate_promotion`

That blocker replaces the current planning interpretation of:

`blocked_exact_same_version_app_unavailable_no_gate_promotion`

for current planning. It supersedes the stale app-unavailable interpretation
from:

`<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/`

Current fixed execution recheck:

`<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/manifest.json`

Recheck facts:

- `source_binary_sha256=1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- `runtime_attempted=true`
- `accepted_ipc_harness=false`
- `accepted_accounts_command_invoked=false`
- `runtime_acceptance_executed=false`
- selected fixture: `accounts.preview_account_import.missing_path.v1`
- listener observed: `25818`
- request body captured: false
- success envelope captured: false
- error envelope captured: false
- side-effect before/after bytes captured: false

## Current SOT Feasibility Probe

Current raw bundle:

`<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-harness-sot-feasibility/manifest.json`

The probe verified the 1.0.9 SOT app and executable SHA256, launched AiMaMi
under disposable environment paths, and observed one listener on
`127.0.0.1:25819`. `safaridriver /status` responded, but `POST /session` failed
with `session not created` before reaching the Tauri webview.

Runtime acceptance result:

- `source_binary_verified_locally=true`
- `app_launch_attempted=true`
- `listener_lines_count=1`
- `accepted_ipc_harness=false`
- `accounts_commands_invoked=false`
- `request_response_envelopes_captured=false`
- `side_effect_bytes_captured=false`
- `runtime_acceptance_executed=false`

This removes no strict blocker except confirming that the binary SOT path is
usable and the app can launch. It does not prove command behavior.

## Raw Runtime Bundle Status

The fixed raw runtime bundle still records no executed command behavior:

- `runtime_attempted=true`
- `runtime_acceptance_executed=false`
- request body captured: false for the selected fixture
- success envelope captured: false for the selected fixture
- error envelope captured: false for the selected fixture
- side-effect before/after bytes captured: false for the selected fixture

The raw bundle should now be read as a current failed runtime harness attempt:
the SOT app is present, but no accepted IPC harness or account command
execution was obtained. It must not be used to claim the SOT app is missing
now, and it must not be edited into promotion evidence.

## Accounts Gate Effect

No promotion:

- `consumerStartReady`: 9/9 at Gate 1; `import_chatgpt_session_account` remains strict/highest blocked.
- `strictImplementationUse`: 0
- `readyToImplement`: 0
- `implementation_use`: false
- `gate_accepted`: false
- `full_leaf_100`: false

## Strict Runtime Evidence Still Missing

The SOT app being present only removes the app-location sub-blocker. It does
not close any strict/highest runtime dimension.

Still missing for all 9 current accounts leaves:

- accepted same-version macOS IPC/WebView/Tauri harness reaching AiMaMi
  internals;
- executed invocation of each accounts command under disposable fixtures;
- exact request body for each command;
- success response envelope and payload;
- error envelope and user-visible failure mapping;
- durable before/after bytes for registry/auth/quota writes;
- rollback or no-rollback fixtures for failure cases;
- source archive unit/E2E/manual acceptance mapping bound to executed traces.

## Next Valid Action

An accepted runtime harness is required to close the runtime/acceptance
dimension before strict/highest promotion. The next runtime producer step is to
run AiMaMi 1.0.9 from the SOT app under disposable `HOME` / `CODEX_HOME`, reach
Tauri IPC/WebView internals, invoke at least the selected
`preview_account_import` missing-path fixture first, then close the remaining
preview fixtures and all 9 current accounts rows. The reducer must include
request/envelope/error/side-effect/acceptance fixtures before any strict or
highest promotion, while other non-runtime strict/highest evidence dimensions
can continue independently.

Until that happens, accounts stays consumer-start only.
