# Accounts Runtime Trace Preview Import Missing Path - AiMaMi 1.0.9

Scope: accounts-only AiMaMi 1.0.9 macOS `preview_account_import` selected
fixture.

This reducer consumes a failed intermediate harness trial only. It creates no
raw evidence, appends no `INDEX.jsonl` row, edits no rule/spec/skill file,
runs no product or main test, touches no other-platform host, and does not switch
modules.

## Trial Consumed

- Trial manifest:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/preview_account_import/trials/manifest.json`
- Trial summary:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/preview_account_import/trials/summary.json`
- Trial log:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/preview_account_import/trials/logs/lldb-start.txt`
- Fixture id:
  `accounts.preview_account_import.missing_path.v1`
- Source binary SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`

## Result

The new route tried to start AiMaMi under `lldb` with disposable `HOME`,
disposable `CODEX_HOME`, and `TAURI_WEBVIEW_AUTOMATION=1`.

Observed result:

```text
error: failed to get reply to handshake packet within timeout of 6.0 seconds
Process 0 exited with status = -1 (0xffffffff)
```

The process did not reach a usable AiMaMi runtime context. No WKWebView,
Tauri IPC internals, JavaScript evaluation, command body, success envelope,
error envelope, UI state, side-effect bytes, or acceptance result was captured.

## Gate Fields

| Field | Value |
|---|---|
| `harness_status` | `failed` |
| `accepted_ipc_harness` | false |
| `accounts_command_invoked` | false |
| `runtime_acceptance_executed` | false |
| `request_body_captured` | false |
| `success_envelope_captured` | false |
| `error_envelope_captured` | false |
| `side_effect_bytes_captured` | false |
| `fixture_result` | 
ot_executed` |
| `proof_class` | `harness_diagnostic_only` |

## Boundary

This reducer only records that the under-lldb-start route is not an accepted
accounts runtime harness on this host. It must not be consumed as proof of
`preview_account_import` missing-path behavior.

The selected fixture still requires a real same-version AiMaMi 1.0.9
WKWebView/Tauri IPC context that invokes:

```text
preview_account_import { filePath: "<disposable>/import/missing.json" }
```

and captures the exact request body, error envelope, no-write before/after
bytes, UI/native state, fixture PASS/FAIL, and reducer acceptance boolean.

## Gate Effect

No promotion.

- `strictImplementationUse=false`
- `readyToImplement=false`
- `implementation_use=false`
- `gate_accepted=false`
- `full_leaf_100=false`
- `moduleExitAllowed=false`

Accounts remains the active module. `moduleExitAllowed=false` until the
required macOS accounts gate closes.
