# Accounts Frontend Consumption / Guard Matrix - AiMaMi 1.0.9

Scope: AiMaMi `1.0.9` macOS accounts-only static frontend consumption,
guard, disabled/loading, cancel, toast, and query-invalidation matrix.

Current reducer:
`logic/ACCOUNTS-IDB-WRITEBACK-CURRENT-SYNC-109.md`

This reducer consumes existing static frontend evidence only. It creates no
raw evidence, appends no `INDEX.jsonl` row, edits no regulation, runs no
product test, and promotes no gate.

## Evidence Consumed

- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-static-ui-branch-matrix/matrix.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/frontend-control-flow.jsonl`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/ipc-contracts.jsonl`
- `logic/ACCOUNTS-FRONTEND-GATE1-TRIPLET-109.md`
- `logic/ACCOUNTS-CHATGPT-SESSION-IMPORT-DIFF-109.md`
- `logic/ACCOUNTS-DTO-ENVELOPE-GAP-MATRIX-109.md`

## Static Consumption Matrix

| Target | Static frontend state | Still missing for strict/full |
|---|---|---|
| `switch_account` | Wrapper requires `accountKey`; no accepted visible accounts-page pure-switch trigger. | Visible UI trigger or accepted substitute, live invoke, envelope, bytes, UI state, acceptance. |
| `switch_account_and_restart_codex` | Selected account detail sets pending account; confirm dialog submits `accountKey`; success/error toasts and dialog close are statically visible. | Runtime UI-state, real IPC invocation, restart/process state, exact envelope, bytes, acceptance. |
| `preview_account_import` | Import button opens native file picker; cancel is swallowed before IPC; selected string path calls wrapper; success opens preview dialog; error shows destructive toast. | Missing/invalid/non-UTF8 runtime envelopes, no-write bytes, UI-state proof, acceptance. |
| `import_accounts_from_file` | Preview dialog confirm supplies `overwriteExisting` and `selectedKeys`; success clears preview, invalidates `quota-history`, and shows success/warning/import-nothing toasts. | `selectedKeys` null/empty/some runtime semantics, conflict/parse/write envelopes, before/after bytes, rollback/no-rollback, acceptance. |
| `export_accounts_to_file` | Export confirm precedes native save dialog; cancel before target path avoids destructive toast; success closes dialog and clears selection. | `accountKeys` null/empty/some runtime semantics, overwrite/write envelope, output/temp bytes, no-write proof, acceptance. |
| `logout` | Wrapper has no args; no accepted accounts-page terminal callsite. | Terminal frontend CCF/UI state or accepted substitute, active/no-active envelope, auth backup/delete bytes, acceptance. |
| `remove_accounts` | Selected account detail sets pending account; destructive confirm submits `[accountKey]`; cancel clears pending state; success/error toasts are statically visible. | Missing-field/no-registry/partial-delete/quota envelopes, delete/skip bytes, acceptance. |
| `begin_add_account_attach_monitor` | Wrapper has no args; no accepted accounts-page terminal callsite or accepted native callback substitute. | Terminal frontend CCF or accepted callback, monitor start/reentry/event sequence, runtime trace, acceptance. |
| `import_chatgpt_session_account` | Add-account session dialog submits trimmed textarea text; empty trimmed input returns before IPC; wrapper default sends `overwriteExisting=false`; success closes dialog and refreshes accounts. | Runtime DTO null/default semantics, exact envelopes, auth/registry bytes, rollback/no-write proof, UI state, acceptance. |

## Interpretation

Static frontend consumption is implementation-planning input only. It proves
which UI branches and user-visible states the bundled macOS frontend references,
but it does not prove live WebView state, Tauri IPC invocation, backend
envelope shape, or durable local side effects.

For Gate 1 context, all 9 accounts targets are known in the current macOS
target set. `switch_account`, `logout`, and `begin_add_account_attach_monitor`
still need a terminal visible callsite or accepted same-platform substitute
before strict/full.

## Gate Effect

No promotion:

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
