# ACCOUNTS-MACOS-RUNTIME-GATE-AFTER-IDA-QUEUE-109

Status: `accepted_macos_runtime_gate_queue_after_full_ida_no_gate_promotion`

Produced at: `2026-06-02T21:18:00+08:00`

Scope: AiMaMi `1.0.9` macOS accounts only.

Current accounts reducer:
`logic/ACCOUNTS-FULL-IDA-CLOSURE-ROLLUP-109.md`

Source SHA-256:
`1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`

## Position

The macOS accounts backend/static IDA layer is closed for 9/9 required targets.
The remaining gate work is macOS runtime evidence only:

- live WKWebView/Tauri IPC request, response, and error envelope bytes
- exact runtime success/error payload bytes
- before/after filesystem bytes and no-write residue fixtures
- rendered UI/toast/dialog/query-state proof
- executed source archive acceptance fixtures
- terminal frontend listener consumption for monitor/runtime event delivery

This queue does not run the app and does not claim runtime acceptance.

## Workorder Inputs

- Runtime workorder root:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/`
- Strict runtime execution spec:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/STRICT-RUNTIME-EXECUTION-SPEC.md`
- Main runtime target rows:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/targets/accounts-runtime-acceptance-targets.jsonl`
- Preview/import/export rows:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/targets/accounts-lane-c-preview-import-export-fixture-rows.jsonl`
- Switch/restart rows:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/targets/switch-account-strict-full-leaf-fixture-rows.jsonl`

Current row counts:

- `accounts-runtime-acceptance-targets.jsonl`: 8 rows
- `accounts-lane-c-preview-import-export-fixture-rows.jsonl`: 30 rows
- `switch-account-strict-full-leaf-fixture-rows.jsonl`: 14 rows

The 9th accounts target, `import_chatgpt_session_account`, already has a
separate non-executed acceptance draft and current IDA owner closure; it remains
in the macOS runtime queue through its exact envelope, snapshot write bytes,
registry rebuild bytes, UI state, and executed acceptance requirements.

## Target Queue

| order | target | next macOS runtime proof |
|---:|---|---|
| 1 | `preview_account_import` | Execute `accounts.preview_account_import.missing_path.v1` or equivalent accepted fixture through the real AiMaMi WKWebView/Tauri IPC context; capture request body, error envelope, no-write bytes, toast/dialog state, and acceptance PASS/FAIL. |
| 2 | `preview_account_import` | Execute valid/invalid/JSON/non-UTF8/default/null path rows; capture success payload, exact parser errors, preview dialog field state, and no-write proof. |
| 3 | `import_accounts_from_file` | Execute selectedKeys omitted/null/empty/subset/conflict/active/parse/write/rebuild rows; capture auth snapshot bytes, registry rebuild bytes, skipped/imported payloads, rollback/no-rollback, UI state, and acceptance. |
| 4 | `export_accounts_to_file` | Execute accountKeys omitted/null/empty/subset/default filename/write-failure rows; capture export file bytes, exact JSON field order/values, error envelopes, UI state, and acceptance. |
| 5 | `switch_account` | Execute success/missing/snapshot/copy-persist/warning/cancel rows; capture auth, registry, quota, backup bytes, warnings, UI state, and acceptance. |
| 6 | `switch_account_and_restart_codex` | Execute success/failure/rollback/restart-failure/refresh-warning/cancel rows; capture process restart observation, rollback bytes, envelopes, UI/native state, and acceptance. |
| 7 | `logout` | Execute active/no-active/persist-failure rows; capture auth backup/remove bytes, registry active clear, snooze bytes, envelopes, UI state, and acceptance. |
| 8 | `remove_accounts` | Execute missing/no-registry/all/mixed/delete-skip/quota-failure rows; capture auth delete residue, registry/quota bytes, envelopes, UI state, and acceptance. |
| 9 | `begin_add_account_attach_monitor` | Execute monitor start/reentry/new-account/snapshot-failure/thread-failure/lifetime rows; capture monitor state bytes, event ordering, `runtime-state-updated` payload, frontend listener consumption, native callback/UI proof, and acceptance. |
| 10 | `import_chatgpt_session_account` | Execute malformed/missing-sensitive-field/conflict/active/serialize/write/rebuild/success rows; capture session request envelope, auth snapshot bytes, registry rebuild bytes, partial-write class, UI state, and acceptance. |

## Acceptance Rule

A row can promote only when the reducer for that row contains:

- accepted same-version macOS AiMaMi WKWebView/Tauri IPC reachability proof
- exact command name and JSON request body
- exact success/warning/error envelope bytes
- before/after bytes or accepted no-write residue for all touched paths
- UI state or accepted same-platform native callback proof
- source archive acceptance id with PASS/FAIL
- reducer acceptance boolean

Until then:

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

## Gate Effect

No promotion. Accounts remains the active module. The next accepted proof must
be macOS accounts runtime evidence, not additional macOS IDA static evidence and
not another module.
