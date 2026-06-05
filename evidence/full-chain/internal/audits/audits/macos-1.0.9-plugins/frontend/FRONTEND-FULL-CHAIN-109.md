# Frontend Full Chain - AiMaMi 1.0.9 macOS plugins

Scope: additive frontend/current-source archive consumer chain for the accepted macOS plugins backend closure. This file records the current source archive source gap and does not change gate state.

## Upstream plugin surface

Accepted backend leaves cover `list_plugins`, `toggle_plugin`, `get_plugin_config`, `update_plugin_config`, registry/store helpers, builtin plugin DTO helpers, and serializer leaves.

## Current source archive frontend state

- No `src/components/plugins` route/page is present.
- No `list_plugins`, `toggle_plugin`, `get_plugin_config`, or `update_plugin_config` wrapper exists in `src/lib/api.ts`.
- No matching Tauri command registration is present in `src-tauri/src/lib.rs`.
- Current plugin-related source hits are source archive product-workflow marketplace/project-config scaffolding, not AiMaMi plugin registry management.

## Shell load point

No plugin registry bootstrap slice, sidebar route, page mount, query field, or default shell load point exists in current source archive source.

## Implementation delta

Consumers implementing upstream plugin registry parity must add the missing frontend route/API/command/mock chain. The accepted IDA backend closure is not enough to claim current source archive already exposes the plugin UI.

