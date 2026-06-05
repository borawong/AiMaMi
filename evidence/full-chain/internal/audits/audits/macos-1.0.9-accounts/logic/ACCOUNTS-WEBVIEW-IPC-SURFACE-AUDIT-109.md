# Accounts WebView IPC Surface Audit 1.0.9

Scope: AiMaMi 1.0.9 macOS accounts only.

Raw evidence pointer field:
`aimami/1.0.9/macos/accounts/webview-ipc-surface-audit`

## Static Facts

- SOT app pointer: see `pointers/evidence-paths.md`.
- Main executable SHA256:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- `Info.plist` reports `CFBundleShortVersionString=1.0.9` and
  `CFBundleVersion=1.0.9`.
- Entitlements observed: `com.apple.security.device.audio-input` only.
- Bundle resource listing shows no external frontend asset tree under
  `Contents/Resources`; shipped frontend/Tauri bootstrap text is embedded in
  the Mach-O.
- Strings evidence contains Tauri IPC bootstrap markers including
  `window.__TAURI_INTERNALS__`, `__TAURI_INVOKE_KEY__`, `__RAW_ipc_script__`,
  `window.webkit.messageHandlers.ipc.postMessage`, and
  `TAURI_WEBVIEW_AUTOMATION`.
- Strings evidence also contains `plugin:webview|internal_toggle_devtools` and
  related allow/deny permission strings.

## Interpretation

This audit confirms that the shipped 1.0.9 binary embeds the standard Tauri
WebView IPC machinery and a devtools command surface. It does not prove any of
the following:

- the primary AiMaMi WKWebView is inspectable from this host;
- `plugin:webview|internal_toggle_devtools` can be invoked without first
  controlling the real WebView context;
- `TAURI_WEBVIEW_AUTOMATION=1` opens a command-capable IPC route;
- any accounts command was invoked;
- request/response/error envelopes or side-effect bytes were captured.

The result narrows the route decision but remains static diagnostic evidence.
It supports trying to reach a real WebView/Tauri IPC context; it does not
replace that runtime proof.

## Gate Effect

- `accepted_ipc_harness=false`
- `accounts_command_invoked=false`
- `runtime_acceptance_executed=false`
- `strictImplementationUse=false`
- `readyToImplement=false`
- `implementation_use=false`
- `gate_accepted=false`
- `full_leaf_100=false`
- `moduleExitAllowed=false`

Current blocker:
`static_surface_confirms_tauri_ipc_strings_but_no_real_webview_tauri_context_or_command_trace`
