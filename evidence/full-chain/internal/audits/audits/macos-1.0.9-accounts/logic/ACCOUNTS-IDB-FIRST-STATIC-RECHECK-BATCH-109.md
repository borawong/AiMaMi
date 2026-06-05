# Accounts IDB-first Static Recheck Batch - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 IDB-first recheck batch
for returned worker lanes:

- `preview_account_import`
- `import_accounts_from_file`
- `export_accounts_to_file`
- `logout`
- `remove_accounts`
- `switch_account`
- `switch_account_and_restart_codex`

This reducer records crosschecked IDB owner/callsite/leaf facts and IDB
writeback status. It writes no raw/intermediate artifact, appends no
`INDEX.jsonl` row, edits no product code or rule/spec file, runs no product
test, and does not promote any gate.

## Evidence

- SOT binary root:
  `<source-location>/source-binary/`
- IDA source:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- IDA input universal SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Execution basis:
  IDB-first rules fused into `${CODEX_HOME:-$HOME/.codex}/skills/rust-reverse-pipeline/SKILL.md`.
  No extra tutorial path is an execution dependency.

## Preview Import Recheck

Static owner chain:

```text
wrapper 0x100105680
blocking body 0x10032c93c
core preview_import 0x1005dd788
parser 0x1005e13fc
registry read 0x1005e2b64
active-field read 0x1005e29f4
CoreEnvelope/body 0x1001db70c / 0x1001f6870
CoreError Display 0x10020c20c
```

Accepted static recheck:

- `argKeys` remains `filePath`.
- Parser error returns before registry/active-field/classification.
- Success payload fields and entry fields remain as recorded in existing
  preview-import reducers.
- Missing-path and parser-error branches are statically no-write before
  registry helper reads, but durable before/after byte proof remains missing.

Delta: no new static behavior gap was found. IDB comments were added to the
wrapper/body/owner/leaves/serializer/error formatter and saved.

## Import Accounts Recheck

Static owner chain:

```text
command body/callsite 0x10032d77c / 0x10032d97c
core import_accounts 0x1005dfb6c
parser 0x1005e13fc
registry keys 0x1005e2b64
active account 0x1005e29f4
write_atomic 0x1006729f8
registry rebuild 0x1005e7334
```

Accepted static recheck:

- `selectedKeys` absent imports all parsed entries.
- `selectedKeys` present builds a HashSet before registry/active reads; non-
  selected entries skip before validation/write.
- Existing field with `overwriteExisting=false` conflict-skips before snapshot
  write.
- Existing field with `overwriteExisting=true` and active-field match hits
  `ACTIVE_ACCOUNT_PROTECTED` before snapshot write.
- `write_atomic` success precedes `Repository::rebuild_registry`; rebuild
  failure can leave already written snapshots. This is a partial-write blocker,
  not rollback/no-rollback proof.

Delta: existing import reducers remain valid; this pass adds IDB comments and
confirms the partial-write/rebuild blocker.

## Export Accounts Recheck

Static owner chain:

```text
blocking command body 0x10032ce58
core-owner callsite 0x10032d0cc
core export_accounts 0x1005ddd0c
IPC success payload serializer 0x1001d4378
disk export JSON field cluster 0x1005dea90
filename suffix normalization 0x1005df3dc
write_atomic 0x1006729f8
parent dir sync helper 0x100672cc4
```

Accepted static recheck:

- `targetPath` wrapper copy and `accountKeys` option/vector storage are
  confirmed at the corrected blocking body.
- IPC success DTO is `AccountExportPayload` with `targetPath`,
  `accountCount`, `exportedAt`, and `skipped`.
- Disk export JSON DTO is distinct from the IPC success payload and remains
  covered by the core owner field cluster plus prior reducers.
- Filename normalization and `write_atomic` leaf remain statically covered.

Delta: this expands the preceding owner/callsite correction with the IPC
success payload serializer and write leaf crosscheck. Runtime export bytes and
write-failure residue remain missing.

## Logout Recheck

Static owner chain:

```text
wrapper 0x100330e20
Repository::logout 0x1005f1d84
auth copy callsite 0x1005f1e80
auth remove callsite 0x1005f1e98
registry load 0x1005e2e80
registry persist callsite 0x1005f1fec
clear_auto_switch_snooze 0x1005ea754
payload serializer 0x1001d8660
CoreError Display 0x10020c20c
```

Accepted static recheck:

