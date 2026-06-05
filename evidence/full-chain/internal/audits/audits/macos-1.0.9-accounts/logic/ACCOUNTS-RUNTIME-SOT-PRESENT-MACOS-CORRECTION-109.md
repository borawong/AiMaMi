# Accounts Runtime SOT Present macOS Correction 1.0.9

## Scope

This reducer is macOS accounts only.

- product: AiMaMi
- version: 1.0.9
- platform: macos-universal
- module: accounts
- reducer: `logic/ACCOUNTS-RUNTIME-SOT-PRESENT-MACOS-CORRECTION-109.md`
- platform boundary: `macos_only`

## Correction

The previous runtime target status
`blocked_before_invocation_exact_macos_1_0_9_app_unavailable` is stale for the
current macOS bundle.

Current same-platform SOT is present:

- app: `<source-location>/source-binary/AiMaMi 1.0.9.app`
- binary: `<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi`
- IDA binary: `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi`
- SHA-256: `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`

The runtime execution bundle has been overwritten so all 9 macOS accounts
target rows use:

`sot_app_present_no_accepted_ipc_harness_no_gate_promotion`

## Runtime Evidence State

The current accepted blocker is not artifact absence. It is missing accepted
runtime proof:

- live WKWebView/Tauri IPC request, response, and error envelope bytes
- exact accounts command runtime success/error payload bytes
- before/after filesystem bytes and no-write residue fixtures
- rendered UI/toast/dialog/query-state proof
- executed source archive acceptance fixture results
- terminal frontend listener consumption for monitor/runtime event delivery

The historical HTTP probe file is not accepted proof. Its curl URLs contain a
space between the port and path, for example `<local-tool-endpoint> /`, so the
recorded failures are malformed-probe history only.

## macOS Gate Effect

IDA remains closed 9/9 for backend/static owner-wrapper-threading-side-effect
accounts targets through:

`logic/ACCOUNTS-IDB-WRITEBACK-CURRENT-SYNC-109.md`

This reducer only corrects runtime SOT status. It does not promote strict or
highest gates:

```json
{
  "strictImplementationUse": false,
  "readyToImplement": false,
  "implementation_use": false,
  "gate_accepted": false,
  "full_leaf_100": false,
  "moduleExitAllowed": false
}
```

## Updated Runtime Files

- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/summary.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/targets/accounts-runtime-acceptance-targets.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/targets/accounts-runtime-acceptance-targets.jsonl`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/logs/attempted-commands.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/logs/attempts.jsonl`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/validation/file-manifest.json`

## Current Position

Accounts remains the active module. Do not move to plugins until macOS accounts
strict/full gates are closed by accepted runtime envelope, side-effect bytes,
UI-state, and acceptance proof.
