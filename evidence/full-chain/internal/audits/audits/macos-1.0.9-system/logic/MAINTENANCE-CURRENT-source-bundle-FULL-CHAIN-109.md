# MAINTENANCE-CURRENT-source archive-FULL-CHAIN-109

## Scope

Current source archive Maintenance page full consumer chain for AiMaMi 1.0.9 system/relay-backed maintenance actions. This document is implementation mapping and review supplement; it does not overwrite the existing macOS system canonical producer gate.

## Render / Navigation

- Route universe includes `maintenance` in `src/types/navigation.ts` and sidebar `src/components/layout/sidebar.tsx` with `Wrench` icon and 
av.maintenance` label.
- `src/main-app.tsx` lazy-loads `src/components/maintenance/maintenance-page.tsx` for route `maintenance`.
- Page state is action-array driven: each row has field/icon/label/description/action/loading/disabled reason.

## Shared Frontend State Model

- TanStack query `["relay-state"]` calls `api.loadRelayState()` with `staleTime: 30000`.
- `routerEnabled = relayState.codexRouterEnabled || relayState.enabled`; reset config action is disabled while router is enabled.
- `runAction(field, mutateAsync)` sets `runningKeys[field]` via `flushSync`, waits two `requestAnimationFrame` paints, enforces `MIN_FEEDBACK_MS=800`, and clears busy only while mounted.
- Confirm dialogs guard `restart`, `forceKill`, and `resetConfig`.
- Successful `clean`, `rebuild`, and `resetConfig` invalidate TanStack queries.

## Action Chains

- `diagnose`: button -> `diagnoseMutation` -> `api.diagnose()` -> `invoke("diagnose")` -> `commands::system::diagnose` -> `Repository::diagnose`; UI displays platform/coreVersion/account/session/path/API badges.
- `clean`: button -> `api.clean()` -> `invoke("clean")` -> `commands::system::clean` -> `Repository::clean`; UI displays auth/registry/stale/total counts and invalidates queries.
- `rebuild`: button -> `api.rebuildRegistry()` -> `invoke("rebuild_registry")` -> `Repository::rebuild_registry`; UI displays `accountCount` and `activeAccountKey`, invalidates queries.
- `restart`: confirm -> `api.restartCodex()` -> `invoke("restart_codex")` -> `platform::process::restart_codex_app`; UI shows success/error only.
- `forceKill`: confirm -> `api.forceKillCodex()` -> `invoke("force_kill_codex")` -> `commands::system::force_kill_codex` -> `platform::process::force_kill_codex_processes`; current source archive DTO field consumed is `terminatedProcessCount`.
- `resetConfig`: confirm -> `api.resetCodexConfig()` -> `invoke("reset_codex_config")` -> `preflight_relay_state` -> optional backup -> `config_inject::save_config_text(config_path, "")`; UI branches on `res.data.reset` and consumes `configPath`/`backupPath` through DTO.
- `routerDiagnostics`: row opens dialog -> query `["maintenance-router-diagnostics"]` -> `api.runCodexRouterDiagnostics()` -> `invoke("run_codex_router_diagnostics")`; repair buttons call `api.fixCodexRouterIssue(itemId)` and then refresh diagnostics.

## Backend Ownership / Side Effects

- `clean`, `rebuild`, `diagnose`, `resetConfig` lock `Repository` synchronously.
- `forceKill` enumerates Codex process candidates, kills initial list, sleeps 500ms, kills survivors, sleeps 1s, and errors if candidates remain.
- `resetConfig` rejects while relay/router enabled, reads relay state JSON if present, builds state payload, backs up existing config, then truncates/saves empty config through relay config injector.
- Router diagnostics are relay module leaves and already owned by the relay bundle; Maintenance only consumes their current frontend surface.

## Acceptance Mapping

- `src/lib/api.test.ts` covers maintenance command IPC contracts and `force_kill_codex` / `reset_codex_config` no-arg invocation.
- `src/components/maintenance/maintenance-page.test.tsx` covers onboarding isolation, router diagnostics/fix all/single/failures, rebuild busy guard, restart/force kill/reset confirmation, disabled reset while router is enabled, and visible error rendering.
- Manual acceptance should verify each row: busy state appears before backend completion, destructive confirmations must be accepted before invoke, query invalidations refresh visible state, and router-enabled reset stays disabled.
