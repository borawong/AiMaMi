# Accounts DTO / Envelope Gap Matrix - AiMaMi 1.0.9

Scope: accounts-only DTO, null/default, response/error envelope, and
side-effect-byte gap reducer for AiMaMi 1.0.9 macOS.

This reducer consumes existing frontend wrapper evidence, static backend
pseudocode reducers, static error/side-effect maps, and non-executed fixture
drafts. It creates no raw evidence, appends no `INDEX.jsonl` row, edits no
regulation file, runs no product test, and promotes no gate.

## Evidence Consumed

- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/ipc-contracts.jsonl`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/frontend-control-flow.jsonl`
- `interfaces/CURRENT-INTERFACE-BOUNDARY-109.md`
- `logic/ACCOUNTS-PREVIEW-IMPORT-STATIC-BOUNDARY-109.md`
- `logic/ACCOUNTS-PREVIEW-IMPORT-STRICT-STATIC-BOUNDARY-109.md`
- `logic/ACCOUNTS-PREVIEW-IMPORT-COMMAND-DTO-STATIC-109.md`
- `logic/ACCOUNTS-PREVIEW-IMPORT-PAYLOAD-SERIALIZATION-STATIC-109.md`
- `logic/ACCOUNTS-PREVIEW-IMPORT-CORE-ENVELOPE-STATIC-109.md`
- `logic/ACCOUNTS-CHATGPT-SESSION-IMPORT-DIFF-109.md`
- `logic/ACCOUNTS-STATIC-ERROR-SIDEEFFECT-MAP-109.md`
- `logic/ACCOUNTS-BACKEND-SIDEEFFECT-GAP-REFINEMENT-109.md`
- `logic/ACCOUNTS-ACCEPTANCE-COVERAGE-109.md`

## Matrix

