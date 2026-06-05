# Accounts Preview Import Missing Path Runtime Readiness Static - AiMaMi 1.0.9

Scope: accounts-only static readiness selector for the first accepted runtime
fixture candidate, `accounts.preview_account_import.missing_path.v1`.

This reducer creates no raw evidence, appends no `INDEX.jsonl` row, runs no
app, performs no runtime probe, edits no product code, and promotes no gate.

## Selected Fixture

```json
{
  "fixture_id": "accounts.preview_account_import.missing_path.v1",
  "command": "preview_account_import",
  "request_body": {
    "filePath": "<disposable>/import/missing.json"
  },
  "expected_static_side_effect": "metadata failure before read/json/registry/active/write; no auth/registry/quota/snooze/temp/source mutation is expected",
  "runtime_status": "not_executed"
}
```

This is the selected first probe because it can test the real Tauri IPC
harness, exact error envelope, UI failure mapping, and no-write bytes before
any account data is created or imported.

## Evidence Consumed

- `logic/ACCOUNTS-NEXT-STRICT-PROOF-QUEUE-109.md`
- `logic/ACCOUNTS-PREVIEW-IMPORT-MISSING-PATH-ERROR-CHAIN-STATIC-109.md`
- `logic/ACCOUNTS-PREVIEW-IMPORT-FIXTURE-UI-NOWRITE-CROSSCHECK-109.md`
- `logic/ACCOUNTS-RUNTIME-HARNESS-ROUTE-DECISION-109.md`
- `logic/ACCOUNTS-RUNTIME-NEGATIVE-ROUTE-COVERAGE-109.md`
- Frontend CCF row:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/frontend-control-flow.jsonl:2`
- IPC wrapper row:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/ipc-contracts.jsonl:15`
- IDA MCP recheck against source SHA
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`.

## Static Frontend Readiness

- Accounts page static CCF row 2 calls wrapper `previewAccountImport` from a
  mutation function after native JSON file selection.
- The terminal frontend wrapper is `previewAccountImport(filePath)` and it
  invokes `preview_account_import` with `{ filePath }`.
- Native picker cancel is swallowed before IPC.
- Static success stores preview payload and opens the preview dialog.
- Static failure maps to destructive `accounts.io.previewFailed` toast.

These facts select the fixture and expected UI failure surface only. They do
not prove live WKWebView state, real IPC invocation, or rendered toast bytes.

## Static IDA Readiness

IDA current-session readback:

- Command wrapper cluster at `0x100105680` contains command
  `preview_account_import` and argument field `filePath`.
- Blocking command body `0x10032c93c` obtains Tauri state, locks the account
  repository, copies decoded `filePath`, calls `preview_import`, maps
  `CoreError` display into `Err<String>`, and returns `CoreEnvelope::ok` on
  success.
- Core owner `0x1005dd788` calls `parse_import_file` first at `0x1005dd7c4`.
  Parser error returns before registry read, active-field read, preview
  classification, or write/persist leaves.
- Parser leaf `0x1005e13fc` first calls `metadata(filePath)` at
  `0x1005e142c`. Metadata failure is the missing-path exit and returns before
  file read, JSON decode, kind/schema/count validation, registry read,
  active-field read, preview classification, or any persistence helper.

Static no-write expectation for the selected fixture:

- source missing file: remains absent;
- auth snapshot files: unchanged;
- accounts registry: unchanged or absent-before/absent-after;
- quota store: unchanged or absent-before/absent-after;
- auto-switch snooze/pending files: unchanged or absent-before/absent-after;
- temp/import/export scratch paths: unchanged or absent-before/absent-after.

## Runtime Acceptance Requirements

The fixture is accepted only after one same-version macOS runtime trace proves
all of the following in one evidence bundle:

- SOT app path and executable SHA binding;
- disposable `HOME`, `CODEX_HOME`, temp root, and fixture path;
- real AiMaMi WKWebView/Tauri IPC reachability, not app launch or HTTP 404;
- exact command name `preview_account_import`;
- exact request body with the selected missing file path;
- exact error/CoreError envelope, warnings/errors field presence, and success
  absence;
- before/after bytes or absence proof for all no-write paths listed above;
- visible preview failure state or accepted same-platform callback substitute;
- source archive acceptance id, PASS/FAIL, and reducer acceptance boolean.

## Rejected Runtime Routes

No new executable route was found in this pass. The following remain rejected
as accepted proof for this fixture:

- app launch alone;
- `TAURI_WEBVIEW_AUTOMATION` listener with HTTP 404s;
- safaridriver readiness or failed session;
- WebDriver/CDP GET/HEAD endpoints;
- WebDriver `POST /session` failure;
- WebView inspector/menu absence;
- AX/JXA WebArea absence;
- LLDB attach/start failure;
- static WebView/Tauri IPC strings or transport shape;
- non-executed runtime acceptance workorder rows.

Current runtime blocker:

`sot_app_present_but_no_accepted_ipc_runtime_harness_or_executed_accounts_acceptance_trace`

## Gate Effect

No promotion.

```json
{
  "consumerStartReady": "unchanged",
  "strictImplementationUse": false,
  "readyToImplement": false,
  "implementation_use": false,
  "gate_accepted": false,
  "full_leaf_100": false,
  "moduleExitAllowed": false
}
```