- Request DTO has no args.
- Success payload is `authRemoved` and `authBackedUp`.
- `ensure_directories` and `persist_registry` can propagate command errors.
- Auth copy/remove failures are non-fatal and only affect booleans.
- Registry load failure defaults to an empty/default registry before active
  clear.
- Snooze clear is called twice; failures are dropped after persist success.

Delta: existing logout reducers remain valid; this pass tightens propagated
persist failure versus swallowed auth/snooze error wording.

## Remove Accounts Recheck

Static owner chain:

```text
dispatcher / DTO cluster 0x100105680
Tauri wrapper 0x100330a08
wrapper -> owner callsite 0x100330be8
Repository::remove_accounts 0x1005e4850
load_registry 0x1005e2e80
snapshot delete callsite 0x1005e4af8
persist_registry callsite 0x1005e4cf4
quota load/save 0x1001bc62c / 0x1001bc710
snooze clear callsites 0x1005e4d80 / 0x1005e4da4
payload serializer 0x1001d87a0
```

Accepted static recheck:

- Request DTO is `accountKeys`; runtime omitted/null/wrong-type/empty decode
  remains unexecuted.
- Success payload is `removedAccountKeys`, `removedCount`, and
  `previousAccountKey`.
- Active-account guard returns `Cannot remove the currently active account
  snapshot.` before delete/persist/quota/snooze.
- No-match returns `No accounts found for keys: ...` before
  delete/persist/quota/snooze.
- `remove_file` errors are best-effort / non-fatal static paths.
- Persist/quota/snooze failure after snapshot delete is a partial-delete
  rollback/no-rollback blocker.
- `clear_auto_switch_snooze` treats NotFound as success; other IO errors can
  form helper `CoreError`, but the owner static path drops them and continues.

Correction: `No local account registry found yet.` is not accepted as an
independently closed `remove_accounts` runtime terminal branch from this IDB
body. It remains a static cluster / runtime Unknown until an executed fixture
or stricter owner proof closes it.

## Switch Account / Switch Account And Restart Recheck

Static owner chain:

```text
switch_account wrapper 0x10030d734
switch_account_sync 0x1001e32c4
Repository::switch_account 0x1005e3cd0
SwitchPayload::serialize 0x1001d88d0
CoreEnvelope::ok_with_warnings 0x1001d8b84
owner switch_account_and_restart_sync 0x1001e6be4
Tauri/tokio wrapper 0x10030dd34
wrapper callsite 0x10030ddfc
tray callsite 0x1003326e8 / 0x100332708
rollback capture 0x1001e48d4
file capture leaf 0x1001e2d78
file restore leaf 0x1001e2f98
switch wrapper 0x1001e32c4
relaunch helper 0x1001e4794
stop process leaf 0x100674f50
launch process leaf 0x1006743ac
runtime snapshot 0x1001e6a1c
```

Accepted static recheck:

- `switch_account` side-effect order is registry metadata/load, registry field
  lookup, snapshot metadata, directory ensure, active auth backup, selected
  snapshot copy, registry active update/persist, auto-switch transient clear,
  auth reload/snapshot, quota load/find, and response with warnings.
- `SwitchPayload` serializes `previousAccountKey`, `activeAccountKey`,
  `activeAccount`, `authUpdated`, and `registryUpdated`.
- Capture happens before any switch mutation.
- Capture failure aborts before switch.
- Switch failure restores captured files, aggregates restore errors, refreshes
  snapshot, and returns a joined error string.
- Switch success plus relaunch success does not restore; refresh failure can
  append warning/error context.
- Relaunch failure restores captured files, attempts relaunch recovery, appends
  recovery failure if needed, refreshes snapshot, and returns joined error.
- Tray callsite is an alternate non-frontend callsite and not a frontend IPC
  substitute.

Delta: the existing switch/restart reducer remains valid; this pass adds
wrapper/tray xrefs, capture leaf, stop/launch leaves, and IDB writeback.

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

## Remaining Blockers

- Accepted same-version real WKWebView/Tauri IPC invocation.
- Exact runtime request/response/error transport envelopes.
- Omitted/null/wrong-type direct IPC decode envelopes.
- Auth/registry/quota/snooze/temp/source before-after byte fixtures.
- Partial-write and partial-delete rollback/no-rollback fixtures.
- Restart failure process observation and recovery fixture.
- Frontend runtime dialog/toast/loading/query-invalidation/UI state.
- Executed source archive acceptance mapping.
- Independent Windows 1.0.9 closure.
