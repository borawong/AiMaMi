# Windows 1.0.9 Relay Frontend Full Chain

platform=windows
module=relay
frontend_source=current_source archive_master
comparison_branch=fear/v1.1-上游同步实施
comparison_result=no_relay_diff_against_master

Windows uses the same packaged React frontend chain as macOS. Same-platform
backend proof remains in the Windows relay package; this frontend file only
records the shell/API/TanStack/control path.

## Shell Entry

- `src/main-app.tsx` route `relayModel` lazy-loads and renders
  `src/components/relay/relay-page.tsx`.
- The route has a relay-specific skeleton during lazy loading.
- Tray navigation into `relayModel` is handled at app shell level when a tray
  event supplies that route.

## API Contract

All invokes are centralized in `src/lib/api.ts`:

- `load_relay_state`
- `get_relay_active`
- `get_relay_proxy_status`
- `get_passthrough_audit_log`
- `upsert_relay_provider { input }`
- `delete_relay_provider { providerId }`
- `activate_relay_provider { providerId, ide }`
- `deactivate_relay_provider { providerId, ide }`
- `set_relay_provider_network { providerId, network }`
- `test_relay_provider { providerId }`
- `test_relay_draft { input }`
- `fetch_relay_models_draft { input }`
- `set_codex_router_enabled { enabled, relaunch }`
- `set_block_official_passthrough { blocked }`
- `diagnose_codex_router`
- `run_codex_router_diagnostics`
- `fix_codex_router_issue { itemId }`
- `export_relay_config { filePath, includeApiKeys }`
- `import_relay_config { filePath }`

## Page Control Flow

- `RelayPage` loads `["relay-state"]` via `api.loadRelayState()`.
- Provider create/edit/delete/network/activate/deactivate mutate via API
  wrappers and update or invalidate relay state cache.
- Router toggle calls `setCodexRouterEnabled` and listens for
  `codex-router-toggle-progress`.
- Diagnostics use `diagnoseCodexRouter`; maintenance diagnostics can use
  `runCodexRouterDiagnostics` and `fixCodexRouterIssue`.
- Import/export use dialog paths and relay config JSON commands.

## Backend Bridge

`src-tauri/src/commands/relay.rs` bridges the page/API wrappers into relay-core
state, provider, router, proxy, diagnostic, HTTP test, and import/export
helpers. Mutating provider/router paths refresh the tray menu.

## 1.1 Comparison

`git diff master..fear/v1.1-上游同步实施` for relay page, API, relay command
layer, relay core, types, and E2E mock returned no changes.
