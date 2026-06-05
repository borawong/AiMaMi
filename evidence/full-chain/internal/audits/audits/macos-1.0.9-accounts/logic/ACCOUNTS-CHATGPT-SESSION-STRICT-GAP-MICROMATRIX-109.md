# Accounts ChatGPT Session Strict Gap Micromatrix - AiMaMi 1.0.9

Scope: accounts-only micro-matrix for the current 1.0.9
`import_chatgpt_session_account` strict gap. This reducer is a fixture-shape and
proof-requirement conclusion only. It writes no raw evidence, appends no
`INDEX.jsonl` row, edits no regulation file, runs no product/main test, touches
no Windows evidence, and promotes no gate.

## Evidence Consumed

- `logic/ACCOUNTS-CHATGPT-SESSION-FRONTEND-DTO-SIDEEFFECT-STATIC-109.md`
- `logic/ACCOUNTS-CHATGPT-SESSION-IMPORT-DIFF-109.md`
- `logic/ACCOUNTS-CHATGPT-SESSION-BACKEND-PROOF-109.md`
- `logic/ACCOUNTS-CHATGPT-SESSION-HELPER-LEAF-PSEUDOCODE-109.md`
- `logic/ACCOUNTS-CHATGPT-SESSION-SUBHELPER-LEAF-PSEUDOCODE-109.md`
- `logic/ACCOUNTS-CHATGPT-SESSION-PERSISTENCE-LEAF-PSEUDOCODE-109.md`
- `logic/ACCOUNTS-DTO-ENVELOPE-GAP-MATRIX-109.md`
- `logic/ACCOUNTS-STATIC-ADVANCE-VS-RUNTIME-BLOCKER-109.md`

## Static Chain

Current static chain is sufficient for implementation planning only:

```text
frontend dialog/handler
  -> importChatGptSessionAccount(sessionJson, overwriteExisting = false)
  -> invoke("import_chatgpt_session_account", { sessionJson, overwriteExisting })
  -> command closure
  -> core::account_io::import_chatgpt_session
  -> convert_chatgpt_session_to_axonhub_auth
  -> field validation / registry reads / active account guard
  -> serde_json::to_vec_pretty
  -> write_atomic
  -> rebuild_registry
```

It does not prove live Tauri/Rust decode behavior, exact transport envelopes,
durable bytes, frontend runtime state, executed acceptance, or Windows closure.

## Minimal Runtime Fixture Rows

| Fixture id | Purpose | Static evidence binding | Runtime proof required | Gate effect |
|---|---|---|---|---|
| `accounts.import_chatgpt_session_account.sessionJson_omitted.v1` | Direct IPC DTO decode for omitted required session payload | frontend wrapper normally supplies `sessionJson`; direct IPC gap recorded in DTO matrix | accepted IPC harness, exact request body, exact Tauri/Rust decode envelope, no auth/registry/temp mutation bytes, UI/error consumption or accepted callback, PASS/FAIL | no promotion until executed |
| `accounts.import_chatgpt_session_account.sessionJson_null.v1` | Direct IPC DTO decode for explicit null session payload | static UI never sends null after trim guard; backend parse path does not own Tauri decode | accepted IPC harness, exact request body, exact decode/error envelope, no-write bytes, UI/error consumption, PASS/FAIL | no promotion until executed |
| `accounts.import_chatgpt_session_account.overwriteExisting_omitted_or_null.v1` | Default/null boundary for `overwriteExisting` direct IPC | JS wrapper default `false` is frontend-only; static proof cannot prove Tauri/Rust default/null behavior | accepted IPC harness, two exact request bodies if split, exact decode/default/error envelope, no-write bytes for invalid session payload or controlled conflict, PASS/FAIL | no promotion until executed |
| `accounts.import_chatgpt_session_account.existing_conflict_no_overwrite.v1` | Conflict/no-write branch for existing non-active account with overwrite false | static error/side-effect proof records existing-account conflict and active-account guard | accepted IPC harness, valid fixture session JSON, exact conflict envelope, auth/registry/temp before-after bytes proving no committed overwrite, frontend toast state, PASS/FAIL | no promotion until executed |
| `accounts.import_chatgpt_session_account.non_active_overwrite_write_rebuild.v1` | Positive overwrite side-effect branch for non-active account | static persistence proof reaches `write_atomic` then `rebuild_registry` | accepted IPC harness, valid fixture, exact success envelope, auth snapshot bytes, registry rebuild bytes, temp residue/cleanup bytes, UI refresh and `quota-history` invalidation state, PASS/FAIL | no promotion until executed |

The first three rows are DTO/envelope probes. The last two rows are
conflict/overwrite side-effect probes. All rows require the same accepted
same-version AiMaMi 1.0.9 WKWebView/Tauri IPC harness before they can affect
strict evidence.

## Still Missing For Strict

- direct IPC omitted/null/default decode semantics;
- exact success/error/CoreError transport bytes for invalid JSON, missing
  `accessToken`, missing account id, id-sensitive-field build failure, invalid converted
  field, conflict, active-account overwrite rejection, write failure, and rebuild
  failure;
- auth snapshot, registry, temp atomic-file, and rebuild before/after bytes;
- `write_atomic` failure residue;
- rebuild failure after snapshot write partial-write / rollback-no-rollback
  proof;
- frontend toast/dialog reset/refresh/query invalidation runtime state;
- executed source archive acceptance id with PASS/FAIL and reducer acceptance boolean;
- independent Windows closure.

## Gate Effect

No promotion.

- `consumerStartReady`: accounts remains `9/9` Gate 1 static context only.
- `consumerStartBlocked`: accounts remains `0/9` for Gate 1 static context only.
- `strictImplementationUse`: `0/9`.
- `readyToImplement`: `0/9`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

This reducer does not change the selected global accounts next lane:
`accounts.preview_account_import.missing_path.v1` remains first because it is
lower risk and no-write by design. The ChatGPT session rows are queued after
accepted IPC harness reachability is proven.
