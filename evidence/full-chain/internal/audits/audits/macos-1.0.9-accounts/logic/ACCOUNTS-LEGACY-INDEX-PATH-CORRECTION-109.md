# Accounts Legacy INDEX Path Correction - AiMaMi 1.0.9

Scope: accounts-only path-governance correction for legacy `INDEX.jsonl` rows
that predate the current one-module-one-folder rule.

This reducer writes no raw evidence, appends no `INDEX.jsonl` row, edits no
regulation file, and promotes no gate. It exists so current consumers and
validators do not treat historical module-outside accounts rows as active raw
locations.

## Correction

The following historical `INDEX.jsonl` rows are superseded for current accounts
consumption:

| Historical line | Historical path problem | Current replacement |
|---:|---|---|
| 415 | `module=accounts` but path under `legacy misplaced switch_account raw prefix` | line 450 under `intermediate/aimami/1.0.9/macos/accounts/legacy-leaf-diagnostics/switch_account/visible-pure-switch-uistate/summary.json` |
| 416 | `module=accounts` but path under `legacy misplaced logout raw prefix` | line 452 under `intermediate/aimami/1.0.9/macos/accounts/legacy-leaf-diagnostics/logout/blocked-runtime-unavailable/summary.json` |
| 417 | `module=accounts` but path under `legacy misplaced begin_add_account_attach_monitor raw prefix` | line 453 under `intermediate/aimami/1.0.9/macos/accounts/legacy-leaf-diagnostics/begin_add_account_attach_monitor/runtime-lifecycle-probe/manifest.json` |
| 421 | `module=accounts` but path under `legacy misplaced switch_account raw prefix` | line 451 under `intermediate/aimami/1.0.9/macos/accounts/legacy-leaf-diagnostics/switch_account/visible-pure-switch-uistate-found-app/manifest.json` |

The historical dated workorder row 376 is also superseded for current
consumption by line 448:

`intermediate/aimami/1.0.9/macos/accounts/accounts-runtime-acceptance-workorder/manifest.json`

## Current Active Rule

For current accounts consumers, the only active legacy diagnostics root is:

`<source-location>/intermediate/aimami/1.0.9/macos/accounts/legacy-leaf-diagnostics/`

The old module-outside rows are retained only as historical append-only ledger
entries. They must not be used as active scratch, raw, pointer, reducer, or
implementation evidence paths.

## Gate Effect

No promotion.

- `strictImplementationUse`: `0` for accounts.
- `readyToImplement`: `0` for accounts.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

This is a path-governance and consumer-disambiguation reducer only.
