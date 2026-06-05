# Accounts Remove Accounts Payload Serialization Static 1.0.9

Scope: AiMaMi 1.0.9 macOS `remove_accounts` command wrapper and success
payload serialization.

This reducer uses IDA Pro MCP HTTP-mode static evidence from the current
AiMaMi 1.0.9 IDB:

`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

It writes no raw bundle, appends no `INDEX.jsonl` row, edits no rules/specs,
runs no product test, changes no product code, and promotes no gate.

## IDA Functions

| Address | Function | Accepted Static Role |
|---:|---|---|
| `0x100105680` | Tauri async command dispatcher cluster | contains `remove_accounts` and `accountKeys` in the same command/field decode cluster |
| `0x100330a08` | `commands::accounts::remove_accounts::{closure}::{closure}` | resolves repository state, locks repository mutex, calls `Repository::remove_accounts`, converts `CoreError` through Display |
| `0x1005e4850` | `Repository::remove_accounts` | core delete/registry/quota/snooze path already reduced by `ACCOUNTS-REMOVE-ACCOUNTS-ACTIVE-DELETE-STATIC-109.md` |
| `0x1001d87a0` | `RemovePayload::serialize` | serializes success payload fields |
| `0x1001d8de0` | `CoreEnvelope<T>::ok` specialization | success envelope constructor used by the core success path |

## Wrapper Boundary

IDA confirms the command closure:

- calls `StateManager::try_get`;
- locks the repository mutex;
- formats poisoned-lock failure as `poisoned lock: another task failed inside`;
- passes decoded command data to `Repository::remove_accounts`;
- converts `CoreError` through `CoreError Display`;
- returns either the error string shape or the `CoreEnvelope<RemovePayload>`
  success value to the Tauri command result path.

The dispatcher cluster also contains the current command sensitive-field
`remove_accounts` and DTO field `accountKeys`. This is static DTO/wrapper
evidence only. Direct IPC omitted/null/wrong-type/empty `accountKeys` runtime
decode behavior remains unexecuted.

## Success Payload Fields

IDA confirms `RemovePayload::serialize` at `0x1001d87a0`.

The serializer writes a JSON object with three static entries:

1. `removedAccountKeys`
2. `removedCount`
3. `previousAccountKey`

Field-size evidence from the serializer:

- `removedAccountKeys` length argument: `18`;
- `removedCount` length argument: `12`;
- `previousAccountKey` length argument: `16`.

The nearby payload string cluster also contains:

`authRemovedauthBackedUpremovedAccountKeysremovedCountpreviousAccountKey`

`authRemoved` / `authBackedUp` belong to `LogoutPayload`; they are not accepted
as `RemovePayload` fields by this reducer.

## Core Path Relationship

This reducer narrows only the success payload boundary. It reads together with:

`logic/ACCOUNTS-REMOVE-ACCOUNTS-ACTIVE-DELETE-STATIC-109.md`

That earlier reducer covers static active-account protection, no-match error,
metadata-gated `remove_file`, registry retain/persist, quota retain/save, and
snooze clearing. This reducer adds the serializer field names and wrapper
handoff but does not change the static delete ordering.

## Remaining Strict Gaps

Still missing before `strictImplementationUse`:

- live Tauri IPC invocation and exact request bytes;
- omitted/null/wrong-type/empty `accountKeys` decode envelopes;
- exact success/error transport bytes;
- runtime active-field, no-registry, missing-field, duplicate-field, mixed-field, and
  empty-list fixture outcomes;
- snapshot delete/skipped before-after bytes;
- registry/quota/snooze before-after bytes;
- rollback/no-rollback proof for partial delete then persist/quota/snooze
  failure;
- destructive dialog runtime state, selected-account clearing, toast behavior,
  query invalidation, and executed source archive acceptance;
- independent Windows closure where required.

## Gate Effect

No promotion:

- `consumerStartReady=9/9` remains Gate 1 static context only.
- `consumerStartBlocked=0/9`.
- `strictImplementationUse=0/9`.
- `readyToImplement=0/9`.
- `implementation_use=false`.
- `gate_accepted=false`.
- `full_leaf_100=false`.
- `moduleExitAllowed=false`.
