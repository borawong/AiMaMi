# AI Handoff

status: `plugins_frontend_acceptance_mapping_static_no_gate_promotion`

evidence_root: `<source-location>/raw/aimami/1.0.9/windows/plugins_frontend_acceptance_mapping`

intermediate_root: `<source-location>/intermediate/aimami/1.0.9/windows/plugins_frontend_acceptance_mapping`

handoff_root: `<source-location>/aimami/1.0.9/windows-x64/plugins_frontend_acceptance_mapping`

platforms: Windows x64 only.

do_not_infer: Do not infer Windows gate from macOS evidence. Do not promote current upstream repo readiness from upstream static UI evidence. Do not treat API-wrapper-only `get_plugin_config` / `update_plugin_config` as visible UI control-flow.

target_universe:

- `list_plugins`
- `toggle_plugin`
- `get_plugin_config`
- `update_plugin_config`

coverage:

- `list_plugins`: frontend UI trigger and frontend consumption mapped; acceptance draft ready.
- `toggle_plugin`: frontend UI trigger and optimistic/invalidation consumption mapped; acceptance draft ready, but no toast/runtime-disabled proof.
- `get_plugin_config`: wrapper/IPC only; visible UI trigger missing; acceptance draft blocked.
- `update_plugin_config`: wrapper/IPC only; visible UI trigger missing; acceptance draft blocked.

current_repo_static_status:

- `src/lib/api.ts`: no plugins wrappers.
- `src/types/navigation.ts`: no `plugins` route.
- `src/components/layout/sidebar.tsx`: no plugins nav item.
- `src/locales/zh.json` and `src/locales/en.json`: no `nav.plugins`.
- `e2e/tauri-mock.ts`: no plugins handlers.
- `src` and `e2e`: no business plugins implementation hits.

gate:

- consumerStartReady: false
- strictImplementationUse: false
- readyToImplement: false
- implementation_use: false
- gate_accepted: false
- full_leaf_100: false

unknowns:

- Runtime acceptance for Windows 1.0.9 was not executed.
- Toggle toast/disabled behavior was not proven by the existing static frontend UI-state bundle.
- Config get/update visible UI surface is absent in the Windows frontend evidence and current upstream repo.
- Existing backend rows remain static/no-promotion references.

non_actions:

- Did not write `INDEX.jsonl`.
- Did not write `task-plan.json`.
- Did not run AiMaMi.
- Did not create backend reverse artifacts.

