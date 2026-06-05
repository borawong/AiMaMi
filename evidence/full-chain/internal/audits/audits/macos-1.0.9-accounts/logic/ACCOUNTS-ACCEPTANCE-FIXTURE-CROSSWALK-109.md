# Accounts Acceptance Fixture Crosswalk - AiMaMi 1.0.9

Scope: accounts-only crosswalk from existing fixture design bundles to the
current AiMaMi 1.0.9 macOS accounts gate. This file consumes existing raw
evidence only, creates no raw evidence, appends no `INDEX.jsonl` row, edits no
regulations, runs no product tests, and promotes no gate.

## Authority

Current entrypoint:

`<source-location>/audits/macos-1.0.9-accounts/`

Runtime workorder:

`<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/`

ChatGPT session import acceptance draft:

`<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-account-acceptance-draft/`

Preview import strict static matrix:

`logic/ACCOUNTS-PREVIEW-IMPORT-STRICT-STATIC-BOUNDARY-109.md`

Same-version app SOT:

`<source-location>/source-binary/AiMaMi 1.0.9.app`

Main executable SHA-256:

`1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`

## Correct Status

The existing accounts acceptance artifacts are fixture designs and execution
specifications, not executed runtime acceptance.

- `accounts-runtime-acceptance-workorder`: 8 legacy accounts targets, 60
  executable fixture rows, `runtime_acceptance_executed=false`,
  `accepted_ipc_harness=false`, `accounts_commands_invoked=false`.
- `import-chatgpt-session-account-acceptance-draft`: 14 fixture rows for
  `import_chatgpt_session_account`, `runtime_executed=false`,
  `accepted_runtime_ipc=false`, `accepted_envelope=false`,
  `accepted_side_effect_bytes=false`.
- Combined accounts fixture design coverage: 74 fixture rows across 9 current
  accounts targets.
- `preview_account_import` has an additional six-class static fixture matrix
  bound to the same six preview workorder rows: `valid_file_preview.v1`,
  `invalid_json.v1`, 
on_utf8.v1`, `missing_path.v1`,
  `filePath_omitted.v1`, and `filePath_null.v1`. This matrix classifies
  static branches only; it does not execute the rows.
- Combined executed acceptance coverage: 0 accepted rows.

Therefore this crosswalk can improve implementation handoff clarity and
acceptance planning, but it cannot promote `strictImplementationUse`,
`readyToImplement`, `implementation_use`, `gate_accepted`, or
`full_leaf_100`.

## Fixture Crosswalk

| Target | Fixture design rows | Runtime execution | Acceptance effect |
|---|---:|---|---|
| `switch_account` | 6 | not executed | strict/highest blocked |
| `switch_account_and_restart_codex` | 8 | not executed | strict/highest blocked |
| `preview_account_import` | 6 (`valid_file_preview.v1`, `invalid_json.v1`, 
on_utf8.v1`, `missing_path.v1`, `filePath_omitted.v1`, `filePath_null.v1`) | not executed | static branches clarified; strict/highest blocked |
| `import_accounts_from_file` | 14 | not executed | strict/highest blocked |
| `export_accounts_to_file` | 10 | not executed | strict/highest blocked |
| `logout` | 3 | not executed | strict/highest blocked |
| `remove_accounts` | 7 | not executed | strict/highest blocked |
| `begin_add_account_attach_monitor` | 6 | not executed | strict/highest blocked |
| `import_chatgpt_session_account` | 14 | not executed | Gate 1 static ready only; strict/highest blocked |

## Required Runtime Evidence Still Missing

For every row above, the strict/highest gate still requires an accepted
same-version AiMaMi WebView or Tauri IPC harness trace that proves all of:

- exact `invoke("<command>")` name and JSON request body;
- exact success envelope and payload;
- exact warning envelope or explicit warning absence;
- exact error/CoreError envelope or explicit absence;
- frontend UI-state proof or accepted same-platform native callback proof;
- before/after bytes for touched auth, registry, quota, backup, import/export,
  temp, process, or monitor state;
- rollback or no-rollback fixture result;
- source archive unit/E2E/manual acceptance id and PASS/FAIL;
- reducer acceptance boolean bound to the current 1.0.9 entrypoint and SOT SHA.

Static frontend wrappers, backend pseudocode, call-tree rows, draft fixture
rows, app launch, localhost listener, `safaridriver` readiness, or failed
WebDriver sessions are not accepted IPC/runtime harness proof.

## Per-target Blocking Notes

- `switch_account` and `switch_account_and_restart_codex`: fixture rows define
  success, missing account/snapshot, copy/persist/rollback, warning, cancel,
  and restart failure cases. None has exact runtime envelope or before/after
  bytes reduced from AiMaMi 1.0.9.
- `preview_account_import`: the static matrix now separates valid preview,
  invalid JSON, missing path, and omitted/null pre-command decode boundaries.
  
on_utf8` is not independently proven as a distinct runtime envelope by
  static evidence. None has accepted runtime request/envelope/no-write bytes.
- `import_accounts_from_file` and `export_accounts_to_file`: lane C defines
  default/null/empty/omitted DTO cases, conflict behavior, parse/non-UTF8/
  missing path, overwrite and atomic write boundaries. None has accepted
  runtime request/envelope/side-effect bytes.
- `logout`, `remove_accounts`, and `begin_add_account_attach_monitor`: lane D
  requirements exist in `proof-criteria.json`, including registry/quota/monitor
  lifecycle errors, but no executed fixture rows are accepted.
- `import_chatgpt_session_account`: the 14-row draft covers happy path,
  malformed/missing fields, conversion errors, overwrite conflicts,
  active-account rejection, write failure, omitted/null `sessionJson`, and
  omitted/null `overwriteExisting`. It is Gate 1 start-ready through static
  closure, but remains draft-only for strict/highest proof.

## Gate Effect

No promotion.

- `consumerStartReady`: legacy eight accounts context remains consumed; accounts
  total is `9/9` ready context at Gate 1; strict/highest remains blocked.
- `consumerStartBlocked`: `0/9` for Gate 1 static context only.
  `import_chatgpt_session_account` is Gate 1 start-ready by static closure;
  runtime acceptance gaps remain strict/highest blockers.
- `strictImplementationUse`: accounts remains `0`.
- `readyToImplement`: accounts remains `0`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

This file is a planning and crosswalk reducer only. It is not a runtime trace,
not a harness result, and not an acceptance reducer.
