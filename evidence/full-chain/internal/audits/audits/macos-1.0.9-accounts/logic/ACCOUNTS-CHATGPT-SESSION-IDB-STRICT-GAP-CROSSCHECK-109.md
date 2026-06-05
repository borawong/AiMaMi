# Accounts ChatGPT Session IDB Strict Gap Crosscheck - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 IDB-first crosscheck for
`import_chatgpt_session_account`.

This reducer records owner/body/xrefs/interface/side-effect facts from the
current IDB. It writes no raw/intermediate artifact, appends no `INDEX.jsonl`
row, edits no product code or rule/spec file, runs no product test, and does
not promote any gate.

## Evidence

- SOT binary root:
  `<source-location>/source-binary/`
- IDA source:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- IDA input universal SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Execution basis:
  IDB-first rules fused into `${CODEX_HOME:-$HOME/.codex}/skills/rust-reverse-pipeline/SKILL.md`.

## Owner / Entry / Leaf Chain

IDA static chain:

```text
Tauri invoke wrapper / command cluster 0x100105680
  command string cluster includes import_chatgpt_session_account and sessionJson

blocking command body 0x10032dbf0
  StateManager::try_get
  repo mutex lock / poisoned-lock branch
  sessionJson bytes from request storage
  overwriteExisting bool from request storage
  call core import_chatgpt_session at 0x1005e1d6c
  CoreError Display -> Err<String>

core import_chatgpt_session 0x1005e1d6c
  convert_chatgpt_session_to_axonhub_auth 0x100625bc4
  CodexPaths::ensure_directories 0x1005267f8
  is_valid_account_key 0x1005e1c78
  read_registry_or_empty_keys 0x1005e2b64
  read_active_account_key 0x1005e29f4
  make_snapshot_path 0x1005e17fc
  serde_json::to_vec_pretty 0x1005db5d8
  write_atomic callsite 0x1005e2250 -> 0x1006729f8
  rebuild_registry callsite 0x1005e2278 -> 0x1005e7334
  rebuild-error mapper 0x1005e2974

ChatGptSessionImportPayload::serialize 0x1001d704c
```

Xrefs confirm `0x1005e1d6c` is called from the blocking command body at
`0x10032dd64`, and `0x10032dbf0` is polled by the Tokio blocking task at
`0x10014c838`.

## Interface / DTO

Static interface facts:

- frontend command cluster contains `import_chatgpt_session_account` and
  `sessionJson`;
- blocking body passes `sessionJson` bytes plus an `overwriteExisting` boolean
  into the core owner;
- wrapper poisoned-lock branch returns
  `poisoned lock: another task failed inside`;
- repository/core errors are formatted through `CoreError Display` into
  `Err<String>`.

`ChatGptSessionImportPayload::serialize @ 0x1001d704c` emits nine fields in
static order:

```text
imported
accountKey
email
plan
snapshotPath
registryAccountCount
activeAccountKey
refreshTokenPlaceholder
note
```

This matches and reinforces the existing payload serializer reducer; it does
not replace runtime envelope proof.

## Static Branch / Side-effect Facts

Accepted static branch order:

- `convert_chatgpt_session_to_axonhub_auth` runs first and can fail before any
  account snapshot write;
- invalid converted account field fails after `ensure_directories` but before
  registry/active-field conflict writes;
- registry field presence plus `overwriteExisting=false` returns
  `Account already exists locally. Enable overwrite to replace its saved snapshot.`
  before snapshot write;
- active-account overwrite returns
  `Cannot overwrite the currently active account snapshot.` before snapshot
  write;
- `serde_json::to_vec_pretty` failure occurs before `write_atomic`;
- `write_atomic` failure prevents `rebuild_registry`;
- successful `write_atomic` precedes `Repository::rebuild_registry`.

Strict implication: a `rebuild_registry` failure after `write_atomic` is a
partial-write blocker. Static IDB proves ordering, not rollback/no-rollback
bytes.

## IDB Writeback

Inline IDB comments were written at:

- `0x10032dbf0`: blocking command body;
- `0x1005e1d6c`: core owner;
- `0x100625bc4`: ChatGPT session conversion leaf;
- `0x1001d704c`: success payload serializer;
- `0x1005e2250`: `write_atomic` callsite;
- `0x1005e2278`: `rebuild_registry` callsite;
- `0x1005e2974`: rebuild-error mapping closure.

`idb_save` returned OK for the active IDB.

## Still Missing Before Strict

- exact runtime request and response IPC envelope bytes;
- direct IPC omitted/null/default decode behavior for `sessionJson` and
  `overwriteExisting`;
- runtime values for every `ChatGptSessionImportPayload` field under accepted
  fixtures;
- malformed JSON, missing-sensitive-field, missing-account-id, conflict, active-overwrite,
  write-failure, and rebuild-failure exact runtime envelopes;
- auth snapshot, registry, temp, and rebuild before/after bytes;
- no-write and partial-write rollback/no-rollback fixtures;
- frontend dialog/toast/query-invalidation runtime state;
- executed source archive acceptance mapping;
- independent Windows closure.

## Gate Effect

- `consumerStartReady`: unchanged, Gate 1 static context only.
- `strictImplementationUse`: false / `0`.
- `readyToImplement`: false / `0`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Accounts remains the active locked module. This reducer does not permit
switching to plugins, relay, system, or tray.
