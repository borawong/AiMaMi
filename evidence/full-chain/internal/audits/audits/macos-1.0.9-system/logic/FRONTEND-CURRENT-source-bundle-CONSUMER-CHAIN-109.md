# macOS 1.0.9 system frontend current source archive consumer chain

Scope: current source archive source on latest `origin/master` as fetched on
2026-06-03, plus the existing `macos-1.0.9-system` IDA consumer bundle. This
file is an additive consumer path supplement. It does not change
`manifest.json`, `gate-report.json`, owner state, or gate state.

## Producer boundary

- target_batch=aimami/1.0.9/macos/system
- commands=force_kill_codex, reset_codex_config, get_image_compat,
  set_image_compat, get_system_info, check_update_installability, has_notch
- rule_files_read=rust-reverse-pipeline/SKILL.md; source archive root AGENTS/CLAUDE;
  source archive AGENTS/CLAUDE/GATE-SPEC/AI-EXECUTION-QUEUE;
  target AGENTS/CLAUDE; target manifest/gate-report/pointers; INDEX hits
- current owner=claude-sonnet-4-6 / <workstation> for canonical system
  bundle
- allowed write mode=additive logic note only
- takeover sensitive-field status=none

## Current source archive frontend paths

### force_kill_codex

- UI trigger: `src/components/maintenance/maintenance-page.tsx`, maintenance
  action card "Force Quit Codex".
- Guard/state: confirmation dialog, pending mutation state, disabled action
  while mutation is running, toast on success/failure.
- Wrapper: `src/lib/api.ts` `api.forceKillCodex()`.
- IPC terminal: `invoke("force_kill_codex")`.
- Frontend consumption: current source archive tests consume
  `terminatedProcessCount`; upstream macOS bundle records `CoreEnvelope<Vec<u32>>`
  PIDs. Implementation consumers must keep the DTO delta explicit if mapping
  to source archive's `terminatedProcessCount` UX copy.
- Backend/gate pointer: `gate-report.json` marks macOS readyToImplement/full
  leaf for this command.

### reset_codex_config

- UI trigger: `src/components/maintenance/maintenance-page.tsx`, maintenance
  reset action card.
- Guard/state: destructive confirmation dialog, pending mutation state, toast,
  reset result text when returned.
- Wrapper: `src/lib/api.ts` `api.resetCodexConfig()`.
- IPC terminal: `invoke("reset_codex_config")`.
- Frontend consumption: current source archive renders reset result fields returned by the
  API wrapper; upstream macOS bundle confirms direct `config.toml` truncation
  semantics and no rename/backup in the owner body.
- Backend/gate pointer: `gate-report.json` marks macOS readyToImplement/full
  leaf.

### get_image_compat / set_image_compat

- Current source archive source check: no active `api.getImageCompat()` /
  `api.setImageCompat()` wrapper or visible UI consumer was found in `src/` on
  the fetched current source archive source.
- Upstream consumer state: the `macos-1.0.9-system` bundle already carries the
  IDA-backed config behavior and acceptance mapping for both commands.
- Consumer action: treat the upstream behavior as ready backend behavior, but
  any source archive implementation still needs a new current-source archive render surface and query
  hook if product wants to expose image compatibility controls.

### get_system_info

- Wrapper: `src/lib/api.ts` `api.getSystemInfo()`.
- IPC terminal: `invoke("get_system_info")`.
- Current visible usage: no primary page call site was found in current `src/`
  outside API/tests; tests assert preservation of backend `os`, `arch`,
  `hostname`, and version semantics.
- Backend/gate pointer: `gate-report.json` marks macOS readyToImplement/full
  leaf. UI implementation may use the wrapper directly but must not invent
  extra normalized fields beyond the DTO contract.

### check_update_installability

- UI trigger: `src/main-app.tsx` startup/mount path.
- Guard/state: runs through app-level startup effect; opens update/installability
  dialog state when the returned code requires user attention.
- Wrapper: `src/lib/api.ts` `api.checkUpdateInstallability()`.
- IPC terminal: `invoke("check_update_installability")`.
- Backend/gate pointer: macOS `gate-report.json` confirms App Translocation,
  `/Volumes` read-only location, quarantine probe, and DTO fields for
  installability.

### has_notch and hotspot

- UI trigger: `src/components/settings/settings-page.tsx` Hotspot/Notch Overlay
  switch.
- Guard/state: `supportsHotspot` is macOS-only; `["has-notch"]` query calls
  `api.hasNotch()`; `["hotspot-enabled"]` only loads when macOS and
  `hasNotch=true`.
- Wrapper: `src/lib/api.ts` `api.hasNotch()`.
- IPC terminal: `invoke("has_notch").catch(() => false)`.
- Related IPC: `get_hotspot_enabled`, `set_hotspot_enabled`, `hotspot_ready`.
- Backend path: `src-tauri/src/commands/hotspot.rs` command registration plus
  `src-tauri/src/platform/screen.rs` notch detection and hotspot frame
  computation.
- Startup path: `src-tauri/src/lib.rs` checks persisted hotspot setting and
  `platform::screen::has_notch_screen()` before creating the hotspot window.
- Platform delta: this is macOS-only. Windows does not have an accepted
  `has_notch` target in the Windows 1.0.9 system bundle.

## Consumer notes

- macOS system primary is currently `6/6 readyToImplement` in the canonical
  system bundle.
- `has_notch`/hotspot is a current source archive macOS UI/platform feature and should be
  recorded as a macOS-only frontend/platform delta, not as a Windows gap.
- This file only makes the current-source archive frontend path explicit for consumers. It
  is not a canonical gate promotion.
