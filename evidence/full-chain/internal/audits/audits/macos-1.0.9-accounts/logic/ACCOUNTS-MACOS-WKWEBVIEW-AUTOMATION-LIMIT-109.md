# Accounts macOS WKWebView Automation Limit - 1.0.9

Scope: accounts-only AiMaMi 1.0.9 macOS runtime harness route selection.

Evidence Source: SOT confirmed for AiMaMi 1.0.9 app
`<source-location>/source-binary/AiMaMi 1.0.9.app`;
source-confirmed for the local Tauri/Wry dependency source that matches binary
strings (`tauri-2.10.3`, `tauri-runtime-wry-2.10.1`, `wry-0.54.4`).

## Decision

`TAURI_WEBVIEW_AUTOMATION=1` is not an accepted macOS runtime harness route for
AiMaMi 1.0.9 accounts. It can make the app expose or attempt automation-related
surface, but in the Wry version embedded by this app the automation flag is only
enforced on GTK/Linux. On macOS, `WebContextImpl::set_allows_automation` is a
no-op.

This explains why earlier SOT app runs observed an AiMaMi-owned localhost
listener but could not create an accepted WebView/Tauri IPC session and only
received `404` from WebDriver/CDP-style routes. Repeating endpoint sweeps,
WebDriver sessions, or curl probes against the listener cannot close the
accounts runtime gate.

## Source Evidence

| Evidence | Path | Relevant lines / fact |
|---|---|---|
| Tauri runtime reads the env var | `cargo-registry:tauri-runtime-wry-2.10.1/src/lib.rs` | lines 4600-4612 read `TAURI_WEBVIEW_AUTOMATION` and call `web_context.set_allows_automation(...)`. |
| Wry automation enforcement | `cargo-registry:wry-0.54.4/src/web_context.rs` | lines 87-90 state automation is currently only enforced on Linux; lines 102-112 define non-GTK `WebContextImpl` and make `set_allows_automation` a no-op. |
| macOS devtools requirement | `cargo-registry:wry-0.54.4/src/lib.rs` | lines 715-726 state macOS devtools require debug builds or the `devtools` feature flag in release. |
| AiMaMi binary strings | `<source-location>/source-binary/AiMaMi 1.0.9.app/Contents/MacOS/AiMaMi` | strings include `TAURI_WEBVIEW_AUTOMATION`, `wry-0.54.4`, `tauri-2.10.3`, `WKWebView`, `window.__TAURI_INTERNALS__`, and `Tauri-Invoke-field`. |
| Codesign / entitlements | `<source-location>/source-binary/AiMaMi 1.0.9.app` | Developer ID signed, Hardened Runtime flag `0x10000(runtime)`, entitlements contain only `com.apple.security.device.audio-input`. There is no `com.apple.security.cs.allow-dyld-environment-variables`, no `com.apple.security.cs.disable-library-validation`, and no `com.apple.security.get-task-allow`. |
| Gatekeeper status | `<source-location>/source-binary/AiMaMi 1.0.9.app` | `spctl -a -vv` reports `rejected source=Unnotarized Developer ID`; this does not change the SOT SHA, but it reinforces that external runtime-control routes must be proven, not assumed. |
| Relay state written by runtime probe | `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-webdriver-session-probe/disposable-codex-home/codexmate/relay/state.json` | The observed `25818` listener is also recorded as AiMaMi relay proxy state (`baseUrl=<local-tool-endpoint>`, `codexBaseUrl=<local-tool-endpoint>`), not as a JavaScript evaluation or WebView IPC endpoint. |

Source file hashes recorded during this reducer:

- `wry-0.54.4/src/web_context.rs`: `dd9912d669f3a5de10aeda7b8e1361751a1137a602385d31964439f101773aac`, size `3591`.
- `tauri-runtime-wry-2.10.1/src/lib.rs`: `853abef80393e46bd4bd8ef238e14178c47a4ad083195ea2dcac7e915e05401b`, size `159874`.
- `wry-0.54.4/src/lib.rs`: `6fbfa622eece22f3d6200f89344644377source archive9b253f9e9119d59619604f700c701`, size `101642`.

## Consumed Runtime Evidence

This reducer consumes existing non-promoting route evidence only:

- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-harness-sot-feasibility/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-endpoint-sweep/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-webdriver-session-probe/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-webview-inspector-route-probe/manifest.json`
- `<source-location>/intermediate/aimami/1.0.9/macos/accounts/webview-ipc-surface-audit/manifest.json`

## Rejected Routes

| Route | Current status | Reason |
|---|---|---|
| `TAURI_WEBVIEW_AUTOMATION` listener / WebDriver / CDP / localhost | rejected for gate | The env var does not enable macOS Wry automation; previous listener probes reached only 404 routes and no Tauri internals. |
| direct HTTP against `25818` | rejected for gate | Existing runtime state identifies `25818` as relay proxy state, not a reusable Tauri invoke-field or WebView JavaScript endpoint. |
| Safari/WebDriver | rejected for gate | Tauri's macOS WKWebView has no native WebDriver driver; previous `safaridriver` attempt did not create an AiMaMi WebView session. |
| UI-only Accessibility / System Events | diagnostic only | It can prove visible app UI state or a user-visible error branch, but it cannot capture exact Tauri IPC body, CoreError envelope, side-effect bytes, rollback/no-write proof, or reducer acceptance. |
| DYLD injection | rejected as next route | Hardened Runtime is enabled and the app lacks allow-dyld and library-validation entitlements. |
| ordinary LLDB attach | rejected as next route | The app lacks `get-task-allow`, and previous LLDB attach was denied before any WKWebView or JavaScript evaluation. |
| WebKit inspector defaults / `inspectable` default | diagnostic only | Strings and symbols prove WKWebView exists, but not that the release app exposes a controllable inspector or JavaScript evaluation channel. |

## Gate Effect

No gate is promoted.

- `accepted_ipc_harness=false`
- `accounts_command_invoked=false`
- `request_response_envelopes_captured=false`
- `side_effect_bytes_captured=false`
- `runtime_acceptance_executed=false`
- `consumerStartReady` for accounts is `9/9` at Gate 1
- `import_chatgpt_session_account` is Gate 1 static ready only
- `strictImplementationUse=0`
- `readyToImplement=0`
- `implementation_use=false`
- `gate_accepted=false`
- `full_leaf_100=false`
- `moduleExitAllowed=false`

## Next Valid Route

The next valid accounts-only route is not another `TAURI_WEBVIEW_AUTOMATION`
listener probe. It must either:

1. prove real same-version AiMaMi WKWebView JavaScript execution and call
   `window.__TAURI_INTERNALS__.invoke(...)` from inside that WebView; or
2. provide an accepted same-platform native callback / helper substitute that
   captures the same request, envelope, side-effect bytes, rollback/no-write,
   frontend state, and PASS/FAIL acceptance dimensions.

The first low-risk target remains `preview_account_import` with a missing-path
or invalid-JSON no-write fixture. Until that accepted harness exists, accounts
cannot exit to plugins, relay, system, or tray.
