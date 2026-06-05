# Accounts Tauri IPC Transport Static Audit - AiMaMi 1.0.9

Scope: accounts-only runtime route narrowing for the current AiMaMi `1.0.9`
macOS bundle.

Current entrypoint:
`<source-location>/audits/macos-1.0.9-accounts/`

Raw audit:
`<source-location>/intermediate/aimami/1.0.9/macos/accounts/tauri-ipc-transport-static-audit/manifest.json`

This reducer consumes the static Tauri IPC transport audit and existing
accounts runtime negative probes. It does not execute AiMaMi, does not invoke
accounts commands, and does not promote any gate.

## Static Transport Facts

AiMaMi 1.0.9 embeds the standard Tauri v2 IPC bootstrap:

- frontend wrappers call `window.__TAURI_INTERNALS__.invoke(command, args,
  options)`;
- the runtime custom-protocol branch calls
  `fetch(window.__TAURI_INTERNALS__.convertFileSrc(cmd, "ipc"), ...)`;
- the custom-protocol branch requires `Tauri-Invoke-field` /
  `__TAURI_INVOKE_KEY__`;
- fallback transport uses `window.ipc.postMessage(data)`;
- WebKit bridges that fallback through
  `window.webkit.messageHandlers.ipc.postMessage(s)`.

The static binary proves the IPC mechanism shape, but it does not expose a
reusable external invoke field and does not prove which branch is active inside
the real AiMaMi WKWebView. Therefore an external `curl`/localhost probe cannot
be accepted as accounts runtime proof unless it first proves access to the real
WebView-injected Tauri internals.

## Accounts Command Surface

Same-version frontend wrapper/static IPC contracts identify the accounts
commands and request keys:

| command | request keys |
|---|---|
| `switch_account` | `accountKey` |
| `switch_account_and_restart_codex` | `accountKey` |
| `preview_account_import` | `filePath` |
| `import_accounts_from_file` | `filePath`, `overwriteExisting`, `selectedKeys` |
| `export_accounts_to_file` | `targetPath`, `accountKeys` |
| `logout` | none |
| `remove_accounts` | `accountKeys` |
| `begin_add_account_attach_monitor` | none |

This stays below strict gate because wrapper/static contracts are not runtime
execution evidence.

## Route Decision

The external HTTP endpoint route is rejected for strict/highest proof:

- endpoint sweep and minimal IPC probes observed listener `25818` but did not
  reach Tauri internals;
- WebView inspector route found no no-setting menu route to JavaScript
  evaluation;
- LLDB route failed before WebKit expression execution because macOS denied
  attach permission;
- static transport strings show that accepted invocation belongs inside the
  real WebView context with injected invoke field or WebKit postMessage bridge.

The next accepted proof route remains unchanged:

1. launch AiMaMi 1.0.9 from the source archive binary SOT;
2. enter the real WKWebView/Tauri IPC context;
3. prove `window.__TAURI_INTERNALS__` and the selected transport;
4. invoke a low-risk fixture such as:

```js
await window.__TAURI_INTERNALS__.invoke("preview_account_import", {
  filePath: "<fixture>/import/missing.json"
})
```

5. capture exact command/body, success/error envelope, no-write before/after
   bytes, UI/native consumption, fixture PASS/FAIL, and reducer acceptance.

## Gate Effect

No promotion:

- `accepted_ipc_harness=false`
- `accounts_command_invoked=false`
- `runtime_acceptance_executed=false`
- `strictImplementationUse=false`
- `readyToImplement=false`
- `implementation_use=false`
- `gate_accepted=false`
- `full_leaf_100=false`
- `moduleExitAllowed=false`

Current blocker remains
`sot_app_present_but_no_accepted_ipc_runtime_harness_or_executed_accounts_acceptance_trace`.

## IDA HTTP MCP Function Recheck - 2026-06-02

Fresh IDA MCP recheck used the active AiMaMi 1.0.9 macOS IDB:
`<source-location>/source-binary/AiMaMi 1.0.9_ida.app/Contents/MacOS/AiMaMi.i64`.
`server_health` reported `auto_analysis_ready=true`, `hexrays_ready=true`,
and the input binary under `raw/binary/`.

Function-level xrefs refine, but do not close, the IPC/runtime blocker:

| evidence | IDA result | gate effect |
|---|---|---|
| `window.__TAURI_INTERNALS__` / core IPC script | data xref from `0x100ee549d` into `tauri::manager::webview::WebviewManager<R>::prepare_webview @ 0x10029a0e4` | Confirms WebView runtime injection path, not a reusable external invoke channel. |
| `Tauri-Invoke-field`, `__TAURI_INVOKE_KEY__`, `fetch(convertFileSrc(cmd, "ipc"))` | embedded IPC JS at `0x100fe335e`; ordinary xref lands in a serde/menu visitor artifact, so this is resource/string evidence rather than an account command callsite | Confirms required invoke-field shape; does not disclose the live field or transport bytes. |
| `invalid IPC request URL` / `CsprngInvokeKey` cluster | xrefs from `0x100ee4c0e` into `tauri::ipc::protocol::get` closure `0x100298294`, `prepare_webview @ 0x10029a0e4`, `register_uri_scheme_protocol @ 0x10029d0d0`, and axum handler closures `0x10029d3d8`, `0x10029e514`, `0x10029ef70` | Confirms Tauri IPC protocol and handler surface, but still below runtime envelope proof. |
| `protocol::get` inner closure | `0x100299824` builds a `text/plain` response path containing `failed to acquire webview reference` and `only POST and OPTIONS are allowed`, then inserts headers via `http::HeaderMap::try_insert2 @ 0x10029988c` | Rejects treating the listener as a generic public HTTP API; accepted route is the Tauri/WebView IPC protocol. |
| URI scheme registration | `WebviewManager::register_uri_scheme_protocol @ 0x10029d0d0` clones the scheme field, locks the manager, inserts the handler into a HashMap at `0x10029d14c`, and unlocks at `0x10029d1a0` | Confirms app-internal scheme handler registration under WebViewManager state. |
| `plugin:webview|internal_toggle_devtools` / `allow-internal-toggle-devtools` | string xref from `0x100f37229` lands in huge app boot closure `codexmate_lib::run::inner::{closure} @ 0x1004deff4` (`size=0x3bba8`, IDA decompile failed for full body, `analyze_function` still lists capability strings) | Capability evidence only; it does not prove a no-setting route to evaluate JS or bypass the invoke-field path. |

IDA comments were written on:

- `0x10029a0e4` `WebviewManager::prepare_webview`
- `0x100298294` `tauri::ipc::protocol::get` closure
- `0x100299824` `protocol::get` inner closure
- `0x10029d0d0` `WebviewManager::register_uri_scheme_protocol`
- `0x1004deff4` app `run::inner` closure

`idb_save` succeeded for the active IDB. This sets
`idb_modified=true` / `idb_saved=true` for this reducer only.

Gate posture is unchanged. The new evidence narrows the accepted runtime route
to real WKWebView/Tauri IPC context plus live `__TAURI_INTERNALS__` proof. It
does not provide exact accounts command envelopes, before/after side-effect
bytes, live UI state, or executed acceptance fixtures, so:

- `accepted_ipc_harness=false`
- `accounts_command_invoked=false`
- `runtime_acceptance_executed=false`
- `strictImplementationUse=false`
- `readyToImplement=false`
- `implementation_use=false`
- `gate_accepted=false`
- `full_leaf_100=false`
- `moduleExitAllowed=false`
