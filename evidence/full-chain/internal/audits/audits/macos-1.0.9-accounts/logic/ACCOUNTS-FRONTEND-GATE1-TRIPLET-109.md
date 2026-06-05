# Accounts Frontend Gate1 Triplet - AiMaMi 1.0.9

Scope: accounts-only current AiMaMi 1.0.9 macOS frontend reducer for
`renderSurfaceReady`, `uiCallEntryReady`, and `frontendConsumptionReady`.

This file consumes existing static frontend evidence only. It creates no raw
evidence, appends no `INDEX.jsonl` row, edits no regulations, runs no product
tests, and promotes no gate.

## Evidence Consumed

- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-static-ui-branch-matrix/matrix.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-static-ui-branch-matrix/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-absence-proof/manifest.json`

## Per-Target Frontend State

| Target | renderSurfaceReady | uiCallEntryReady | frontendConsumptionReady | runtimeUiStateReady | Current effect |
|---|---|---|---|---|---|
| `switch_account` | false | partial wrapper / invoke only | false | false | visible pure-switch UI remains blocked |
| `switch_account_and_restart_codex` | static true | static true | static true | false | consumer-start context only |
| `preview_account_import` | static true | static true | static true | false | best low-risk future runtime probe |
| `import_accounts_from_file` | static true | static true | static true | false | consumer-start context only |
| `export_accounts_to_file` | static true | static true | static true | false | consumer-start context only |
| `logout` | false | false wrapper only | false | false | no accounts-page terminal callsite |
| `remove_accounts` | static true | static true | static true | false | consumer-start context only |
| `begin_add_account_attach_monitor` | false | false wrapper only | false | false | no monitor lifecycle UI proof |
| `import_chatgpt_session_account` | static true | static true | static true | false | current 1.0.9 boundary, Gate 1 static ready only; strict/highest blocked |

## Findings

Five legacy rows have enough static frontend detail for the existing
consumer-start context: `switch_account_and_restart_codex`,
`preview_account_import`, `import_accounts_from_file`,
`export_accounts_to_file`, and `remove_accounts`. Static evidence covers their
visible dialog/confirm/error/toast branches, wrapper calls, argument keys, and
frontend consumption paths, but does not prove runtime UI-state.

Three legacy blockers remain frontend-incomplete:

- `switch_account`: the visible accounts-page switch route is
  `switch_account_and_restart_codex`; pure `switch_account` is only a wrapper /
  invoke contract for this proof state.
- `logout`: IPC wrapper exists, but the accounts page has no accepted terminal
  logout callsite or runtime UI-state.
- `begin_add_account_attach_monitor`: IPC wrapper exists, but the accounts page
  has no accepted terminal callsite or monitor lifecycle UI-state.

`import_chatgpt_session_account` is a real current 1.0.9 accounts frontend/IPC
boundary. The static frontend triplet is readable: dialog surface, paste /
textarea / overwrite checkbox / submit guard, wrapper args
`{ sessionJson, overwriteExisting }`, success/failure toast, dialog reset,
`onImported`, accounts refresh, and `quota-history` invalidation are mapped.
It is Gate 1 static ready only via
`ACCOUNTS-CHATGPT-CONSUMER-START-STATIC-CLOSURE-109.md`; direct IPC omitted/null
DTO semantics, exact envelopes, side-effect bytes, executed acceptance, and
platform closure remain strict/highest blockers.

## Gate Effect

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
