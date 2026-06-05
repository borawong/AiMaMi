# Accounts ChatGPT Consumer Start Static Closure - AiMaMi 1.0.9

Scope: accounts-only Gate 1 closure for `import_chatgpt_session_account`.

This reducer consumes existing same-version macOS 1.0.9 frontend, backend,
helper, static side-effect, and acceptance-draft evidence. It creates no raw
evidence, appends no `INDEX.jsonl` row, edits no regulation, runs no product
test, and does not promote `strictImplementationUse`, `readyToImplement`,
`implementation_use`, `gate_accepted`, or `full_leaf_100`.

## Decision

`import_chatgpt_session_account` is promoted only to:

- `consumerStartReady=true`
- `startMode=reverse_guided` planning/intake only

The previous Gate 1 blocker wording over-required strict/runtime evidence for
consumer start. Under `GATE-SPEC.md`, Gate 1 may start from reverse-guided
evidence when the implementation-affecting surface is clear and remaining
Unknowns are classified. Exact runtime envelopes, durable side-effect bytes,
executed acceptance, and independent Windows closure remain strict/highest
blockers. No implementation-use permission is granted:
`strictImplementationUse=false`, `readyToImplement=false`, and
`implementation_use=false`.

## Evidence Consumed

- Frontend boundary and UI path:
  `logic/ACCOUNTS-CHATGPT-SESSION-IMPORT-DIFF-109.md`
- Backend owner/core/helper static proof:
  `<source-location>/raw/aimami/1.0.9/macos/accounts/import_chatgpt_session_account/manifest.json`
- Static error and side-effect map:
  `logic/ACCOUNTS-STATIC-ERROR-SIDEEFFECT-MAP-109.md`
- Frontend guard/consumption matrix:
  `logic/ACCOUNTS-FRONTEND-CONSUMPTION-GUARD-MATRIX-109.md`
- DTO/envelope gap matrix:
  `logic/ACCOUNTS-DTO-ENVELOPE-GAP-MATRIX-109.md`
- Non-executed fixture draft:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-account-acceptance-draft/manifest.json`
- Current binary SOT:
  `<source-location>/source-binary/AiMaMi 1.0.9.app`

## Gate 1 Matrix

| Gate 1 dimension | Evidence | Status |
|---|---|---|
| `renderSurfaceReady` | Accounts add-account flow opens the ChatGPT session import dialog with instructions, risk note, textarea, paste action, overwrite checkbox, cancel/import footer, and ChatGPT/session helper links. | ready |
| `uiCallEntryReady` | `importChatGptSessionAccount(sessionJson, overwriteExisting=false)` invokes `import_chatgpt_session_account` with `{ sessionJson, overwriteExisting }`; submit trims textarea state and blocks empty/busy cases before IPC. | ready |
| `dtoBoundaryReady` | UI path always sends a trimmed string and boolean overwrite flag. Direct raw IPC omitted/null cases are not part of the normal UI path and are classified as strict accepted-unknown until runtime execution. | ready |
| `happyPathReady` | Static path is UI -> wrapper -> Tauri command closure -> `core::account_io::import_chatgpt_session` -> ChatGPT session conversion -> field validation -> auth snapshot serialization -> `write_atomic` -> registry rebuild. | ready |
| `boundaryPathReady` | Static branches cover invalid JSON, missing `accessToken`, id-sensitive-field build failure, missing account id, existing-account conflict, active-account overwrite rejection, serialization/write, and registry rebuild route. Exact runtime envelopes stay strict blockers. | ready |
| `sideEffectReady` | Static terminals identify directory ensure, registry/active reads, auth snapshot serialization, atomic write, and registry rebuild; no-write-before-write conflict branches are mapped. Exact before/after bytes and rollback residue stay strict blockers. | ready |
| `frontendConsumptionReady` | Success toast consumes placeholder/email, closes dialog, resets local state, calls `onImported`, refreshes accounts, and invalidates `["quota-history"]`; failure toast uses `Error.message` or fallback copy. | ready |
| `acceptanceDraftReady` | 14 fixture rows cover happy path, parse/conversion failures, overwrite conflicts, active overwrite rejection, invalid field/write failure, and omitted/null direct-IPC edge cases. Rows are not executed and do not satisfy strict/highest. | ready-draft |
| `platformScopeDeclared` | macOS 1.0.9 SOT executable SHA is bound. Windows remains independent and cannot be inferred. | ready |

## Unknown Classification

Accepted Unknown for Gate 1, still blocking strict/highest:

- Direct IPC `sessionJson` omitted/null runtime decode envelope.
- Direct IPC `overwriteExisting` omitted/null runtime decode envelope.
- Exact CoreError envelope shape for parse/conversion/conflict/write/rebuild
  branches.
- Exact auth/registry/temp before-after bytes and rollback/no-rollback residue.
- Executed fixture PASS/FAIL traces.
- Independent Windows closure.

These do not prevent reverse-guided planning/intake because the normal frontend
path, wrapper body, backend conversion/write path, static error set,
side-effect ordering, UI consumption, and fixture design are now explicit. They
do prevent implementation-use, strict upstream parity, and highest ready.

## Gate Effect

- accounts `consumerStartReady`: `9/9`
- accounts `consumerStartBlocked`: `0/9`
- accounts `strictImplementationUse`: `0/9`
- accounts `readyToImplement`: `0/9`
- global `consumerStartReady`: `21`
- global `consumerStartBlocked`: `16`
- historical cross-module strict total: `4` (not an accounts sequencing or
  implementation-use signal)
- global `readyToImplement`: `0`
- `implementation_use`: false
- `gate_accepted`: false
- `full_leaf_100`: false
- `moduleExitAllowed`: false under the current non-relay strict policy

This is not permission to claim upstream strict parity. It only closes the
current accounts module's minimum consumer-start gate. Under the current
non-relay strict policy this Gate 1 closure does not allow the execution order
to proceed to the next module while strict/highest accounts gaps remain
tracked in `forbiddenUntilStrictImplementationUse` and `forbiddenUntilReady`.
