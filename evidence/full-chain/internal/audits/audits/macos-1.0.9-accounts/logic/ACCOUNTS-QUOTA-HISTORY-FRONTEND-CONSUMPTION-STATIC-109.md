# Accounts Quota History Frontend Consumption Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static frontend
consumption boundary for `load_quota_history` and the quota analytics chart.

This reducer consumes already extracted same-version frontend CCF/API evidence
and the raw 1.0.9 frontend asset. It writes no raw/intermediate artifact,
appends no `INDEX.jsonl` row, edits no product code or rule/spec file, runs no
product test, and does not promote any gate.

## Evidence

- Binary/frontend SOT root:
  `<source-location>/source-binary/`.
- Raw frontend asset:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/analytics-panel-D01GGJ7u.js`.
- Frontend API map:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/api-map.json`.
- Frontend IPC contracts:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/ipc-contracts.jsonl`.
- Frontend query hits:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/query-hits.jsonl`.
- Frontend control-flow:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/frontend-control-flow.jsonl`.

## Accepted Static Facts

- API wrapper `loadQuotaHistory` maps to command `load_quota_history` with
  arg field `accountKey` and is defined in `assets/index-CL22l5v8.js`.
- Frontend CCF has terminal call `load_quota_history` from
  `assets/analytics-panel-D01GGJ7u.js`, wrapper `V`, argKeys
  `["accountKey"]`.
- `AnalyticsPanel` includes quota in the tab list:
  `["activity","sessions","sensitive-field","tools","changes","quota"]`.
- The quota query field is `["quota-history", activeAccountKey ?? "none"]`.
- The query function calls `V.loadQuotaHistory(activeAccountKey ?? void 0)`.
- Query execution is gated by:
  `initialQueriesEnabled && (active tab is quota or pending tab is quota) && !!activeAccountKey`.
- The quota query uses `staleTime=60000`, `refetchOnMount=false`, and
  `refetchOnWindowFocus=false`.
- The quota panel receives payload as `response.data` and loading as
  `!response.data && (isPending || isFetching)`.
- The chart renderer reads `payload.points ?? []`.
- If `accountKey` is absent, loading is true, or fewer than two points exist,
  the renderer returns the skeleton component.
- Labels are derived from 
ew Date(point.timestamp * 1000)` as
  `month/day`.
- Five-hour series values are `100 - primaryUsedPercent` when present and `0`
  when the primary percent is null/undefined.
- One-week series values are `100 - secondaryUsedPercent` when present and `0`
  when the secondary percent is null/undefined.
- Latest summary values use the last computed five-hour and one-week series
  values, defaulting to `0`, then `Math.round(...) + "%"`.
- The quota chart uses the shared line chart component with two series labeled
  `5h` and `1w`, colors `var(--heatmap-color, #3FE6A1)` and `#7AD6FF`,
  `yMax=100`, and `ySuffix="%"`.
- Tooltip timestamps are formatted from the point timestamp as
  `YYYY/M/D HH:mm`, and tooltip values round the same computed remaining
  percentages.
- Account import/refresh paths invalidate `queryKey:["quota-history"]`, so
  quota history is refreshed after account set or usage snapshot changes.

## Boundaries

This reducer closes static frontend consumption shape for the quota-history
chart. It does not prove:

- exact runtime Tauri request/response IPC envelope bytes;
- exact runtime chart rendering under concrete fixtures;
- backend source file/path bytes or before-after bytes;
- runtime point ordering, timestamp timezone/locale edge behavior, or
  account-filter fixture behavior;
- empty/corrupt/permission-error backend behavior under live files;
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
