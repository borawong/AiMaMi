# macOS 1.0.9 Relay Frontend Full Chain

platform=macos
module=relay
frontend_source=current_source archive_master
comparison_branch=fear/v1.1-上游同步实施
comparison_result=no_relay_diff_against_master

## Shell Entry

- `src/main-app.tsx` route `relayModel` lazy-loads
  `src/components/relay/relay-page.tsx`.
- The same route renders `<RelayPage />` and has a relay-specific skeleton
  branch for shell loading.
- Tray navigation can request `relayModel` through the app-level
  `tray:navigate` listener, but tray menu insertion is documented in the tray
  package rather than this relay package.

## API Contract

All relay invokes are centralized in `src/lib/api.ts`:

- `loadRelayState` -> `load_relay_state`
- `getRelayActive` -> `get_relay_active`
- `getRelayProxyStatus` -> `get_relay_proxy_status`
- `getPassthroughAuditLog` -> `get_passthrough_audit_log`
- `upsertRelayProvider(input)` -> `upsert_relay_provider { input }`
- `deleteRelayProvider(providerId)` -> `delete_relay_provider { providerId }`
- `activateRelayProvider(providerId, ide="codex")` ->
  `activate_relay_provider { providerId, ide }`
- `deactivateRelayProvider(providerId, ide="codex")` ->
  `deactivate_relay_provider { providerId, ide }`
- `setRelayProviderNetwork(providerId, network)` ->
  `set_relay_provider_network { providerId, network }`
- `testRelayProvider(providerId)` -> `test_relay_provider { providerId }`
- `testRelayDraft(input)` -> `test_relay_draft { input }`
- `fetchRelayModelsDraft(input)` -> `fetch_relay_models_draft { input }`
- `setCodexRouterEnabled(enabled, relaunch=true)` ->
  `set_codex_router_enabled { enabled, relaunch }`
- `setBlockOfficialPassthrough(blocked)` ->
  `set_block_official_passthrough { blocked }`
- `diagnoseCodexRouter` -> `diagnose_codex_router`
- `runCodexRouterDiagnostics` -> `run_codex_router_diagnostics`
- `fixCodexRouterIssue(itemId)` -> `fix_codex_router_issue { itemId }`
- `exportRelayConfig(includeApiKeys, filePath)` ->
  `export_relay_config { filePath, includeApiKeys }`
- `importRelayConfig(filePath)` -> `import_relay_config { filePath }`

## Page Control Flow

- Initial page state loads `["relay-state"]` through `api.loadRelayState()`.
- Provider create/edit uses `upsertRelayProvider`, updates cached provider
  state, and can immediately activate the saved provider.
- Provider delete uses `deleteRelayProvider`, then updates relay state cache.
- Activation/deactivation uses `activateRelayProvider` or
  `deactivateRelayProvider` with `ide="codex"` and refreshes provider/router
  state.
- Network changes use `setRelayProviderNetwork` and update cached provider
  state.
- Saved provider test uses `testRelayProvider`; draft test and model fetch use
  `testRelayDraft` and `fetchRelayModelsDraft`.
- Router toggle uses `setCodexRouterEnabled`; while it runs, the page listens
  for `codex-router-toggle-progress` and may run `diagnoseCodexRouter` for the
  post-toggle diagnostic state.
- Official passthrough blocking uses `setBlockOfficialPassthrough`.
- Export/import use save/open dialog-selected paths and then call
  `exportRelayConfig` / `importRelayConfig`.

## Backend Bridge

`src-tauri/src/commands/relay.rs` maps the commands above into relay-core
owners:

- Read commands lock `Repository` and call relay state/proxy/audit helpers.
- Provider mutations call relay provider helpers and refresh the tray menu.
- Activation/router commands stop Codex, ensure no writer process, migrate or
  repair router state, emit progress, refresh tray, and optionally relaunch
  Codex.
- HTTP/model-test commands run through `tauri::async_runtime::spawn_blocking`.
- Diagnostic/fix commands run relay diagnostics and targeted fix logic.
- Import/export commands validate file paths and read/write JSON export files.

## 1.1 Comparison

`git diff master..fear/v1.1-上游同步实施` for relay page, API, relay command
layer, relay core, types, and E2E mock returned no changes. Current `master`
and the 1.1 branch have the same relay frontend/backend chain for this scope.
