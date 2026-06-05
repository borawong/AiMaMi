# Accounts Quota History Frontend Invalidation Static - AiMaMi 1.0.9

Scope: accounts-only same-version macOS AiMaMi 1.0.9 static frontend
cache invalidation boundary for the `quota-history` query used by
`load_quota_history`.

This reducer consumes existing same-version frontend CCF/query evidence and
raw frontend assets. It writes no raw/intermediate artifact, appends no
`INDEX.jsonl` row, edits no product code or rule/spec file, runs no product
test, and does not promote any gate.

## Evidence

- Binary/frontend SOT root:
  `<source-location>/source-binary/`.
- Raw accounts page asset:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/accounts-page-CJFT2P5o.js`.
- Raw app shell asset:
  `<source-location>/raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/dumped/assets/index-CL22l5v8.js`.
- Frontend query hits:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/query-hits.jsonl`.
- Frontend IPC contracts:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/ipc-contracts.jsonl`.
- Frontend control-flow:
  `<source-location>/intermediate/aimami/1.0.9/macos/accounts/frontend-ccf-accounts-repair/relocated-raw-bundle/frontend/frontend-control-flow.jsonl`.

## Accepted Static Facts

- `query-hits.jsonl` row 1 shows the `accounts-page-CJFT2P5o.js` import
  accounts success handler invalidates `queryKey:["quota-history"]` after the
  `import_accounts_from_file` mutation succeeds.
- The same row keeps the invalidation before the imported-count toast branch,
  so both zero-import warning and positive-import success branches see the
  quota-history query invalidated after the backend import returns.
- `frontend-control-flow.jsonl` row 3 binds that page mutation to terminal
  command `import_accounts_from_file` with arg keys `filePath`,
  `overwriteExisting`, and `selectedKeys`.
- `query-hits.jsonl` row 2 shows the accounts refresh wrapper invalidates
  `queryKey:["quota-history"]` after its snapshot refresh function returns.
- The refresh wrapper includes a silent retry path before invalidation; the
  invalidation is after the successful retry-or-first-attempt result and before
  the visible success toast branch.
- `query-hits.jsonl` row 9 shows app-level `loadSnapshot(false)` updates
  snapshot caches and invalidates `queryKey:["quota-history"]`.
- `frontend-control-flow.jsonl` row 17 binds that app-level callback to
  terminal command `load_snapshot` with arg field `localOnly`.
- `query-hits.jsonl` row 10 shows app-level `refreshUsageSnapshot()` updates
  the same snapshot caches and invalidates `queryKey:["quota-history"]`.
- `frontend-control-flow.jsonl` row 18 binds that callback to terminal command
  `refresh_usage_snapshot` with no frontend arg keys.
- `ipc-contracts.jsonl` rows 1 and 2 confirm the shared frontend wrapper maps
  `loadSnapshot(false)` to `load_snapshot` with `{localOnly:t}` and
  `refreshUsageSnapshot()` to `refresh_usage_snapshot` with no args.
- `ipc-contracts.jsonl` row 16 confirms `importAccountsFromFile` maps to
  `import_accounts_from_file` with `{filePath, overwriteExisting,
  selectedKeys:o??null}`.
- `ipc-contracts.jsonl` row 81 confirms `loadQuotaHistory` maps to
  `load_quota_history` with `{accountKey:t}`; invalidation therefore targets
  the same query family consumed by the quota-history chart reducer.

## Boundary

This reducer closes only the static frontend cache invalidation side-effect
boundary. It does not prove:

- exact runtime Tauri request/response IPC envelope bytes;
- runtime TanStack Query refetch timing or rendered chart output under concrete
  fixtures;
- backend quota history source path bytes or before-after file bytes;
- runtime point ordering, timestamp format, account filtering, corrupt-line, or
  permission-error behavior;
- durable quota append bytes and retention rewrite behavior;
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
