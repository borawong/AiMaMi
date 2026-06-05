# Accounts ChatGPT Consumer Start Gate Audit - AiMaMi 1.0.9

## Current Gate1 Static Closure Update

Latest accounts Gate 1 reducer: `logic/ACCOUNTS-CHATGPT-CONSUMER-START-STATIC-CLOSURE-109.md`. It supersedes earlier blocked-correction wording for `import_chatgpt_session_account` at Gate 1 only. Under the current non-relay policy, accounts is not closed for module sequencing; the active module lock remains accounts. The accounts state is `consumerStartReady=9/9`, `consumerStartBlocked=0/9`, `strictImplementationUse=0/9`, and `readyToImplement=0/9`. Historical cross-module totals are not an accounts sequencing or implementation signal.

Gate effect: `import_chatgpt_session_account` is `consumerStartReady=true` for `startMode=reverse_guided` planning/intake only; `strictImplementationUse=false`, `readyToImplement=false`, `implementation_use=false`, `gate_accepted=false`, `full_leaf_100=false`, and `strictParityReady=false`. Runtime IPC, exact envelopes, side-effect bytes, rollback/no-rollback bytes, executed acceptance, and independent Windows closure remain strict/highest blockers and stay in `forbiddenUntilStrictImplementationUse` / `forbiddenUntilReady`.

No raw evidence was created for this reducer, no `INDEX.jsonl` row was appended, no regulation was edited, no product code was changed, and no product tests were run.


Current: this conservative audit remains the controlling Gate 1 rationale.
`logic/ACCOUNTS-CHATGPT-CONSUMER-START-READY-109.md` is retained only as a
corrected no-promotion companion. The current target state is
`consumerStartReady=true` / `consumerStartBlocked=false` at Gate 1 (`strictImplementationUse=false`, `readyToImplement=false`).

Scope: accounts-only Gate 1 audit for `import_chatgpt_session_account` against
the current AiMaMi 1.0.9 macOS accounts entrypoint.

This file consumes existing conclusion and raw evidence only. It creates no
raw evidence, appends no `INDEX.jsonl` row, edits no regulations, runs no
product tests, and promotes no gate.

## Inputs

- Frontend boundary:
  `logic/ACCOUNTS-CHATGPT-SESSION-IMPORT-DIFF-109.md`
- Backend owner/body proof:
  `logic/ACCOUNTS-CHATGPT-SESSION-BACKEND-PROOF-109.md`
- Conversion helper proof:
  `logic/ACCOUNTS-CHATGPT-SESSION-HELPER-LEAF-PSEUDOCODE-109.md`
- Subhelper proof:
  `logic/ACCOUNTS-CHATGPT-SESSION-SUBHELPER-LEAF-PSEUDOCODE-109.md`
- Static error/side-effect map:
  `logic/ACCOUNTS-STATIC-ERROR-SIDEEFFECT-MAP-109.md`
- Acceptance fixture draft:
  `logic/ACCOUNTS-ACCEPTANCE-FIXTURE-CROSSWALK-109.md`

Same-version app SOT:

`<source-location>/source-binary/AiMaMi 1.0.9.app`

Main executable SHA-256:

`1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`

## Gate 1 Dimension Matrix

| Gate 1 dimension | Current evidence | Status |
|---|---|---|
| `renderSurfaceReady` | Accounts page add-account flow opens the ChatGPT session import dialog; dialog includes instructions, risk note, textarea, paste, overwrite checkbox, cancel/import footer, and ChatGPT/session helper links. | ready-static |
| `uiCallEntryReady` | Wrapper `importChatGptSessionAccount(sessionJson, overwriteExisting=false)` invokes `import_chatgpt_session_account` with `{ sessionJson, overwriteExisting }`; submit path trims textarea state and blocks empty/busy cases before IPC. | ready-static |
| `happyPathReady` | Static path is UI -> wrapper -> Tauri command closure -> `core::account_io::import_chatgpt_session` -> `auth::convert_chatgpt_session_to_axonhub_auth` -> field validation -> `write_atomic` -> registry rebuild. | ready-static |
| `frontendConsumptionReady` | Static success toast consumes placeholder/email, closes dialog, resets state, calls `onImported`, refreshes accounts, and invalidates `["quota-history"]`; failure toast uses error message or fallback i18n. | ready-static |
| `acceptanceDraftReady` | 14 fixture rows cover happy path, malformed/missing fields, conversion errors, overwrite conflicts, active-account rejection, write failure, omitted/null `sessionJson`, and omitted/null `overwriteExisting`. | ready-draft-only |
| `platformScopeDeclared` | macOS 1.0.9 SOT SHA is bound; Windows evidence remains independent diagnostic-only and cannot close macOS or be inferred from macOS. | ready-scope-declared |
| `dtoBoundaryReady` | Wrapper default and static field extraction are known, but direct IPC omitted/null behavior for `sessionJson` and `overwriteExisting` remains draft-only and not accepted. | blocked |
| `boundaryPathReady` | Static errors are known for parse/missing sensitive-field/missing account/id-sensitive-field build, overwrite conflicts, active overwrite rejection, serialization/write/registry rebuild route. Exact runtime envelope and partial-write/no-write behavior remain missing for important failure paths. | blocked |
| `sideEffectReady` | Static terminals identify auth snapshot write, atomic write, registry rebuild, and no-write-before-write branches. Exact before/after auth/registry/temp bytes and rollback/no-rollback behavior remain missing. | blocked |

## Decision

`import_chatgpt_session_account` is superseded by
`logic/ACCOUNTS-CHATGPT-CONSUMER-START-STATIC-CLOSURE-109.md` at Gate 1 and is
now Gate 1 static ready only; this older audit remains strict/highest blocker
context.

Reason: Gate 1 requires DTO boundary, boundary paths, and side effects to be
clear enough for implementation start. The current evidence is strong static
reverse evidence, but three implementation-affecting start dimensions remain
blocked:

1. Direct IPC DTO semantics for omitted/null `sessionJson` and
   `overwriteExisting` are not accepted.
2. Runtime success/error/CoreError envelopes are not captured for happy,
   parse/conversion, conflict, active-overwrite, write-failure, and registry
   rebuild branches.
3. Durable side-effect bytes and rollback/no-rollback state are not captured
   for auth snapshot, registry, temp atomic-write residue, and rebuild failure.

These are not cosmetic strict-only gaps. They change how a consumer would
implement validation, error mapping, write ordering, rollback/no-write behavior,
and UI failure handling.

## Gate Effect

Current controlling state: this older audit's blocked-start conclusion is
superseded at Gate 1 by
`logic/ACCOUNTS-CHATGPT-CONSUMER-START-STATIC-CLOSURE-109.md`.

No strict/highest promotion.

- `consumerStartReady`: true for the current Gate 1 static closure.
- `consumerStartBlocked`: false for the current Gate 1 static closure.
- `strictImplementationUse`: accounts remains `0`.
- `readyToImplement`: accounts remains `0`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Next useful accounts-only evidence should target the strict/highest blockers
above: exact DTO runtime semantics, envelopes, durable side-effect bytes,
executed acceptance, and independent platform closure. Broad module switching
is not allowed from this state.
