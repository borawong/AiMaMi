# Accounts Runtime State Event Surface Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static reducer for the
runtime-state update event surface adjacent to `begin_add_account_attach_monitor`.

This reducer consumes IDA Pro MCP HTTP decompilation from the active current
IDA database:

`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

It writes no raw/intermediate artifact, appends no `INDEX.jsonl` row, edits no
rule/spec/skill file, runs no product test, changes no product code, and
promotes no gate.

## Functions / Strings Reduced

| Evidence | Address | Static role |
|---|---:|---|
| `RuntimeStateUpdatedPayload::serialize` | `0x1001e361c` | payload serializer for runtime state update event args |
| `tauri::event::EmitArgs::new` caller | `0x10044bfa4` | event args construction path that calls the runtime-state payload serializer |
| string cluster | `0x100ee16d4` | contains `snapshot`, `source`, `progressive`, `runtime-state-updated` |
| monitor polling body candidate | `0x100529504` | already reduced polling body that calls `schedule_full_runtime_refresh` on snapshot-field change |

## Payload Serializer Surface

IDA decompilation of `RuntimeStateUpdatedPayload::serialize` confirms the
serializer writes two visible map entries:

- `snapshot`
- `source`

The same string cluster contains `progressive` and `runtime-state-updated`.
Static interpretation:

- `snapshot` is the first serialized payload field;
- `source` is the second serialized payload field;
- `progressive` is an adjacent static source/value candidate;
- `runtime-state-updated` is an adjacent event-name candidate.

This narrows the event surface from anonymous length-only fields to named
static fields. It does not prove the runtime JSON bytes, field values, or
frontend delivery.

## EmitArgs Construction Surface

`tauri::event::EmitArgs::new` at `0x10044bfa4` has an xref to
`RuntimeStateUpdatedPayload::serialize` and constructs event args through:

```text
EventName<&str>::into_owned
allocate payload buffer
RuntimeStateUpdatedPayload::serialize
return EmitArgs success/error shape
```

This proves that a Tauri event-args construction path exists for the
runtime-state payload serializer. It does not prove which command or thread
invokes that event path at runtime.

## Monitor Boundary

The existing monitor reducer already proves that the spawn closure polling body
at `0x100529504` reloads the local snapshot, compares copied snapshot fields,
and calls `schedule_full_runtime_refresh` when a comparison changes.

Superseding current sync `ACCOUNTS-STATIC-CC-NATIVE-EVENT-CURRENT-SYNC-109.md`
closes the remaining IDA-static native emitter chain from polling body to
`tauri::Emitter::emit`. The remaining gap is live frontend delivery:

- no runtime trace proves delivered `runtime-state-updated` payload bytes;
- no accepted event listener registration path is bound to rendered accounts UI;
- no terminal frontend CCF/native callback consumption is accepted;
- no duplicate monitor / timeout / completion event sequence is executed.

## Gate Effect

- `consumerStartReady`: unchanged.
- `consumerStartBlocked`: unchanged.
- `strictImplementationUse`: false / `0`.
- `readyToImplement`: false / `0`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Accounts remains the active locked module. `moduleExitAllowed=false` until the
required macOS accounts gate closes.