| Target | Frontend DTO shape | Static defaults / null handling | Static error / envelope hint | Runtime envelope / byte gap |
|---|---|---|---|---|
| `switch_account` | `{ accountKey }` from global `We.switchAccount(accountKey)` wrapper; accounts page has no accepted visible pure-switch terminal callsite. | No accepted UI default. Direct IPC omitted/null `accountKey` is not executed. | Static backend map has `Snapshot file missing: ...`. | Exact success/error envelope, active account registry/auth/quota bytes, rollback/no-rollback, and visible pure-switch UI-state are missing. |
| `switch_account_and_restart_codex` | `{ accountKey }` from `switchAccountAndRestartCodex(accountKey)` wrapper. | No accepted omitted/null runtime semantics for `accountKey`. | Static restart strings include `Codex restart failed: ...`, `Rollback failed: ...`, and `Codex recovery failed: ...`. | Exact restart/recovery envelope, process/restart observation, file restore bytes, and executed acceptance are missing. |
| `preview_account_import` | `{ filePath }` from `previewAccountImport(filePath)`. UI file picker supplies a string path; cancel is swallowed before command call. IDA static command wrapper evidence confirms command name `preview_account_import`, field `filePath`, field length `8`, and `CommandArg::from_command` decode before command body execution. | Direct IPC omitted/null `filePath` is a pre-command Tauri/serde decode boundary; UI does not supply omitted/null. Static fixture matrix now classifies `valid_file_preview`, `invalid_json`, 
on_utf8`, `missing_path`, `filePath_omitted`, and `filePath_null`. 
on_utf8` is not independently closed as a text-decode class by static proof; it falls under byte-read plus JSON/backup decode unless runtime proves a distinct envelope. | Accepted homebrew pseudocode proves metadata/read/JSON/backup validation branches for preview classification and early missing-path failure direction. IDA wrapper/body evidence confirms `StateManager::try_get`, state lock, copied decoded path bytes into `preview_import`, `CoreError` display on error, and `CoreEnvelope<T>::ok` on success. IDA success envelope evidence statically reduces `schemaVersion=1`, `success=true`, `code=ok`, `message=Success`, empty `warnings`, and `data`. IDA payload serializer evidence confirms static success payload keys `filePath`, `schemaVersion`, `kind`, `appVersion`, `exportedAt`, `exportedHostname`, `accountCount`, 
ewCount`, `conflictCount`, and `entries`, with entry keys `accountKey`, `email`, `plan`, `authMode`, `workspaceName`, `profileName`, `conflict`, and `isActiveLocally`. Failed `ghidra/pseudocode/` stubs are rejected. Static success path is preview-only and points to no commit/write, but exact no-write bytes are still not proved. | Exact live Tauri success/error transport bytes, omitted/null/wrong-type `filePath` decode behavior, invalid JSON/non-UTF8 envelope distinction, no-write before/after bytes, dialog/toast runtime state, and fixture PASS/FAIL are missing. |
| `import_accounts_from_file` | `{ filePath, overwriteExisting, selectedKeys: selectedKeys ?? null }`. | Wrapper converts omitted/undefined `selectedKeys` to 
ull`; runtime null/empty/some semantics are not executed. `overwriteExisting` has no accepted omitted/null direct IPC semantics. | Static map has `Rebuild registry failed: ...`; commit path includes directory, snapshot, atomic write, and registry rebuild callsites. | Exact conflict/import/parse/write envelopes, before/after auth/registry/quota bytes, partial-write vs rollback behavior, and executed acceptance are missing. |
| `export_accounts_to_file` | `{ targetPath, accountKeys: accountKeys ?? null }`. | Wrapper converts omitted/undefined `accountKeys` to 
ull`; runtime null/empty/missing semantics are not executed. | Static strings include `No AiMaMi account registry found yet` and `No accounts to export`; write path reaches serialization and `write_atomic`. | Exact export payload bytes, overwrite/write failure envelope, temp/no-write residue, frontend close/toast state, and executed acceptance are missing. |
| `logout` | no-arg `logout()` wrapper only. No accounts-page terminal callsite. | No input fields. Active/no-active state is runtime-only. | No accepted command-specific static error string; static callsites include directory, copy, remove, and success envelope construction. | Exact active/no-active envelope, auth backup/delete bytes, snooze/registry bytes, terminal UI-state, and executed acceptance are missing. |
| `remove_accounts` | `{ accountKeys }` from `removeAccounts(accountKeys)`. | No accepted omitted/null/empty direct IPC semantics for `accountKeys`; active-account disabled state is static UI only. | Static strings include `Cannot remove the currently active account snapshot.` and `No local account registry found yet.` | Exact missing-field/no-registry/partial-delete/quota failure envelopes, delete/skip bytes, destructive dialog runtime state, and executed acceptance are missing. |
| `begin_add_account_attach_monitor` | no-arg `beginAddAccountAttachMonitor()` wrapper string only; no accounts-page terminal callsite or frontend CCF row. | No input fields. Lifecycle state is runtime/native-callback only. | Static strings include `failed to spawn thread` and `poisoned lock: another task failed inside`; static side-effect is snapshot load and thread spawn closure. | Monitor start/reentry/event/completion/cancel/timeout/error envelopes, lifecycle bytes/state, accepted callback substitute, and executed acceptance are missing. |
| `import_chatgpt_session_account` | `{ sessionJson, overwriteExisting }`; JS wrapper default is `(sessionJson, overwriteExisting = false)`. Accounts UI submits trimmed textarea text and checkbox value. | Empty trimmed UI input returns before IPC. Direct IPC omitted/null `sessionJson` and omitted/null `overwriteExisting` are draft-only. JSON 
ull` / JSON string literal behavior is not executed. | Static errors include missing `accessToken`, missing account id, no-overwrite conflict, and active-account overwrite rejection. Conversion helper accepts camelCase and snake_case sensitive-field/account variants. | Exact success/error envelope, runtime decode/null/default behavior, auth snapshot bytes, registry rebuild bytes, temp/rollback/no-write bytes, frontend toast/refresh state, and executed acceptance are missing. |

## Strict Interpretation

Static wrapper defaults are not runtime DTO proof:

- `selectedKeys ?? null` and `accountKeys ?? null` prove frontend wrapper shape
  only; they do not prove Rust/Tauri decode behavior for omitted, explicit
  
ull`, empty array, or malformed direct IPC payloads.
- `overwriteExisting = false` in the JS wrapper proves the frontend default for
  wrapper callers only; direct IPC omitted/null behavior remains runtime-only.
- UI guards that stop empty text before IPC do not prove backend envelope
  behavior for direct IPC omitted/null payloads.
- `preview_account_import` static fixture classification improves branch design
  but does not prove Tauri pre-command decode envelopes for omitted/null
  `filePath`, does not prove 
on_utf8` as a distinct runtime class, and does
  not prove no-write bytes.
- `preview_account_import` payload serialization is now statically reduced for
  success-field shape only; it is not runtime envelope proof and does not prove
  warning/error empty-vs-omitted runtime bytes.
- `preview_account_import` success CoreEnvelope is now statically reduced for
  `schemaVersion/success/code/message/warnings/data`; the error side is only
  reduced to `CoreError Display -> Err<String>`, not live Tauri error bytes.
- Static error strings are not exact runtime envelopes.
- Static write/delete/copy/rebuild callsites are not before/after byte proof.

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

This matrix is implementation-planning input and fixture-design input only. It
does not promote accounts to strict/highest gate and does not allow switching to
plugins, relay, system, or tray.
