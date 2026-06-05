# Accounts ChatGPT Consumer Start Gate Correction - AiMaMi 1.0.9

## Current Gate1 Static Closure Update

Latest accounts Gate 1 reducer: `logic/ACCOUNTS-CHATGPT-CONSUMER-START-STATIC-CLOSURE-109.md`. It supersedes earlier blocked-correction wording for `import_chatgpt_session_account` at Gate 1 only. Under the current non-relay policy, accounts is not closed for module sequencing; the active module lock remains accounts. The accounts state is `consumerStartReady=9/9`, `consumerStartBlocked=0/9`, `strictImplementationUse=0/9`, and `readyToImplement=0/9`. Historical cross-module totals are not an accounts sequencing or implementation signal.

Gate effect: `import_chatgpt_session_account` is `consumerStartReady=true` for `startMode=reverse_guided` planning/intake only; `strictImplementationUse=false`, `readyToImplement=false`, `implementation_use=false`, `gate_accepted=false`, `full_leaf_100=false`, and `strictParityReady=false`. Runtime IPC, exact envelopes, side-effect bytes, rollback/no-rollback bytes, executed acceptance, and independent Windows closure remain strict/highest blockers and stay in `forbiddenUntilStrictImplementationUse` / `forbiddenUntilReady`.

No raw evidence was created for this reducer, no `INDEX.jsonl` row was appended, no regulation was edited, no product code was changed, and no product tests were run.


Scope: accounts-only Gate 1 reducer for `import_chatgpt_session_account`.

This correction supersedes the earlier mistaken start-ready wording in this
file and keeps the conservative blocker audit in
`logic/ACCOUNTS-CHATGPT-CONSUMER-START-GATE-AUDIT-109.md` as the controlling
Gate 1 rationale. It consumes existing
frontend, backend, helper, subhelper, static side-effect, and acceptance-draft
evidence only. It creates no raw evidence, appends no `INDEX.jsonl` row, edits
no regulations, runs no product tests, and does not promote strict/highest
gates.

## Decision

`import_chatgpt_session_account` is `consumerStartReady=true` and
`consumerStartBlocked=false` for Gate 1 only; strict/highest remain false.

It is not `strictImplementationUse`, not `readyToImplement`, not
`implementation_use`, not `gate_accepted`, and not `full_leaf_100`.

The earlier start-ready wording over-classified static reverse evidence as
enough for Gate 1. That was wrong. For the upstream UI path, the DTO and
side-effect boundary is informative but still not sufficient to start
implementation because runtime envelopes, direct IPC null/omitted semantics,
durable side-effect bytes, and executed acceptance remain unaccepted.

- the frontend wrapper always sends `sessionJson` as the trimmed textarea
  string and `overwriteExisting` as a boolean defaulting to `false`;
- empty UI input is blocked before IPC;
- backend owner/body, conversion helper, nested session discovery, hash helper,
  and timestamp helper pseudocode are same-version macOS evidence;
- static branch order proves convert/validate/conflict checks happen before
  snapshot writes;
- persistence terminals and write order are identified:
  `ensure_directories` -> field validation -> registry/active field read ->
  conflict checks -> `serde_json::ser::to_vec_pretty` ->
  `relay::atomic_write::write_atomic` -> `Repository::rebuild_registry`;
- a 14-row acceptance draft exists for happy path, parse/conversion errors,
  overwrite conflicts, active overwrite rejection, write failure, and direct
  IPC omitted/null cases.

## Gate 1 Matrix

| Gate 1 dimension | Result | Evidence |
|---|---|---|
| `renderSurfaceReady` | ready | Add-account dialog, textarea, paste action, overwrite checkbox, footer buttons, ChatGPT/session helper links, loading/disabled state. |
| `uiCallEntryReady` | ready | `importChatGptSessionAccount(sessionJson, overwriteExisting=false)` invokes `import_chatgpt_session_account` with `{ sessionJson, overwriteExisting }`; submit trims textarea state and blocks empty/busy input. |
| `dtoBoundaryReady` | blocked | Upstream UI path sends required `sessionJson` string and boolean `overwriteExisting`, but direct IPC omitted/null runtime decode remains draft-only and affects validation/error mapping. |
| `happyPathReady` | partial-static | Static chain reaches command closure -> `core::account_io::import_chatgpt_session` -> `auth::convert_chatgpt_session_to_axonhub_auth` -> field validation -> atomic write -> registry rebuild; exact success envelope and bytes are missing. |
| `boundaryPathReady` | blocked | Static branches cover malformed JSON, missing access sensitive-field, id-sensitive-field build failure, missing account id, invalid account field, existing-account conflict, active-account overwrite rejection, serialization error, write failure, and registry rebuild failure. Exact runtime envelopes remain missing. |
| `sideEffectReady` | blocked | Static side-effect order identifies directory ensure, auth snapshot serialization, atomic snapshot write, and registry rebuild. Exact before/after bytes and partial-write/no-write bytes remain missing. |
| `frontendConsumptionReady` | ready | Success toast consumes placeholder/email, closes and resets dialog, calls `onImported`, refreshes accounts, and invalidates `["quota-history"]`; failure toast uses `Error.message` or fallback i18n. |
| `acceptanceDraftReady` | ready | 14 fixture rows exist in `import-chatgpt-session-account-acceptance-draft`. |
| `platformScopeDeclared` | ready | macOS 1.0.9 SOT SHA is bound; Windows remains independent and cannot be inferred. |

## Strict / Highest Blockers

The following remain forbidden assumptions for implementation consumers:

- Do not claim upstream strict parity.
- Do not claim exact direct IPC omitted/null Tauri error envelope parity.
- Do not claim exact success/error/CoreError envelope parity.
- Do not claim exact auth/registry/temp before-after bytes.
- Do not claim rollback/no-rollback byte parity for `write_atomic` or
  `rebuild_registry` failures.
- Do not infer Windows behavior from macOS evidence.
- Do not treat the 14-row fixture draft as executed acceptance.

These are strict/highest blockers:

- `strictImplementationUse=false`
- `readyToImplement=false`
- `implementation_use=false`
- `gate_accepted=false`
- `full_leaf_100=false`

## Gate Effect

No promotion:

- `consumerStartReady=true` at Gate 1 only
- `consumerStartBlocked=false` at Gate 1

Accounts module status after this reducer:

- legacy 8 accounts rows remain consumer-start context only;
- `import_chatgpt_session_account` is Gate 1 static ready only;
- accounts `strictImplementationUse=0`;
- accounts `readyToImplement=0`;
- `moduleExitAllowed=false` under the current non-relay strict policy; strict/highest still false for strict/highest work; do not switch modules
  until explicitly allowed by the current execution controller.
