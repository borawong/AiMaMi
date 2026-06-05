# Accounts Runtime Acceptance Provenance Audit - AiMaMi 1.0.9

Scope: accounts-only provenance audit for the existing
`runtime-acceptance-execution` intermediate bundle.

This reducer consumes existing intermediate evidence only. It creates no raw
bundle, appends no `INDEX.jsonl` row, edits no regulation or skill, runs no
product test, changes no product code, and promotes no gate.

## Evidence Consumed

- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/summary.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/logs/attempts.jsonl`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/logs/attempted-commands.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/targets/accounts-runtime-acceptance-targets.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/logs/preflight/fixture-before-files.txt`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/logs/harness/fixture-after-files.txt`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/logs/harness/http-probes.txt`

## Decision

`runtime-acceptance-execution` must be treated as mixed-provenance diagnostic
history, not as a complete same-run runtime acceptance trace.

The current `manifest.json` and `summary.json` have been refreshed to the SOT
recheck interpretation:

- source app:
  `<source-location>/source-binary/AiMaMi 1.0.9.app`
- source executable SHA256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- status:
  `sot_app_present_runtime_attempted_no_accepted_ipc_harness_no_gate_promotion`
- selected fixture:
  `accounts.preview_account_import.missing_path.v1`
- `runtime_attempted=true`
- `runtime_acceptance_executed=false`
- `accepted_ipc_harness=false`
- `accepted_accounts_command_invoked=false`
- request/success/error/side-effect capture flags are all false

However, child logs still contain older pre-SOT-mount history:

- `logs/attempts.jsonl` records `test -e` and `shasum` failures for
  `<source-location>/source-binary/AiMaMi 1.0.9.app`
  at `2026-05-31T23:54:58+08:00`;
- `logs/attempted-commands.json` and
  `targets/accounts-runtime-acceptance-targets.json` still mark every legacy
  accounts command as
  `blocked_before_invocation_exact_macos_1_0_9_app_unavailable`;
- those command rows are not current SOT-runtime facts after the manifest /
  summary correction.

The fixture file lists also show only harness-side environment effects:

- before: `bootstrap-cache.json`, `plugins.json`, `settings.json`;
- after: the same files plus relay `state.json` and the app single-instance
  lock under the disposable home.

Because no accepted IPC harness reached AiMaMi internals and no accounts
command invocation happened, those before/after lists do not prove
`preview_account_import` no-write behavior. They only prove file observations
around a failed harness attempt.

The HTTP probe log is also non-acceptance evidence. Its entries are malformed
curl URL failures and do not establish a valid external command endpoint.

## Accepted Use

Use this bundle only for these facts:

1. the current SOT app exists and has the expected 1.0.9 executable SHA in
   the refreshed manifest / summary;
2. a process-level runtime attempt was made;
3. no accepted WKWebView/Tauri IPC harness was obtained;
4. no accounts command was invoked;
5. no request body, success envelope, error envelope, or command side-effect
   byte proof was captured.

Do not use this bundle for:

- current binary-missing claims;
- per-command runtime behavior;
- `preview_account_import` missing-path envelope bytes;
- durable no-write proof;
- frontend runtime UI state;
- source archive acceptance;
- Windows closure;
- any strict or highest gate promotion.

## Gate Effect

No promotion.

- `consumerStartReady`: accounts remains `9/9` for Gate 1 static context only.
- `consumerStartBlocked`: accounts remains `0/9` for Gate 1 static context only.
- `strictImplementationUse`: `0/9`.
- `readyToImplement`: `0/9`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

The next valid strict route is still a real same-version AiMaMi 1.0.9
WKWebView/Tauri IPC harness invoking `preview_account_import` with the
`missing_path.v1` fixture, capturing exact request/envelope/error transport
and side-effect bytes.
