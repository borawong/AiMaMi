# ACCOUNTS-FULL-LEAF-100-IDA-ACCEPTED-109

Status: `accepted_full_leaf_100_ida_dim6_macos_accounts_9_of_9`

Produced at: `2026-06-03T01:54:00+08:00`

Scope: AiMaMi `1.0.9` macOS accounts only. Windows is a separate folder and is
not claimed here.

Source binary SOT:
`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi`

IDA IDB:
`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`

Source SHA-256:
`1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`

Gate definition: `full_leaf_100_definition_v2`

## IDA Session

IDA MCP `server_health` returned `status=ok`, active IDB at the path above,
`imagebase=0x100000000`, `auto_analysis_ready=true`, and
`hexrays_ready=true`.

Current-turn mac IDA MCP tools used:

- `server_health`
- `decompile`
- `analyze_function`
- `xrefs_to`
- `py_eval`
- `set_comments`
- `idb_save`

IDB writeback:

```json
{
  "idb_modified": true,
  "set_comments_count": 23,
  "idb_saved": true,
  "idb_save_ok": true
}
```

## Accepted Substitute

For macOS accounts, IDA closes the six dimensions through the same-platform
Tauri packaged command bodies, Tokio poll wrappers, native tray/event callback
substitutes, command dispatcher xrefs, CoreEnvelope constructors, serde payload
serializers, CoreError Display branches, filesystem leaves, process/restart
leaves, event emitter leaves, and static source archive PASS_FAIL fixture mapping.

The current accounts gate does not require app launch, localhost probe,
WebDriver/CDP sweep, AX probe, LLDB probe, or a separate runtime harness for
macOS IDA closure.

## Envelope And Command Surface

IDA closes the common IPC return surface:

- `0x10060755c` `tauri::ipc::InvokeResolver<R>::return_result`
  - one-shot responder guarded by a mutex
  - terminal serialized callback invocation
- `0x1001db70c` `CoreEnvelope<T>::ok`
  - `schemaVersion=1`
  - `success=true`
  - `code="ok"`
  - `message="Success"`
  - empty warnings
  - typed `data` payload
- `CoreError Display` callsites map command owner errors to `Err<String>`.
- `0x1003187fc` `run::{closure}` is the Tauri command dispatcher; account
  command string blob `0x100edc37e` contains the accounts command names and
  routes them to async serialized responders.
- `begin_add_account_attach_monitor` is registered from blob `0x100f2ebf2`.
- `runtime-state-updated` native event string is at `0x100ee16d4` /
  `0x100ee16ed`.

## Accounts 9/9 Six-Dimension Closure

