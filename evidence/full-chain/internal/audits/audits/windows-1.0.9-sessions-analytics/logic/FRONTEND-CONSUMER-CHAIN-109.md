# Frontend Consumer Chain 109 - Sessions / Analytics (windows)

This file is the consumer handoff for frontend control-flow, UI state, TanStack Query wiring, and current source archive code connection to the reverse backend contract. It does not change backend IDA owner evidence or promote gates by itself.

Current status: Live current source archive frontend chain exists for all eight upstream commands. `recover_unindexed_sessions` is a source archive extra and is excluded from AiMaMi 1.0.9 upstream ready queues.

## Command Chain

### `load_sessions`
- UI trigger: Sessions page mount and refresh button
- TanStack field/state: ["sessions"]
- API wrapper: `api.loadSessions(signal)`
- Terminal invoke/callback: `invokeCancellable("load_sessions", undefined, signal)`
- UI consumption: page loading skeleton/error card; search/filter/selection consume returned rows; refreshAction wraps refetch

### `delete_sessions`
- UI trigger: Sessions selected delete button -> confirm dialog
- TanStack field/state: mutation only; post-success invalidates ["sessions"] and refetches active ["usage-analytics"]
- API wrapper: `api.deleteSessions(ids)`
- Terminal invoke/callback: `invoke("delete_sessions", { ids })`
- UI consumption: confirm dialog pending state, destructive toast on error, success/partial toast; selected/focused deleted ids cleared

### `load_usage_analytics`
- UI trigger: Sessions stats mount/refresh and Analytics activity pane
- TanStack field/state: ["usage-analytics"]
- API wrapper: `api.loadUsageAnalytics(signal)`
- Terminal invoke/callback: `invokeCancellable("load_usage_analytics", undefined, signal)`
- UI consumption: stats/activity loading/error/empty state; staleTime Infinity; refetched after delete

### `load_session_analytics`
- UI trigger: Analytics panel sessions tab/range/prefetch
- TanStack field/state: ["session-analytics", panelRange]
- API wrapper: `api.loadSessionAnalytics(panelRange, signal)`
- Terminal invoke/callback: `invokeCancellable("load_session_analytics", { range }, signal)`
- UI consumption: enabled on active/pending tab; 5m stale; tab/range pending snapshot state

### `load_token_analytics`
- UI trigger: Analytics panel sensitive-field tab/range/prefetch
- TanStack field/state: ["sensitive-field-analytics", panelRange]
- API wrapper: `api.loadTokenAnalytics(panelRange, signal)`
- Terminal invoke/callback: `invokeCancellable("load_token_analytics", { range }, signal)`
- UI consumption: enabled on active/pending tab; 5m stale; loading/error panes

### `load_tool_analytics`
- UI trigger: Analytics panel tools tab/range/prefetch
- TanStack field/state: ["tool-analytics", panelRange]
- API wrapper: `api.loadToolAnalytics(panelRange, signal)`
- Terminal invoke/callback: `invokeCancellable("load_tool_analytics", { range }, signal)`
- UI consumption: enabled on active/pending tab; 5m stale; loading/error panes

### `load_change_analytics`
- UI trigger: Analytics panel changes tab/range/prefetch
- TanStack field/state: ["change-analytics", panelRange]
- API wrapper: `api.loadChangeAnalytics(panelRange, signal)`
- Terminal invoke/callback: `invokeCancellable("load_change_analytics", { range }, signal)`
- UI consumption: enabled on active/pending tab; 5m stale; loading/error panes

### `load_quota_history`
- UI trigger: Analytics quota tab after active account exists
- TanStack field/state: ["quota-history", activeAccountKey || "none"]
- API wrapper: `api.loadQuotaHistory(activeAccountKey ?? undefined, signal)`
- Terminal invoke/callback: `invokeCancellable("load_quota_history", { accountKey }, signal)`
- UI consumption: enabled only with active account; 60s stale; invalidates when active account changes

## TanStack / State Rules

Keep query keys exact. Delete success must call `refreshAfterSessionDelete(queryClient)`: invalidate `["sessions"]` and refetch active `["usage-analytics"]`. Detail analytics are prewarmed by range and must keep `enabled` tied to active/pending tab to avoid page-mount fan-out beyond current behavior.

## Backend Contract Link

Raw leaves remain under `<source-location>/raw/aimami/1.0.9/windows/sessions/<command>/`. Use those leaves for owner/threading/interface/error/side-effect facts; use this file for current source archive frontend consumer wiring.

## Acceptance Mapping

Mount sessions page, refresh, delete selected sessions, switch each analytics tab and range, and verify loading/error/empty/success states plus query invalidation. source archive extra `recover_unindexed_sessions` needs separate Product-decision acceptance only.

## Validator Notes

- Static source validation only in this handoff; App/manual acceptance must still execute before implementation sign-off.
- After delete_sessions, current code invalidates ["sessions"] and refetches active ["usage-analytics"] only; session/sensitive-field/tool/change detail analytics can remain cached until their 5 minute stale window.
- Quota history cache field differs between Overview activeAccountKey and Analytics activeAccountKey ?? "none"; enabled guards limit impact but consumers must keep this in mind.
- recover_unindexed_sessions is current source archive product/baseline extra and is excluded from AiMaMi 1.0.9 upstream ready queues.
