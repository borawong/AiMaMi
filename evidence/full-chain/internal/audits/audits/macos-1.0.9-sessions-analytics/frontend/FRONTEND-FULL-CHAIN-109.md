# Frontend Full Chain - AiMaMi 1.0.9 macOS sessions-analytics

Scope: additive frontend/current-source archive consumer chain for the accepted macOS sessions/analytics closure. This file does not change gate state.

## UI entry

- Sessions page: `src/components/sessions/sessions-page.tsx`.
- Overview analytics surfaces: `src/components/overview/overview-page.tsx` and `src/components/overview/analytics-panel.tsx`.

## API and invoke chain

- `api.loadSessions()` -> `invoke("load_sessions")`.
- `api.deleteSessions(...)` -> `invoke("delete_sessions")`.
- `api.loadUsageAnalytics()` -> `invoke("load_usage_analytics")`.
- `api.loadSessionAnalytics(...)` -> `invoke("load_session_analytics")`.
- `api.loadTokenAnalytics(range)` -> `invoke("load_token_analytics")`.
- `api.loadToolAnalytics(range)` -> `invoke("load_tool_analytics")`.
- `api.loadChangeAnalytics(range)` -> `invoke("load_change_analytics")`.
- `api.loadQuotaHistory(accountKey?)` -> `invoke("load_quota_history")`.

Backend binding is `src-tauri/src/commands/sessions.rs` into `src-tauri/src/core/sessions.rs` and `src-tauri/src/core/analytics.rs`.

## Shell load and state effects

- Overview route loads usage analytics, quota history, MCP count, and tool trend by default.
- Sessions route loads `load_sessions` and `load_usage_analytics` on mount.
- Analytics panel lazily prefetches sensitive-field/tool/change/session detail query keys.
- Delete invalidates `["sessions"]` and active analytics state; recover is source archive extra and not part of the AiMaMi 1.0.9 upstream queue.

