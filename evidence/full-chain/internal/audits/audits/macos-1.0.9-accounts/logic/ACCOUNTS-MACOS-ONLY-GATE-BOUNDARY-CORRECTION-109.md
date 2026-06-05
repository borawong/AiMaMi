# ACCOUNTS-MACOS-ONLY-GATE-BOUNDARY-CORRECTION-109

Status: `accepted_macos_only_current_gate_boundary_no_promotion`

Produced at: `2026-06-02T22:06:00+08:00`

Scope: AiMaMi `1.0.9` macOS accounts only.

## Correction

This reducer supersedes current macOS accounts entrypoint wording that treated non-macOS closure as a blocker for this macOS folder. The macOS accounts gate is evaluated only with macOS evidence in this bundle.

Current macOS IDA status remains closed for all 9 required accounts targets through `logic/ACCOUNTS-FULL-IDA-CLOSURE-ROLLUP-109.md`. Current macOS runtime queue remains `logic/ACCOUNTS-MACOS-RUNTIME-GATE-AFTER-IDA-QUEUE-109.md`.

## Closed macOS IDA Layer

- `switch_account`
- `switch_account_and_restart_codex`
- `preview_account_import`
- `import_accounts_from_file`
- `export_accounts_to_file`
- `logout`
- `remove_accounts`
- `begin_add_account_attach_monitor`
- `import_chatgpt_session_account`

The closed layer is backend/static IDA evidence: owner bodies, command wrappers, xref entries, threading model, static error surfaces, DTO/interface hints, and filesystem/process/event side-effect classes.

## Remaining macOS Gates

The remaining blockers for strict/full are macOS-only runtime and acceptance gates:

- live WKWebView/Tauri IPC request, response, and error envelope bytes
- exact runtime success/error payload bytes
- before/after filesystem bytes and no-write residue fixtures
- rendered UI/toast/dialog/query-state proof
- executed source archive acceptance fixtures
- terminal frontend listener consumption for monitor/runtime event delivery

## Gate Effect

No promotion and no module switch:

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
