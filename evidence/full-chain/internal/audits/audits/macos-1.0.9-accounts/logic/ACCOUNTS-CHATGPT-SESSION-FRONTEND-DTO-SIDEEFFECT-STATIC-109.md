# Accounts ChatGPT Session Frontend DTO Side Effect Static - AiMaMi 1.0.9

Scope: accounts-only static reducer for AiMaMi 1.0.9 macOS
`import_chatgpt_session_account`.

This file separates the current frontend/DTO/side-effect boundary from the
legacy eight accounts leaves. It consumes existing evidence only. It creates no
raw evidence, appends no `INDEX.jsonl` row, edits no regulation, changes no
product code, and runs no product test.

## Evidence Consumed

- Frontend IPC wrapper:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/ipc-contracts.jsonl:13`
- Accounts page frontend CCF:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/frontend-control-flow.jsonl:8`
- Wrapper-use locator:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-absence-proof/frontend-wrapper-use-index.jsonl:3`
- Frontend contract report:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/frontend-contract-report.md`
- Backend proof boundary:
  `logic/ACCOUNTS-CHATGPT-SESSION-BACKEND-PROOF-109.md`
- Existing boundary reducer:
  `logic/ACCOUNTS-CHATGPT-SESSION-IMPORT-DIFF-109.md`
- Gate 1 static closure:
  `logic/ACCOUNTS-CHATGPT-CONSUMER-START-STATIC-CLOSURE-109.md`

## Static Facts Accepted

Frontend and wrapper:

- `importChatGptSessionAccount(t, e = !1)` invokes
  `import_chatgpt_session_account` with `{ sessionJson: t,
  overwriteExisting: e }`.
- The accounts page has a terminal wrapper call for
  `import_chatgpt_session_account` with argument keys `sessionJson` and
  `overwriteExisting`.
- The static UI path covers the add-account session dialog, textarea input,
  trimmed submit value, overwrite checkbox defaulting false, busy/disabled
  guards, paste/open helper actions, cancel/close guard, success toast,
  failure toast, dialog reset, parent refresh, and `["quota-history"]`
  invalidation.

DTO and boundary:

- Normal UI-path submit sends a trimmed `sessionJson` string and boolean
  `overwriteExisting`.
- Empty trimmed input is blocked before the Tauri call.
- Wrapper omission of the second argument becomes `overwriteExisting=false`.
- Direct raw IPC omitted/null `sessionJson` and omitted/null
  `overwriteExisting` remain runtime-required gaps; wrapper defaults do not
  prove direct IPC decode semantics.
- Static helper/backend evidence covers malformed JSON, missing `accessToken`,
  id-sensitive-field build failure, missing account id, existing-account conflict,
  active-account overwrite rejection, serialization/write terminal, and
  registry rebuild terminal.

Side-effect ordering:

- Parse/conversion, invalid converted field, existing-account conflict with
  `overwriteExisting=false`, active-account overwrite rejection, and
  serialization failure occur before the snapshot write terminal in static
  evidence.
- `write_atomic` failure prevents the registry rebuild terminal.
- `rebuild_registry` failure occurs after snapshot write, so exact partial
  write and rollback residue require runtime byte evidence.

## Gate Effect

No promotion.

This reducer is dimension evidence only:

- `consumerStartReady` for accounts remains `9/9` only because the broader
  `ACCOUNTS-CHATGPT-CONSUMER-START-STATIC-CLOSURE-109.md` has already closed
  Gate 1 static context.
- This file does not independently promote a gate.
- `strictImplementationUse`: `0/9`.
- `readyToImplement`: `0/9`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Remaining strict/full blockers: exact runtime IPC decode for omitted/null DTO
cases, exact success/error/CoreError envelopes, durable auth/registry/temp
before-after bytes, rollback/no-write residue, frontend runtime consumption,
executed source archive acceptance, and independent platform closure.
