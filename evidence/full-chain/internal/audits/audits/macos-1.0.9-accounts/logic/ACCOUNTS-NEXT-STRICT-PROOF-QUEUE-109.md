# Accounts Next Strict Proof Queue - AiMaMi 1.0.9

Produced: 2026-06-01T23:59:00+08:00

Scope: accounts-only next proof queue. This is a conclusion reducer and
execution selector. It creates no raw evidence, appends no `INDEX.jsonl` row,
runs no product/main test, and promotes no gate.

## Current Gate State

- Active module: accounts.
- `consumerStartReady`: 9/9 Gate 1 static context only.
- `consumerStartBlocked`: 0/9 for Gate 1 static context only.
- `strictImplementationUse`: 0/9.
- `readyToImplement`: 0/9.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Under the current non-relay policy, Gate 1 does not allow module exit. Do not
switch to plugins, relay, system, or tray until an accounts row reaches
`strictImplementationUse` or accounts reaches `readyToImplement` /
`full_leaf_100`, unless the user explicitly overrides the sequence.

## Selected Next Proof

The next accounts proof lane is `preview_account_import` only.

Reason:

- It is the lowest-risk current accounts command because the intended strict
  fixture can be no-write.
- Same-version backend owner/body and direct helper pseudocode are already
  reduced.
- Static frontend wrapper and partial UI branch evidence exist.
- Existing runtime route probes narrowed rejected routes but did not reach
  AiMaMi WebView/Tauri internals.

The selected first accepted fixture is:

```text
fixture_id: accounts.preview_account_import.missing_path.v1
command: preview_account_import
request body: { "filePath": "<disposable>/import/missing.json" }
expected mutation: no auth, registry, quota, snooze, or temp mutation
```

This fixture is preferred before valid import because it can prove the accepted
harness, exact error envelope, and no-write bytes without creating account
state.

The IDA static selector strengthens the choice of this fixture:
same-version IDA decompilation confirms parser metadata failure returns before
file read, JSON decode, registry helper reads, active-field helper reads,
preview classification, or response construction. The four
preview/parser/registry helper functions also contain no static
write/delete/copy/persist sensitive-field. This is only static no-write direction; it
does not replace the required envelope, byte, UI-state, acceptance, or platform
evidence.

## Evidence Consumed

- Current entrypoint:
  `<source-location>/audits/macos-1.0.9-accounts/`
- Current accounts strict plan:
  `logic/ACCOUNTS-STRICT-FULL-LEAF-CURRENT-PLAN.md`
- Current evidence ledger:
  `logic/ACCOUNTS-CURRENT-EVIDENCE-LEDGER-109.md`
- Runtime workorder:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/`
- Runtime workorder target rows:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/targets/accounts-lane-c-preview-import-export-fixture-rows.jsonl`
- Static helper proof:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/preview-import-helper-leaf-pseudocode/manifest.json`
- IDA no-write static selector:
  `logic/ACCOUNTS-PREVIEW-IMPORT-IDA-NO-WRITE-STATIC-109.md`
- Binary SOT:
  `<source-location>/source-binary/AiMaMi 1.0.9.app`

## Required Accepted Trace Fields

The first accepted trace must capture all fields below in one same-version
macOS 1.0.9 run:

| Field | Required content |
|---|---|
| Harness proof | Concrete proof that JavaScript execution reached the real AiMaMi WKWebView / Tauri IPC context, not only app launch, localhost listener, WebDriver 404, static strings, or UI clicks. |
| Source binding | SOT app path and executable SHA `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`. |
| Disposable roots | Exact `HOME`, `CODEX_HOME`, temp root, and fixture file paths. |
| Invoke | Exact terminal command name `preview_account_import` and exact JSON body. |
| Envelope | Exact success absence, warning field/absence, error/CoreError envelope, and any `errors` array/null/omitted distinction. |
| Side effects | Before/after bytes or explicit absence proof for auth, registry, quota, snooze, temp, and source fixture paths. |
| UI/state | Preview failure state or accepted same-platform callback proof, including visible error/toast/dialog state if UI path is used. |
| Acceptance | source archive acceptance id, PASS/FAIL, reducer acceptance boolean, and raw evidence path. |
| Gate booleans | `strictImplementationUse=false`, `readyToImplement=false`, `implementation_use=false`, `gate_accepted=false`, `full_leaf_100=false`, unless a later reducer proves every required strict dimension for the leaf. |

## Rejected As Proof

- app launch alone;
- `TAURI_WEBVIEW_AUTOMATION` listener existence alone;
- HTTP 404 endpoint sweep;
- WebDriver `GET /status` or `POST /session` 404s;
- Safari driver readiness or failure;
- LLDB attach failure;
- static WebView/Tauri strings;
- backend pseudocode or call-tree without runtime invocation;
- fixture draft rows without execution;
- AppleScript/UI clicks without IPC/envelope/byte capture;
- Windows inference from macOS.

## Expansion Rule

Only after `accounts.preview_account_import.missing_path.v1` has an accepted
same-version trace may the lane expand to:

1. `accounts.preview_account_import.invalid_json.v1`
2. `accounts.preview_account_import.non_utf8.v1`
3. `accounts.preview_account_import.filePath_omitted.v1`
4. `accounts.preview_account_import.filePath_null.v1`
5. `accounts.preview_account_import.valid_file_preview.v1`

Only after those preview rows are accepted should the accounts runtime queue
expand to import/export/switch/logout/remove/monitor rows.

## Gate Effect

No promotion. This file narrows the next accounts strict proof queue only.
Accounts remains active and `moduleExitAllowed=false`.
