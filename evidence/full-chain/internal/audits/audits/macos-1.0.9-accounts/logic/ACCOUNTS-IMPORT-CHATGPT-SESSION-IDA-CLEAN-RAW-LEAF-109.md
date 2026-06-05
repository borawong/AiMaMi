# Accounts import_chatgpt_session_account IDA clean raw leaf - 1.0.9

## Decision

`import_chatgpt_session_account` now has a clean same-version macOS raw leaf under:

`<source-location>/raw/aimami/1.0.9/macos/accounts/import_chatgpt_session_account/`

The raw leaf is limited to IDA MCP backend evidence and packaged frontend extraction evidence. Historical generated traversal and validation outputs were moved to:

`<source-location>/intermediate/aimami/1.0.9/macos/accounts/import_chatgpt_session_account/`

## Threading First

- Tokio blocking poll: `0x10014c838`
- Poll callsite: `0x10014c92c`
- Command body: `0x10032dbf0`
- Core owner: `0x1005e1d6c`
- The frontend command is not handled on the UI render thread; the command body locks account repository state and calls the core owner under that lock.

## Frontend Boundary

Packaged frontend extraction confirms:

- `ipc-contracts.jsonl:13`
- wrapper `importChatGptSessionAccount`
- command `import_chatgpt_session_account`
- arg keys `sessionJson`, `overwriteExisting`
- default `overwriteExisting=false`
- `frontend-control-flow.jsonl:8` points to accounts page chunk `assets/accounts-page-CJFT2P5o.js` and success/failure toast i18n keys.

## Backend Boundary

IDA evidence closes:

- conversion leaf `0x100625bc4`: parses ChatGPT session JSON into Codex-compatible auth data and fails before side effects on malformed/missing fields.
- directory/field/registry guards before write: `0x1005e1ef0`, `0x1005e1f2c`, `0x1005e1f3c`, `0x1005e1f4c`.
- existing account conflict branch: `0x1005e21e4`.
- active account overwrite guard: `0x1005e20ec`.
- snapshot path and serialization: `0x1005e2140`, `0x1005e2164`.
- atomic snapshot write: `0x1005e2250`.
- registry rebuild after write: `0x1005e2278`.
- rebuild error mapper: `0x1005e2974`.

Important implementation boundary: snapshot write happens before registry rebuild. A registry rebuild failure after a successful write remains a partial-write strict blocker until runtime fixture coverage accepts the side-effect residue.

## INDEX

Global `INDEX.jsonl` already has exact-field rows `518` and `521` for `aimami/1.0.9/macos/accounts/import_chatgpt_session_account`. This cleanup did not append a third duplicate row.

## Gate Effect

No consumer gate promotion:

```json
{
  "consumerStartReady": false,
  "consumerStartBlocked": true,
  "strictImplementationUse": false,
  "readyToImplement": false,
  "implementation_use": false,
  "gate_accepted": false,
  "full_leaf_100": false,
  "moduleExitAllowed": false
}
```

Remaining blockers: runtime IPC request/response bytes, exact output payload envelope, side-effect before/after bytes including write-then-rebuild failure, live UI state, executed acceptance, and Windows same-version closure.
