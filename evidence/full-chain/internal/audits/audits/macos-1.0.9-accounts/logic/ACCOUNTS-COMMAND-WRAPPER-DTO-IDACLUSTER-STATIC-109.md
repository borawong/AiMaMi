# Accounts Command Wrapper DTO IDA Cluster Static - AiMaMi 1.0.9

Scope: accounts-only static reducer for the current AiMaMi `1.0.9` macOS
command-wrapper DTO surface. This file records IDA Pro MCP and frontend static
evidence only. It writes no raw evidence, appends no `INDEX.jsonl` row, edits no
regulation file, runs no product/main test, and promotes no gate.

## Evidence Consumed

- IDB:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`
- input binary:
  `<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi`
- SOT executable SHA-256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- frontend IPC contract ledger:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/ipc-contracts.jsonl`
- existing DTO reducers:
  `logic/ACCOUNTS-DTO-ENVELOPE-GAP-MATRIX-109.md`,
  `logic/ACCOUNTS-PREVIEW-IMPORT-COMMAND-DTO-STATIC-109.md`,
  and `logic/ACCOUNTS-CHATGPT-SESSION-FRONTEND-DTO-SIDEEFFECT-STATIC-109.md`

## IDA Static Binding

IDA Pro MCP health was `ok` against the current same-version IDB. Static
inspection found the accounts command cluster in the Tauri invoke wrapper at
`0x100105680`:

```text
preview_account_import
import_accounts_from_file
export_accounts_to_file
import_chatgpt_session_account
switch_account
switch_account_and_restart_codex
logout
remove_accounts
```

The same wrapper cluster includes the DTO field strings used by accounts commands:

```text
filePath
overwriteExisting
selectedKeys
targetPath
accountKeys
sessionJson
accountKey
```

IDA also confirms `begin_add_account_attach_monitor` in the same-version
command registration path. The command closure at `0x1003250c0` uses the
`begin_add_account_attach_monitorrun_daemon_once` string cluster and decodes
Tauri `AppHandle` through `CommandArg::from_command`; it carries no command
payload field.

This evidence is static. The merged Rust string layout proves current binary
command/field presence and wrapper ordering, not exact live serde/Tauri decode
bytes.

## Frontend Wrapper Crosswalk

The same-version frontend IPC ledger maps the 9 current accounts rows to these
wrapper DTO shapes:

| Accounts row | Frontend wrapper DTO shape | Static IDA cluster status |
|---|---|---|
| `switch_account` | `{ accountKey }` | command and `accountKey` field present in current IDA wrapper cluster |
| `switch_account_and_restart_codex` | `{ accountKey }` | command and `accountKey` field present in current IDA wrapper cluster |
| `preview_account_import` | `{ filePath }` | command and `filePath` field present; dedicated wrapper reducer confirms `CommandArg::from_command` |
| `import_accounts_from_file` | `{ filePath, overwriteExisting, selectedKeys: selectedKeys ?? null }` | command plus `filePath`, `overwriteExisting`, and `selectedKeys` keys present in current IDA wrapper cluster |
| `export_accounts_to_file` | `{ targetPath, accountKeys: accountKeys ?? null }` | command plus `targetPath` and `accountKeys` keys present in current IDA wrapper cluster |
| `logout` | no payload | command present; no frontend arg object |
| `remove_accounts` | `{ accountKeys }` | command plus `accountKeys` field present in current IDA wrapper cluster |
| `begin_add_account_attach_monitor` | no payload | command present in registration path; no frontend arg object |
| `import_chatgpt_session_account` | `{ sessionJson, overwriteExisting }` with wrapper default `overwriteExisting=false` | command plus `sessionJson` and `overwriteExisting` keys present in current IDA wrapper cluster |

## Static Interpretation

This reducer closes only the same-version command-wrapper DTO naming surface:

- all 9 current accounts rows have a current 1.0.9 frontend wrapper shape;
- all payload-bearing accounts rows have same-version IDA string support for
  their command names and field names;
- no-payload rows are confirmed as command names without frontend arg objects;
- `begin_add_account_attach_monitor` remains registration-path evidence, not
  monitor lifecycle proof.

The reducer does not prove:

- omitted/null/wrong-type direct IPC decode envelopes;
- exact live Tauri success/error transport bytes;
- CoreEnvelope runtime serialization bytes;
- durable before/after side-effect bytes;
- frontend runtime dialog/toast/loading/query invalidation state;
- executed source archive acceptance;
- independent Windows closure.

## Gate Effect

No promotion.

- `consumerStartReady`: accounts remains `9/9` Gate 1 static context only.
- `consumerStartBlocked`: accounts remains `0/9` Gate 1 static context only.
- `strictImplementationUse`: `0/9`.
- `readyToImplement`: `0/9`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

This reducer reduces the interface/DTO naming uncertainty for accounts. It does
not allow switching to plugins, relay, system, or tray.
