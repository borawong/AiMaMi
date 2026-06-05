# Accounts ChatGPT Session Current Boundary Rollup - AiMaMi 1.0.9

Scope: `import_chatgpt_session_account` accounts-only current boundary for
AiMaMi 1.0.9 macOS. This file is a lightweight internal rollup of already
reduced static evidence plus same-session IDA recheck notes. It writes no raw
leaf, appends no `INDEX.jsonl` row, and promotes no gate.

## Evidence Consumed

- `logic/ACCOUNTS-CHATGPT-SESSION-FRONTEND-DTO-SIDEEFFECT-STATIC-109.md`
- `logic/ACCOUNTS-CHATGPT-SESSION-BACKEND-PROOF-109.md`
- `logic/ACCOUNTS-CHATGPT-SESSION-FIELD-ERROR-IDACROSSCHECK-109.md`
- `logic/ACCOUNTS-CHATGPT-SESSION-HELPER-LEAF-PSEUDOCODE-109.md`
- `logic/ACCOUNTS-CHATGPT-SESSION-SUBHELPER-LEAF-PSEUDOCODE-109.md`
- `logic/ACCOUNTS-CHATGPT-SESSION-PERSISTENCE-LEAF-PSEUDOCODE-109.md`
- `logic/ACCOUNTS-CHATGPT-SESSION-IMPORT-PAYLOAD-SERIALIZER-STATIC-109.md`
- `logic/ACCOUNTS-CHATGPT-SESSION-STRICT-GAP-MICROMATRIX-109.md`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/import-chatgpt-session-account-acceptance-draft/targets/fixture-rows.jsonl`
- IDA MCP current session recheck against source SHA
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`.

## Static Boundary Facts

Frontend current boundary:

- Packaged frontend exposes wrapper `importChatGptSessionAccount(sessionJson,
  overwriteExisting=false)` and terminal invoke
  `import_chatgpt_session_account` with `{ sessionJson, overwriteExisting }`.
- Accounts add-account session dialog trims textarea input and returns before
  IPC on empty input.
- Open, paste, overwrite checkbox, cancel, and import controls are statically
  disabled or guarded while submitting.
- Success consumes returned refresh-sensitive-field placeholder and email in toast copy,
  closes dialog, resets local state, calls the parent imported callback,
  refreshes the accounts list, and invalidates `quota-history`.
- Failure and paste failure show destructive toasts. Direct IPC omitted/null
  DTO semantics are not covered by the UI guard.

Backend current boundary:

- IDA owner command body: `0x10032dbf0`.
- Core import owner: `0x1005e1d6c`.
- Session conversion leaf: `0x100625bc4`.
- Payload serializer leaf: `0x1001d704c`.
- Auth snapshot write callsite: `0x1005e2250`.
- Registry rebuild callsite: `0x1005e2278`.
- The command body copies `sessionJson` and `overwriteExisting`, locks the
  account repository state, calls the core import owner, maps `CoreError`
  display text into command error, and returns through the Tauri command
  envelope path.
- Static leaf reductions cover JSON parsing, session field aliases, missing
  sensitive-field/account id errors, id-sensitive-field construction failure, account-field
  validation, overwrite conflict, active-account overwrite rejection, snapshot
  serialization, atomic write, and registry rebuild ordering.

Side-effect ordering:

- Static persistence order is auth snapshot write before registry rebuild.
- A registry rebuild failure after a successful write is a partial-write risk
  until runtime before/after bytes prove rollback or no-rollback behavior.
- Invalid JSON and conversion failures are static no-write candidates, but
  runtime no-write bytes and exact error envelopes are still required.

## Acceptance Draft Status

The current fixture draft has 14 rows covering happy path, invalid JSON,
missing sensitive-field/account id, id-sensitive-field build failure, overwrite conflict,
active-account overwrite rejection, invalid field, write failure, `sessionJson`
omitted/null, and `overwriteExisting` omitted/null. The rows now carry:

- row-level source binary SHA;
- current accounts audit entrypoint;
- current accounts reducer pointer;
- same-version backend/static frontend pointers;
- source archive acceptance id;
- structured no-promotion object;
- `reducer_acceptance_required=true`.

All fixture rows remain unexecuted and `PASS_FAIL=FAIL until executed trace is
reduced and accepted`.

## Runtime-only Blockers

The following cannot be closed from static IDA/frontend evidence:

- accepted WKWebView/Tauri IPC harness proof that reaches AiMaMi Tauri
  internals;
- exact runtime request body and success/error/CoreError envelopes;
- omitted/null/default DTO deserialization behavior;
- before/after auth, registry, quota, snooze, temp, and source/import/export
  bytes;
- rollback/no-rollback residue for write and rebuild failures;
- rendered toast/dialog/loading/disabled/query invalidation state;
- executed source archive acceptance PASS/FAIL and reducer acceptance;
- independent same-platform closure where required by the active task plan.

Current runtime blocker:

`sot_app_present_but_no_accepted_ipc_runtime_harness_or_executed_accounts_acceptance_trace`

## Gate Effect

No promotion.

```json
{
  "consumerStartReady": true,
  "strictImplementationUse": false,
  "readyToImplement": false,
  "implementation_use": false,
  "gate_accepted": false,
  "full_leaf_100": false,
  "moduleExitAllowed": false
}
```
