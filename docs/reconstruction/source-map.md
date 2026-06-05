# Public Source Map

This map describes the current public repository structure for reconstruction
work. All paths are repository-relative.

## Project Metadata

| Item | Value |
| --- | --- |
| Package | `aimami` |
| Public version in repository | `1.0.0` |
| License | Apache-2.0 |
| Desktop product name | `AiMaMi` |
| Stack | Tauri 2 + React + Rust |
| Frontend build | Vite + TypeScript |

## Top-Level Structure

| Path | Role |
| --- | --- |
| `src/` | React app source |
| `src-tauri/` | Tauri 2 desktop shell and Rust commands |
| `scripts/` | Repository utility scripts |
| `assets/` | Public image assets |
| `evidence/binary-manifests/1.0.9/i64-databases.json` | Bundle status, sizes, and hashes |
| External: `https://github.com/MapleEve/OpenAiMami-IDB` at `1.0.9/AiMaMi-1.0.9-i64-databases.zip` | macOS and Windows `.i64` reference database bundle |
| `package.json` | Frontend scripts and dependency declarations |
| `src-tauri/Cargo.toml` | Rust package and dependency declarations |
| `src-tauri/tauri.conf.json` | Tauri app and bundle configuration |

## Frontend Areas

| Path | Role |
| --- | --- |
| `src/main.tsx` | React boot entry |
| `src/App.tsx` | App root wrapper |
| `src/main-app.tsx` | Main route state, page loading, and shell composition |
| `src/components/layout/` | App sidebar and layout components |
| `src/components/custom-instructions/` | Custom instruction workflow UI |
| `src/components/mcp/` | MCP management UI |
| `src/components/skills/` | Skills management UI |
| `src/components/maintenance/` | Maintenance actions UI |
| `src/components/settings/` | Settings UI |
| `src/components/update/` | Update overlay UI |
| `src/components/runtime/` | Runtime-related dialogs |
| `src/components/ui/` | Shared UI primitives |
| `src/hooks/` | React hooks |
| `src/locales/` | Localization resources |
| `src/types/` | Shared TypeScript types |

## Navigation Surface

The public sidebar routes found in `src/components/layout/sidebar.tsx` are:

- `overview`
- `customInstructions`
- `mcp`
- `skills`
- `maintenance`
- `settings`

## Tauri Command Surface

The command registration point is `src-tauri/src/lib.rs`. Public command modules
are under `src-tauri/src/commands/`.

| Module | Commands |
| --- | --- |
| `custom_instructions.rs` | `load_custom_instruction_state`, `preview_custom_instruction_apply`, `apply_custom_instruction`, `clear_custom_instruction_block`, `rollback_custom_instruction` |
| `hotspot.rs` | `has_notch`, `get_hotspot_enabled`, `set_hotspot_enabled`, `focus_main_window`, `hotspot_ready` |
| `mcp.rs` | `load_mcp_servers`, `upsert_mcp_server`, `set_mcp_server_enabled`, `remove_mcp_server` |
| `skills.rs` | `load_installed_skills`, `load_skill_backups`, `import_skill`, `remove_skill`, `restore_skill_backup`, `delete_skill_backup` |
| `system.rs` | `clean`, `rebuild_registry`, `set_auto_switch`, `configure_auto_switch`, `set_api_proxy_config`, `get_usage_refresh_interval`, `set_usage_refresh_interval`, `test_api_proxy_config`, `detect_api_proxy_config`, `run_daemon_once`, `diagnose`, `restart_codex`, `load_bootstrap_state`, `get_system_info`, `graceful_restart_for_update`, `check_update_installability`, `open_path` |

Only commands registered through `tauri::generate_handler!` are part of the
frontend IPC surface. Helper functions in command modules are not treated as IPC
entries unless registered.

## Build And Packaging

| Path | Notes |
| --- | --- |
| `package.json` | Defines `dev`, `dev:web`, `build`, `preview`, and `tauri` scripts. |
| `src-tauri/tauri.conf.json` | Uses Tauri bundle settings and `../dist` frontend output. |
| `src-tauri/Cargo.toml` | Defines Rust package metadata, Apache-2.0 license, Tauri 2 dependencies, and platform-specific dependencies. |

## Asset Map

Public assets in `assets/` include application icons and UI images. Treat these
as publishable repository assets unless a separate review marks a specific file
out of scope.

The reference database bundle is published outside this source repository:

`https://github.com/MapleEve/OpenAiMami-IDB`

Archive path:

`1.0.9/AiMaMi-1.0.9-i64-databases.zip`

Use `evidence/binary-manifests/1.0.9/i64-databases.json` as the source of truth
for archive status, sizes, and hashes.
