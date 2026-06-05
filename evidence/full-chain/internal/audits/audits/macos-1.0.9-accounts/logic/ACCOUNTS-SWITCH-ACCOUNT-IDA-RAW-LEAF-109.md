# Accounts Switch Account IDA Raw Leaf - 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 reducer for the clean raw
IDA leaf bundle of `switch_account`.

This reducer consumes:

- `<source-location>/raw/aimami/1.0.9/macos/accounts/switch_account/manifest.json`
- canonical `INDEX.jsonl` row `724`

It does not edit product code, does not run product tests, does not execute
runtime IPC, and does not promote any consumer gate.

## Raw Leaf

- command: `switch_account`
- raw path: `<source-location>/raw/aimami/1.0.9/macos/accounts/switch_account/`
- source binary SOT:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi`
- source SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- raw manifest SHA-256:
  `9f600a70df1846471598fba468f7bcb2a52a6530a429a9eafdsource archive058b14878970`

## IDA Chain

IDA health was OK against the same source SHA, with auto-analysis and Hex-Rays
ready.

| Role | Address | Symbol / fact |
|---|---:|---|
| blocking task poll | `0x10030d734` | Tokio blocking task for `switch_account` |
| blocking callsite | `0x10030d7fc` | calls `switch_account_sync` |
| sync wrapper | `0x1001e32c4` | `codexmate_lib::commands::accounts::switch_account_sync` |
| wrapper callsite | `0x1001e3444` | direct call to `Repository::switch_account` |
| core owner | `0x1005e3cd0` | `Repository::switch_account` |
| restart reuse | `0x1001e6cc4` | `switch_account_and_restart_sync` reuses `switch_account_sync` |
| pending auto-switch reuse | `0x1005eec40` | `confirm_pending_auto_switch` reaches the same core owner |
| payload serializer | `0x1001d88d0` | `SwitchPayload::serialize` |
| persist helper | `0x1005e6460` | `Repository::persist_registry` |
| transient clear helper | `0x1005f028c` | `Repository::clear_auto_switch_transient_state` |

IDB comments were written at the wrapper, owner, and field callsites, and
`idb_save` returned OK.

## Frontend / IPC Chain

- frontend CCF: `frontend-control-flow.jsonl` row `15`
- frontend IPC: `ipc-contracts.jsonl` row `3`
- wrapper contract:
  `switchAccount(accountKey) -> invoke("switch_account", { accountKey })`
- UI asset:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/index-CL22l5v8.js`

## Static Behavior

The sync wrapper locks repository state, handles poisoned-lock errors, forwards
`accountKey` to the core owner, formats `CoreError` through Display, and returns
`CoreEnvelope<SwitchPayload>`.

The core owner statically proves this order:

```text
registry metadata + load_registry
  -> accountKey byte-match lookup
  -> selected auth snapshot metadata
  -> ensure_directories
  -> optional active-auth backup copy
  -> selected snapshot copy over active auth
  -> update active registry item
  -> persist_registry
  -> clear_auto_switch_transient_state
  -> load_auth_file + make_auth_snapshot
  -> quota load/find
  -> make_account_summary_from_item
  -> ok_with_warnings(SwitchPayload)
```

Branch facts:

- missing registry returns `No AiMaMi registry exists yet`;
- account-field miss formats `Account not found: <accountKey>`;
- missing selected snapshot formats `Snapshot file missing: <path>`;
- directory, active-auth backup copy, selected-auth copy, registry persist,
  auth reload, and snapshot errors propagate;
- auto-switch transient clear runs after registry persistence, but the plain
  switch path drops a non-success clear result;
- success returns `CLIENT_RESTART_RECOMMENDED` warning with the restart
  recommendation text;
- `SwitchPayload` serializes `previousAccountKey`, `activeAccountKey`,
  `activeAccount`, `authUpdated`, and `registryUpdated`.

## Remaining Strict Gaps

This raw leaf strengthens the backend owner/body/call-tree/interface dimension,
but accounts strict/highest gates remain blocked by:

- exact runtime IPC request/response/error envelopes for omitted/null/wrong-type
  `accountKey`;
- exact auth/registry/quota/transient before-after bytes;
- rollback/no-rollback residue for copy, persist, auth reload, and snapshot
  failure points;
- rendered frontend toast/query/dialog state under live fixtures;
- executed source archive acceptance mapping;
- independent Windows closure.

## Gate Effect

- `consumerStartReady`: unchanged.
- `strictImplementationUse`: `0/9`.
- `readyToImplement`: `0/9`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Do not switch modules based on this reducer.
