# Accounts Analytics Frontend Query Matrix Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static frontend query
matrix for the accounts analytics panel and the `usage-analytics` shared
consumers.

This reducer consumes existing same-version frontend CCF/query/IPC evidence
and raw frontend assets. It writes no raw/intermediate artifact, appends no
`INDEX.jsonl` row, edits no product code or rule/spec file, runs no product
test, and does not promote any gate.

## Evidence

- Binary/frontend SOT root:
  `<source-location>/source-binary/`.
- Raw analytics panel asset:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/analytics-panel-D01GGJ7u.js`.
- Raw app shell asset:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/index-CL22l5v8.js`.
- Raw sessions page asset:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/sessions-page-_V8EZ45X.js`.
- Frontend query hits:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/query-hits.jsonl`.
- Frontend IPC contracts:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/ipc-contracts.jsonl`.
- Frontend control-flow:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/frontend-control-flow.jsonl`.

## Accepted Static Facts

- `analytics-panel-D01GGJ7u.js` uses range state default `"week"` for the
  range-scoped analytics queries and tab state default `"activity"`.
- `query-hits.jsonl` row 3 defines query field `["session-analytics", range]`,
  query function `V.loadSessionAnalytics(range)`, enabled only when initial
  queries are enabled and the active or pending tab is `sessions`.
- `query-hits.jsonl` row 4 defines query field `["sensitive-field-analytics", range]`,
  query function `V.loadTokenAnalytics(range)`, enabled only when initial
  queries are enabled and the active or pending tab is `sensitive-field`.
- `query-hits.jsonl` row 5 defines query field `["tool-analytics", range]`,
  query function `V.loadToolAnalytics(range)`, enabled only when initial
  queries are enabled and the active or pending tab is `tools`.
- `query-hits.jsonl` row 6 defines query field `["change-analytics", range]`,
  query function `V.loadChangeAnalytics(range)`, enabled only when initial
  queries are enabled and the active or pending tab is `changes`.
- The four range-scoped panel queries use `staleTime=50000`,
  `refetchOnMount=false`, and `refetchOnWindowFocus=false`.
- `query-hits.jsonl` row 8 defines the analytics-panel activity query field
  `["usage-analytics"]`, query function `V.loadUsageAnalytics()`,
  `cacheKey:"usage-analytics"`, `staleTime=Infinity`, and enabled from the
  panel activity query enable flag.
- `frontend-control-flow.jsonl` rows 9 through 14 bind the panel terminal calls
  to `load_session_analytics`, `load_token_analytics`, `load_tool_analytics`,
  `load_change_analytics`, `load_quota_history`, and `load_usage_analytics`.
- `ipc-contracts.jsonl` row 80 maps `loadUsageAnalytics()` to
  `load_usage_analytics` with no frontend arg keys.
- `ipc-contracts.jsonl` rows 82 through 85 map `loadSessionAnalytics`,
  `loadTokenAnalytics`, `loadToolAnalytics`, and `loadChangeAnalytics` to their
  corresponding commands with arg field `range`.
- `query-hits.jsonl` row 12 shows the dashboard/app-shell consumer also queries
  `["usage-analytics"]` through `We.loadUsageAnalytics()` with
  `cacheKey:"usage-analytics"`, delayed enablement, and `staleTime=Infinity`.
- `frontend-control-flow.jsonl` row 41 binds that app-shell consumer to
  terminal command `load_usage_analytics`.
- `query-hits.jsonl` rows 24, 26, and 28 show the sessions page consumes and
  refreshes/refetches `["usage-analytics"]` around session list refresh and
  deletion side effects.
- `frontend-control-flow.jsonl` row 73 binds the sessions page usage summary
  consumer to terminal command `load_usage_analytics`.

## Boundary

This reducer closes only the static frontend query matrix and cross-consumer
usage-analytics query wiring. It does not prove:

- exact runtime Tauri request/response IPC envelope bytes;
- runtime query scheduling, refetch timing, or cache state under fixtures;
- rendered chart, table, summary, loading, empty, or error UI under concrete
  fixtures;
- backend source session/directory bytes or parsed row fixtures;
- analytics calculation correctness, ordering, or grouping under live files;
- executed source archive acceptance mapping;
- independent Windows closure.

## Gate Effect

No promotion.

- `consumerStartReady`: unchanged.
- `consumerStartBlocked`: unchanged.
- `strictImplementationUse`: false / `0`.
- `readyToImplement`: false / `0`.
- `implementation_use`: false.
- `gate_accepted`: false.
- `full_leaf_100`: false.
- `moduleExitAllowed`: false.

Accounts remains the active module. This reducer is dimension evidence only
and does not allow switching to plugins, relay, system, or tray.
