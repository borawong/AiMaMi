# Current Frontend / Backend Chain - AiMaMi 1.0.9 macOS Accounts

Scope: current macOS 1.0.9 accounts only.

Current reducer:
`logic/ACCOUNTS-FULL-IDA-CLOSURE-ROLLUP-109.md`

This file is a current-facing reducer. It does not add raw evidence, append
`INDEX.jsonl`, edit product source, run product tests, or promote any gate.

## Accounts Chain State

The macOS accounts chain is closed for the backend/static IDA layer:

- 9/9 accounts owner bodies are identified.
- 9/9 wrapper/xref entrypoints are identified.
- Threading, mutex/task handoff, restart/process/event handoff, and static
  filesystem/process/event side-effect classes are recorded.
- IDB comments were written for 38 anchors and `idb_save` succeeded.

Backend/static reducer:
`logic/ACCOUNTS-FULL-IDA-CLOSURE-ROLLUP-109.md`

Static command-control / native event sync:
`logic/ACCOUNTS-STATIC-CC-NATIVE-EVENT-CURRENT-SYNC-109.md`

## Frontend And Runtime State

Same-version macOS frontend evidence remains partial:

- 7/9 accounts commands have current CCF rows.
- `logout` and `begin_add_account_attach_monitor` remain IPC-wrapper-only for
  visible frontend CCF in the static accounts chunk.
- `begin_add_account_attach_monitor` native backend event emission is closed by
  IDA static evidence: owner, wrapper, thread shim, polling body, refresh
  scheduler, `RuntimeStateUpdatedPayload::serialize`, and
  `tauri::Emitter::emit("runtime-state-updated")` are all identified.
- accepted same-version macOS frontend CCF/UI-state is still false for
  strict/highest use.

Runtime proof remains missing:

- live WKWebView/Tauri IPC request, response, and error envelope bytes
- exact accounts command runtime success/error payload bytes
- before/after filesystem bytes and no-write residue fixtures
- rendered UI/toast/dialog/query-state proof
- executed source archive acceptance fixtures
- terminal frontend listener consumption for monitor/runtime event delivery

## Gate Effect

No promotion:

```json
{
  "strictImplementationUse": false,
  "readyToImplement": false,
  "implementation_use": false,
  "gate_accepted": false,
  "full_leaf_100": false,
  "moduleExitAllowed": false
}
```

Accounts remains the active module.
