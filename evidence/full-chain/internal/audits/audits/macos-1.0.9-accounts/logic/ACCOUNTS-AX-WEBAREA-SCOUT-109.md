# Accounts AX WebArea Scout - AiMaMi 1.0.9

Scope: accounts-only macOS AiMaMi 1.0.9 runtime harness route probe for the
non-repeated JXA/System Events accessibility route.

This reducer consumes one bounded route scout. It creates no raw bundle,
appends no `INDEX.jsonl` row, edits no regulation or skill, changes no product
code, runs no product/main test, touches no Windows path, and promotes no gate.

## Evidence

- SOT app:
  `<source-location>/source-binary/AiMaMi 1.0.9.app`
- Source binary SHA:
  `1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482`
- Intermediate route probe:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-ax-webarea-scout/manifest.json`
- Intermediate summary:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/runtime-ax-webarea-scout/summary.json`

## Route Tested

The bounded scout launched the SOT executable with disposable `HOME` and
`CODEX_HOME`, then ran an inline `osascript -l JavaScript` JXA script using
Accessibility APIs to enumerate the real AiMaMi process:

```text
AXUIElementCreateApplication(pid)
-> AXWindows
-> recursive AXChildren scan for AXWebArea / AXButton / AXMenuButton / AXAction
```

This route is not the previously rejected menu-only inspection. It directly
looked for accessibility windows, web areas, and actionable nodes that could
trigger a real business path or prove a same-platform native substitute.

## Result

Observed output:

```json
{
  "process_count": 1,
  "trusted": true,
  "windows": [
    {
      "window_count": 0,
      "ax_windows_err": -25201
    }
  ],
  "nodes": []
}
```

The app stderr only reported:

```text
[AiMaMi] startup: hotspot_enabled=false
```

No `AXWindow`, `AXWebArea`, actionable button/menu node, JavaScript evaluation
context, Tauri internals, command invocation, request body, response envelope,
side-effect bytes, UI/native state, fixture result, or reducer acceptance was
captured.

## Classification

This is a non-repeating negative route probe:

- `ax_trusted=true`;
- AiMaMi process was visible to Accessibility;
- `AXWindows` returned error `-25201`;
- window count was `0`;
- node count was `0`;
- no AX WebArea or action candidate existed for this bounded run.

Therefore JXA/System Events accessibility remains a scout-only route. It does
not constitute a WebView/JS/Tauri IPC harness and does not constitute an
accepted same-platform native substitute.

## Still Required

The accepted accounts route remains:

```text
real AiMaMi 1.0.9 WKWebView/Tauri IPC context
-> window.__TAURI_INTERNALS__.invoke("preview_account_import", { filePath })
-> exact request body
-> exact success/error envelope
-> before/after no-write or side-effect bytes
-> UI/native state or accepted callback proof
-> fixture PASS/FAIL
-> reducer acceptance boolean
```

Direct native helper calls remain rejected as substitutes unless they preserve
the command/body/envelope/side-effect/UI/acceptance proof required by
`GATE-SPEC.md`.

## Gate Effect

No promotion.

- `consumerStartReady=9/9` remains Gate 1 static context only.
- `consumerStartBlocked=0/9` remains Gate 1 static context only.
- `strictImplementationUse=false`.
- `readyToImplement=false`.
- `implementation_use=false`.
- `gate_accepted=false`.
- `full_leaf_100=false`.
- `moduleExitAllowed=false`.

Accounts remains the active locked module. This reducer does not permit
switching to plugins, relay, system, or tray.
