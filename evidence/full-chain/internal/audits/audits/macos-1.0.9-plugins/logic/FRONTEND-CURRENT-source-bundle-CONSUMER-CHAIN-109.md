# Frontend current source archive consumer chain - plugins 1.0.9

Scope: supplemental frontend comparison. It does not rewrite the existing plugins backend/registry/store gate.

Current repository baseline was refreshed with `git fetch origin --prune`; checked branch `master` equals `origin/master` at `8327295d0233933a8fcbf2dda24e5bd56fc61693`.

## Upstream packaged frontend

AiMaMi 1.0.9 packaged frontend exposes these wrappers in `raw/aimami/1.0.9/macos/frontend/macos-109-frontend-ccf-found-app/frontend/frontend-contract-report.md`:

- `list_plugins` -> wrapper `listPlugins`, no args.
- `toggle_plugin` -> wrapper `togglePlugin`, args `pluginId`, `enabled`.
- `get_plugin_config` -> wrapper `getPluginConfig`, arg `pluginId`.
- `update_plugin_config` -> wrapper `updatePluginConfig`, args `pluginId`, `settings`.

## Current source archive source comparison

Current source archive `master` source has no visible `src/components/plugins/` page, no `plugins` route in `src/types/navigation.test.ts`, and no `src/lib/api.ts` wrappers for `list_plugins`, `toggle_plugin`, `get_plugin_config`, or `update_plugin_config`.

Current source archive uses Codex marketplace/plugin packaging under project configuration/onboarding (`src-tauri/src/core/marketplace.rs`, `src-tauri/src/core/project_config.rs`) instead of the upstream AiMaMi plugin registry UI. That is a product/source delta, not upstream plugin frontend parity.

## Consumer consequence

Backend plugins 13/13 full leaf remains usable as upstream behavior evidence for the closed backend/store/builtin registry. Frontend implementation still needs an explicit product decision:

- restore an upstream-like Plugins page and API wrappers, or
- keep source archive marketplace/project-plugin model and treat upstream plugin UI absence as intentional product delta.

Do not claim current source archive already has upstream plugins UI/TanStack coverage.
