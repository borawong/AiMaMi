# Accounts Runtime Execution History - AiMaMi 1.0.9

Scope: accounts-only runtime execution history reducer for AiMaMi 1.0.9 macOS.

This reducer consumes the existing blocked raw execution bundle and the later
current-blocker correction. It writes no raw evidence, appends no `INDEX.jsonl`
row, edits no regulation, runs no product test, and promotes no gate.

## Evidence Consumed

- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/summary.json`
- Runtime diagnostic log artifacts are not directly linked from `source archive`; use the manifest and summary above plus canonical `INDEX.jsonl` rows for external evidence lookup.
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-acceptance-execution/targets/accounts-runtime-acceptance-targets.jsonl`
- canonical `INDEX.jsonl` rows `422`, `424`, `425`, and correction row `449`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-harness-sot-feasibility/manifest.json`
- `logic/ACCOUNTS-RUNTIME-SOT-BLOCKER-109.md`

## Decision

`runtime-acceptance-execution` is a blocked execution-history bundle, not an
executed acceptance trace.

It attempted to resolve a stale non-SOT app path. This is a historical
negative route only, not current binary discovery:

`<source-location>/source-binary/AiMaMi 1.0.9.app`

That path was missing. The only alternate app found in that run was:

`<source-location>/runtime-validation/aimami-placement/AiMaMi.app`

That alternate was rejected because its executable SHA was
`3de74edcb606ddc84e520531002dba22a0b01fceee5d07bec038b11e9717f18e`
and its bundle version was `1.0.1`, not AiMaMi `1.0.9`.

Therefore the bundle correctly did not launch the stale/mismatched app and did
not invoke any accounts command.

The current binary SOT is different and valid:

- `<source-location>/source-binary/AiMaMi 1.0.9.app`
- executable SHA256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- bundle version: `1.0.9`

`INDEX.jsonl` row `449` supersedes the old app-unavailable interpretation:
the current blocker is not binary discovery. The current blocker is:

`sot_app_present_but_no_accepted_ipc_runtime_harness_or_executed_accounts_acceptance_trace`

## Per-command Execution State

| Command | Runtime attempted | Request body | Success envelope | Error envelope | Side-effect bytes | Acceptance |
|---|---|---|---|---|---|---|
| `switch_account` | false | missing | missing | missing | missing | missing |
| `switch_account_and_restart_codex` | false | missing | missing | missing | missing | missing |
| `preview_account_import` | false | missing | missing | missing | missing | missing |
| `import_accounts_from_file` | false | missing | missing | missing | missing | missing |
| `export_accounts_to_file` | false | missing | missing | missing | missing | missing |
| `logout` | false | missing | missing | missing | missing | missing |
| `remove_accounts` | false | missing | missing | missing | missing | missing |
| `begin_add_account_attach_monitor` | false | missing | missing | missing | missing | missing |

The table above is evidence of non-execution only. It must not be interpreted
as upstream runtime behavior.

## Strict Gate Effect

No promotion.

- `consumerStartReady`: accounts total is `9/9` for Gate 1 static context only;
  strict/highest remains blocked.
- `consumerStartBlocked`: `0/9` for Gate 1 static context only.
- `strictImplementationUse`: `0` for accounts.
- `readyToImplement`: `0` for accounts.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

This reducer only fixes evidence hygiene: old non-SOT path failure is not a
current binary-missing blocker, and it is also not runtime acceptance evidence.
Accounts remains blocked on accepted macOS WebView/Tauri IPC execution, exact
request/response/error envelopes, side-effect bytes, rollback/no-write
fixtures, frontend consumption state, and executed source archive acceptance.
