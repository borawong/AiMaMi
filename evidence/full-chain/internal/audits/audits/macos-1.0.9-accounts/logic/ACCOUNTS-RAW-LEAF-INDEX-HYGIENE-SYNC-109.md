# ACCOUNTS-RAW-LEAF-INDEX-HYGIENE-SYNC-109

Status: `accepted_accounts_raw_leaf_index_hygiene_sync_no_promotion`

Produced at: `2026-06-02T23:12:00+08:00`

Scope: AiMaMi `1.0.9` macOS accounts only.

Current reducer:
`logic/ACCOUNTS-IDB-WRITEBACK-CURRENT-SYNC-109.md`

## What Changed

The 9 macOS accounts raw leaf bundles already existed with the required clean
7-file template. This sync normalized their current metadata and index state:

- removed non-macOS blocker wording from the macOS raw leaf text files
- added top-level no-promotion booleans to each raw `manifest.json`
- added `platformBoundary=macos_only`
- added current IDB writeback pointer and `idb_saved=true`
- refreshed `validation/result.json` checks
- refreshed `file-manifest.json`
- appended exactly one missing canonical `INDEX.jsonl` row for
  `aimami/1.0.9/macos/accounts/import_accounts_from_file`
- repaired one pre-existing malformed `INDEX.jsonl` line by splitting two
  concatenated JSON objects into separate JSONL rows

No duplicate index row was appended for existing exact keys. Existing duplicate
exact keys for `preview_account_import` and `import_chatgpt_session_account`
were left as historical index state and were not expanded.

## Raw Leaf Coverage

All 9 required accounts targets have the clean raw template:

- `raw/aimami/1.0.9/macos/accounts/switch_account/`
- `raw/aimami/1.0.9/macos/accounts/switch_account_and_restart_codex/`
- `raw/aimami/1.0.9/macos/accounts/preview_account_import/`
- `raw/aimami/1.0.9/macos/accounts/import_accounts_from_file/`
- `raw/aimami/1.0.9/macos/accounts/export_accounts_to_file/`
- `raw/aimami/1.0.9/macos/accounts/logout/`
- `raw/aimami/1.0.9/macos/accounts/remove_accounts/`
- `raw/aimami/1.0.9/macos/accounts/begin_add_account_attach_monitor/`
- `raw/aimami/1.0.9/macos/accounts/import_chatgpt_session_account/`

Each bundle contains:

- `AI.md`
- `README.md`
- `SYSTEM-DIFF.md`
- `audits/<command>-ida-closure.json`
- `validation/result.json`
- `file-manifest.json`
- `manifest.json`

## Validation

Validated:

- raw leaf 7-file template exists for 9/9 targets
- raw leaf JSON / JSONL parse passes
- canonical `INDEX.jsonl` parses after the malformed-line split
- exact index count is nonzero for 9/9 accounts raw leaf keys
- current raw/internal surface has no non-macOS blocker wording
- top-level raw manifest gate booleans remain false
- `idb_saved=true` is present in raw manifest and validation metadata

## Gate Effect

No promotion and no module switch:

```json
{
  "strictImplementationUse": false,
  "readyToImplement": false,
  "implementation_use": false,
  "gate_accepted": false,
  "full_leaf_100": false,
  "moduleExitAllowed": false
}
```
