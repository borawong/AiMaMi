# Accounts Preview Import Static Boundary - AiMaMi 1.0.9

Scope: accounts-only, AiMaMi `1.0.9`, macOS. This reducer records what static
reverse evidence already proves for `preview_account_import`, and what remains
runtime / acceptance work. It does not create raw evidence, append
`INDEX.jsonl`, edit regulations, run product tests, or promote any gate.

This corrects the planning boundary: a real WKWebView/Tauri IPC harness is a
missing runtime / acceptance dimension, not the only remaining reverse activity.
Static reverse can still close owner, source binding, pseudocode presence,
frontend wrapper shape, UI branch mapping, static side-effect classification,
and fixture mapping.

## Evidence

Backend evidence:

- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/backend-owner-pseudocode-calltree/manifest.json`
- `stale missing preview_account_import retired execution bundle pseudocode file; use intermediate/aimami/1.0.9/macos/accounts/preview-import-helper-leaf-pseudocode/manifest.json`
- `stale missing backend-owner retired execution bundle call-trees; superseded by raw/aimami/1.0.9/macos/accounts/preview_account_import/manifest.json and intermediate/aimami/1.0.9/macos/accounts/preview-import-helper-leaf-pseudocode/manifest.json`

Frontend evidence:

- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/frontend-control-flow.jsonl`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/ipc-contracts.jsonl`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-static-ui-branch-matrix/matrix.json`

Acceptance draft evidence:

- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/targets/accounts-lane-c-preview-import-export-fixture-rows.jsonl`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/proof-criteria.json`

Source binding:

- SOT universal executable SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- arm64 thin slice SHA:
  `985dae00be620b21164b4a8d35cc0379b750d5a6257b25897b0e813441e4d706`

## Static Backend Boundary

`preview_account_import` maps to
`codexmate_lib::core::account_io::preview_import` at `1005dd788`.

The same-version Ghidra pseudocode is real decompiled output, not
candidate-only and not range-repaired. The visible static path is:

1. call `parse_import_file`;
2. on parse/import error, return the error structure through the output slot;
3. clone `CodexPaths`;
4. call `read_registry_or_empty_keys`;
5. call `read_active_account_key`;
6. iterate parsed exported accounts;
7. construct preview entries and counters for conflict / active-local style
   classification;
8. return preview payload through the output slot;
9. if `std::path::Display::fmt` fails, terminate through `Result::unwrap`.

The accepted raw call-tree row is producer-accepted for this backend target,
but the original row only recorded the root and unresolved `Result::unwrap`.
The helper gap has now been reduced by
`logic/ACCOUNTS-PREVIEW-IMPORT-HELPER-LEAF-PSEUDOCODE-109.md`: same-version
macOS pseudocode exists for `parse_import_file`,
`read_registry_or_empty_keys`, and `read_active_account_key`, and the new
call-tree resolves `preview_import` to those helpers. `Result::unwrap` remains
an unresolved non-primary panic/display leaf.

Static side-effect classification:

- This `preview_import` pseudocode shows parse/read/classify/return behavior.
- The `preview_account_import` target row does not show `quota_store::save`,
  import commit, registry persist, account snapshot write, delete, atomic
  export write, process restart, or monitor spawn leaves.
- Therefore preview is statically classified as no persistence commit observed.
- This is not runtime no-write proof; before/after bytes are still required for
  strict and highest gates.

## Static Frontend Boundary

The same-version frontend repair and UI branch matrix prove a partial
frontend path:

- import button opens a native file picker with `accounts.io.openDialogTitle`
  and `.json` filter;
- when the selected path is a string, the handler calls
  `W.previewAccountImport(filePath)`;
- terminal wrapper command is `preview_account_import`;
- wrapper argument field is `filePath`;
- success stores the preview result and opens the `Cs` preview dialog;
- preview dialog consumes entries, conflicts, active-local status, and
  selected keys;
- preview failure maps to destructive toast `accounts.io.previewFailed`;
- file picker cancel is swallowed by the UI path.

This is static frontend evidence only. The current frontend reducer still
marks the row partial and non-strict because exact runtime request body,
response envelope, error envelope, UI-state execution, and acceptance are not
captured.

## Fixture Mapping

The workorder already defines six `preview_account_import` fixture rows:

| Fixture | Static mapping status | Runtime requirement |
|---|---|---|
| `valid_file_preview` | command/body draft exists with `{ filePath: "<fixture>/import/accounts-valid-export.json" }`; frontend success branch is statically mapped | execute trace, success envelope, warning/empty warning shape, preview dialog fields, no-write bytes |
| `invalid_json_error` | command/body draft exists; backend static path routes parse/import errors through output slot | execute trace, exact error/CoreError envelope, destructive toast/dialog state, no-write bytes |
| 
on_utf8_error` | command/body draft exists; parse/import error class is expected but exact text/envelope is unknown | execute trace, exact error/CoreError envelope, destructive toast/dialog state, no-write bytes |
| `missing_path_error` | command/body draft exists and is the preferred low-risk first runtime fixture | execute trace, exact missing-path error envelope, destructive toast/dialog state, no-write bytes |
| `filePath_omitted_default_boundary` | direct IPC boundary is drafted; UI does not supply omitted `filePath` | execute trace, Tauri/serde/default/nullability envelope, no-write bytes |
| `filePath_null_boundary` | direct IPC boundary is drafted; UI does not supply null `filePath` | execute trace, Tauri/serde/nullability envelope, no-write bytes |

These rows are acceptance mapping drafts, not executed acceptance. Each row
still has `accepted_reducer_boolean=false` until reduced runtime evidence is
accepted.

## Gate Decision

Static progress recorded by this reducer:

- backend owner/address/source binding: accepted static;
- pseudocode presence: accepted static;
- backend static classification: preview parse/read registry/read active
  field/classify/return, no persistence commit observed;
- helper-leaf pseudocode: accepted static for `parse_import_file`,
  `read_registry_or_empty_keys`, and `read_active_account_key`;
- frontend wrapper arg field: static `filePath`;
- frontend UI branch: partial static open-preview / destructive-error branch;
- fixture mapping: draft rows identified.

Still missing:

- accepted same-version WKWebView/Tauri IPC invocation;
- exact invoke request body from the real runtime path;
- success, warning, error, and CoreError envelope bytes/shapes;
- no-write before/after bytes for auth, registry, quota, temp, and source file;
- executed preview dialog / destructive toast UI-state proof;
- reducer-accepted fixture PASS/FAIL;
- Windows 1.0.9 independent platform closure.

Gate effect:

- `consumerStartReady`: unchanged.
- `strictImplementationUse`: false for accounts.
- `readyToImplement`: false for accounts.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

The remaining runtime / acceptance gap is:

`sot_app_present_but_no_accepted_ipc_runtime_harness_or_executed_accounts_acceptance_trace`

That runtime gap does not prohibit further static reverse on accounts. It only
prevents strict, highest, implementation, and full-leaf promotion until the
runtime / acceptance dimensions are actually closed.