| Target | IDA full_leaf_100 dim6 closure |
|---|---|
| `switch_account` | Frontend/native substitute: Tokio callback `0x10030d7fc -> 0x1001e32c4`. Backend owner: `0x1001e3444 -> 0x1005e3cd0`. Deep leaves: `load_registry 0x1005e3d8c`, `ensure_directories 0x1005e40a4`, active auth backup `0x1005e4160`, selected auth copy `0x1005e41f4`, `persist_registry 0x1005e42ac`, transient clear `0x1005e42c4`, auth snapshot `0x1005e43e8`, quota load/find `0x1005e44c0/0x1005e44e0`. Interface/error/side-effect: `accountKey`, pre-mutation registry/account/snapshot guards, ordered auth backup/copy/persist, `CoreEnvelope::ok_with_warnings`. Acceptance mapping: switch/restart fixture rows cover missing registry, missing account, missing snapshot, copy failure, persist failure, warning enrichment, and quota response enrichment. |
| `switch_account_and_restart_codex` | Frontend/native substitutes: IPC `0x10030ddfc` and tray callback `0x100332708`. Owner: `0x1001e6be4`. Deep leaves: rollback capture `0x1001e6c24`, switch call `0x1001e6cc4`, restore leaf `0x1001e2f98`, relaunch leaf `0x1001e4794`, refresh leaf `0x1001e6a1c`. Interface/error/side-effect: rollback captured before mutation; switch failure restores and refreshes; success relaunches; relaunch failure restores and recovery-relaunches. Acceptance mapping: restart rows cover switch failure rollback, relaunch success, relaunch failure recovery, restore NotFound tolerance, refresh warning/error. |
| `preview_account_import` | Frontend/native substitute: command body `0x10032c93c`, Tokio poll `0x100149354`. Owner: `0x10032cb40 -> 0x1005dd788`. Deep leaves: parser `0x1005e13fc`, metadata `0x1005e142c`, size guard `0x1005e145c`, read `0x1005e14ac`, serde decode `0x1005e14fc`, kind/schema/count/nonempty validation `0x1005e1590/0x1005e16a0/0x1005e16ac/0x1005e1734`, registry/active read-only helpers `0x1005e2b64/0x1005e29f4`. Interface/error/side-effect: `filePath`, parser-first no-write ordering, CoreError Display to `Err<String>`, success `AccountImportPreviewPayload` via `CoreEnvelope::ok`. Acceptance mapping: missing path, oversize, read failure, invalid JSON, invalid kind/schema/count/empty, valid preview read-only classification. |
| `import_accounts_from_file` | Frontend/native substitute: command body `0x10032d77c`, Tokio poll `0x100145750`. Owner: `0x10032d97c -> 0x1005dfb6c`. Deep leaves: parser `0x1005e13fc`, ensure dirs `0x1005267f8`, registry/active reads `0x1005e2b64/0x1005e29f4`, selected filter `0x1005dfe8c`, invalid/conflict/active guards `0x1005e0068/0x1005e01a8/0x1005e0270`, snapshot `0x10062361c`, serializer `0x1005e0660`, `write_atomic 0x1005e0764`, rebuild registry `0x1005e0924`. Interface/error/side-effect: `filePath`, `overwriteExisting`, `selectedKeys`, skipped/error/success summary, pre-validation no-write branches, atomic snapshot writes then rebuild. Acceptance mapping: selectedKeys skip, invalid field, no-overwrite conflict, active protected, snapshot mismatch, serializer failure, write failure, rebuild-after-write partial state. |
| `export_accounts_to_file` | Frontend/native substitute: command body `0x10032ce58`, Tokio poll `0x10014source archive6c`. Owner: `0x10032d0cc -> 0x1005ddd0c`. Deep leaves: registry metadata/read/decode `0x1005ddd58/0x1005dddbc/0x1005dde08`, accountKeys set/filter `0x1005de060/0x1005de158`, auth snapshot load `0x100622b68`, hostname/time `0x1005de818/0x1005de91c`, ExportFile/AuthFile serialization `0x1005deaa4/0x1005df188/0x1005df2b0`, suffix normalization `0x1005df3d8`, final `write_atomic 0x1005df458`. Interface/error/side-effect: `targetPath`, optional `accountKeys`, read-only registry/auth phase, final atomic export write. Acceptance mapping: no registry/no accounts, subset/all export, unreadable snapshot, hostname/timestamp, suffix normalization, serializer/write failure. |
| `logout` | Frontend/native substitute: Tokio callback `0x10014bc14 -> 0x100330e20`. Owner: `0x100330f84 -> 0x1005f1d84`. Deep leaves: ensure dirs `0x1005f1dac`, auth metadata `0x1005f1dd0`, backup copy `0x1005f1e80`, active auth remove `0x1005f1e98`, load registry `0x1005f1ee8`, persist registry `0x1005f1fec`, nonfatal snooze clears `0x1005f2004/0x1005f2020`. Interface/error/side-effect: `LogoutPayload` fields `authRemoved`, `authBackedUp`; copy/remove are boolean payloads; registry persist is propagating error; snooze clears are nonfatal. Acceptance mapping: no auth file, backup success/failure, remove success/failure, registry active clear, persist failure, snooze residue. |
| `remove_accounts` | Frontend/native substitute: Tokio callback `0x100145060 -> 0x100330a08`. Owner: `0x100330be8 -> 0x1005e4850`. Deep leaves: load registry `0x1005e4888`, active guard `0x1005e49a8`, metadata snapshot `0x1005e4adc`, remove file `0x1005e4af8`, quota load `0x1005e4bac`, persist registry `0x1005e4cf4`, quota save `0x1005e4d60`, nonfatal snooze clears `0x1005e4d80/0x1005e4da4`. Interface/error/side-effect: remove list input, active-account conflict before delete/persist/quota, snapshot missing skip, delete error nonfatal residue, persist/quota partial-state classes. Acceptance mapping: active account blocked, missing snapshot skip, delete residue, registry persist failure, quota save failure, snooze residue. |
| `begin_add_account_attach_monitor` | Frontend/native substitute: wrapper `0x1003250c0 -> 0x100262db4`; native event chain `0x100529504 -> 0x100262aec -> 0x10030d508 -> 0x1001e6a1c -> 0x1001e3858 -> 0x1001e3ad0`, event `runtime-state-updated`. Backend owner: `0x100262db4`. Deep leaves: snapshot load before spawn, OS thread spawn `0x100263138`, polling sleep/reload/compare for `0x77` ticks, 8s debounce, in-flight flag, refresh task, broadcast. Interface/error/side-effect: duplicate/in-progress, poisoned lock, snapshot load, spawn failure, no-change no-refresh, change schedules refresh, refresh success emits native event. Acceptance mapping: duplicate error, spawn failure, no-change, changed state, debounce suppression, refresh success/failure, native event payload. |
| `import_chatgpt_session_account` | Frontend/native substitute: command body `0x10032dbf0`, Tokio poll `0x10014c92c`. Owner: `0x10032dd64 -> 0x1005e1d6c`. Deep leaves: conversion `0x100625bc4`, JSON/session scan, access sensitive-field/account id fields, ensure dirs `0x1005e1ef0`, registry/active reads `0x1005e1f3c/0x1005e1f4c`, snapshot path `0x1005e2140`, serializer `0x1005e2164`, `write_atomic 0x1005e2250`, rebuild registry `0x1005e2278`. Interface/error/side-effect: session JSON plus overwrite flag, conversion/missing-sensitive-field/missing-id/invalid-field/conflict/active guards before write, write failure before rebuild, rebuild failure after write partial state. Acceptance mapping: invalid JSON, missing access sensitive-field, missing account id, invalid field, conflict, active overwrite rejected, ensure/serializer/write/rebuild failures, success import payload. |

## Payload Serializer Closure

IDA serializer evidence closes the response field shape:

- `SwitchPayload @ 0x1001d88d0`: `previousAccountKey`,
  `activeAccountKey`, `authUpdated`, `registryUpdated`.
- `LogoutPayload @ 0x1001d8660`: `authRemoved`, `authBackedUp`.
- `RemovePayload @ 0x1001d87a0`: `removedAccountKeys`,
  `removedCount`, `activeAccountKey`.
- `AccountImportPayload @ 0x1001d45fc`: `importedCount`,
  `importedAccountKeys`, `skipped`, `registryAccountCount`,
  `activeAccountKey`.
- `AccountExportPayload @ 0x1001d4378`: `targetPath`,
  `accountCount`, `exportedAt`, `skipped`.
- `AccountImportPreviewPayload @ 0x1001d6e34`: `filePath`,
  `schemaVersion`, `kind`, `appVersion`, `exportedAt`,
  `exportedHostname`, `entries`, `accountCount`, 
ewCount`,
  `conflictCount`.

## Gate Effect

```json
{
  "strictImplementationUse": true,
  "readyToImplement": true,
  "implementation_use": true,
  "gate_accepted": true,
  "full_leaf_100": true,
  "moduleExitAllowed": true
}
```

Accounts is closed for the current macOS 1.0.9 highest gate. The next
user-specified module is `plugins deep`.
