# Windows 1.0.9 system frontend current source archive consumer chain

Scope: current source archive source on latest `origin/master` as fetched on
2026-06-03, plus the existing `windows-1.0.9-system` IDA consumer bundle. This
file is an additive consumer path supplement. It does not change
`manifest.json`, `gate-report.json`, owner state, or gate state.

## Producer boundary

- target_batch=aimami/1.0.9/windows/system
- commands=force_kill_codex, reset_codex_config, get_image_compat,
  set_image_compat, get_system_info, check_update_installability
- rule_files_read=rust-reverse-pipeline/SKILL.md; source archive root AGENTS/CLAUDE;
  source archive AGENTS/CLAUDE/GATE-SPEC/AI-EXECUTION-QUEUE;
  target AGENTS/CLAUDE; target manifest/gate-report/pointers; INDEX hits
- current owner=claude-sonnet-4-6 / <workstation> plus
  dual-platform closure session for canonical system bundle
- allowed write mode=additive logic note only
- takeover sensitive-field status=none

## Current source archive frontend paths

### force_kill_codex

- UI trigger: `src/components/maintenance/maintenance-page.tsx`, maintenance
  action card "Force Quit Codex".
- Guard/state: confirmation dialog, pending mutation state, disabled action
  while mutation is running, toast on success/failure.
- Wrapper: `src/lib/api.ts` `api.forceKillCodex()`.
- IPC terminal in current source archive: `invoke("force_kill_codex")`.
- Windows upstream gate: the canonical Windows bundle keeps this command at
  `strictImplementationUse`, not `readyToImplement`, because the Windows 1.0.9
  AiMaMi binary evidence records no Tauri IPC command string and treats the
  behavior as an internal helper/product-decision start surface.
- Consumer action: do not mark Windows `force_kill_codex` highest/full unless a
  canonical producer closes dim1 with an accepted Windows same-platform IPC or
  accepted substitute and updates the canonical gate.

### reset_codex_config

- UI trigger: `src/components/maintenance/maintenance-page.tsx`, maintenance
  reset action card.
- Guard/state: destructive confirmation dialog, pending mutation state, toast,
  reset result text when returned.
- Wrapper: `src/lib/api.ts` `api.resetCodexConfig()`.
- IPC terminal: `invoke("reset_codex_config")`.
- Windows backend/gate pointer: `gate-report.json` marks this command
  `readyToImplement`; IDA confirms Windows atomic write behavior via
  `MoveFileExW` and Windows-specific config/catalog side effects.

### get_image_compat / set_image_compat

- Current source archive source check: no active `api.getImageCompat()` /
  `api.setImageCompat()` wrapper or visible UI consumer was found in `src/` on
  the fetched current source archive source.
- Windows upstream gate: `gate-report.json` marks both commands
  `readyToImplement` with Windows-specific CODEX_HOME/path/CRLF handling and
  response builder details.
- Consumer action: backend behavior is ready, but a source archive implementation still
  needs an explicit current-source archive render surface and TanStack Query/mutation path
  if product wants to expose image compatibility controls.

### get_system_info

- Wrapper: `src/lib/api.ts` `api.getSystemInfo()`.
- IPC terminal: `invoke("get_system_info")`.
- Current visible usage: no primary page call site was found in current `src/`
  outside API/tests; tests assert preservation of backend `os`, `arch`,
  `hostname`, and version semantics.
- Windows backend/gate pointer: `gate-report.json` marks this command
  `readyToImplement`; field keys are Windows-confirmed in IDA.

### check_update_installability

- UI trigger: `src/main-app.tsx` startup/mount path.
- Guard/state: app-level startup effect opens the installability/update dialog
  when the response indicates user action.
- Current source archive wrapper: `src/lib/api.ts` `api.checkUpdateInstallability()`.
- Current source archive IPC terminal: `invoke("check_update_installability")`.
- Windows upstream gate note: the canonical Windows bundle records the upstream
  Windows command name as `restart_codex` for this closure and marks command
  rename true; do not erase that platform fact when implementing the current source archive
  wrapper surface.
- Windows backend/gate pointer: `gate-report.json` marks this command
  `readyToImplement`; IDA confirms registry/path search and quit/restart
  side-effect boundaries.

## has_notch / hotspot platform delta

- Current source archive settings UI has a macOS-only Hotspot/Notch Overlay switch guarded
  by `supportsHotspot` and `api.hasNotch()`.
- Windows has no accepted `has_notch` target in `windows-1.0.9-system`.
- Correct consumer behavior: record Windows as "not a Windows upstream target"
  for the notch overlay, not as a missing Windows command that should be
  promoted. The UI must stay hidden/disabled on non-macOS platforms unless a
  separate source archive product decision introduces a Windows feature.

## Consumer notes

- Windows system primary is currently `5/6 readyToImplement`; the remaining
  primary command is `force_kill_codex` at `strictImplementationUse`.
- macOS `has_notch`/hotspot is a platform delta and must be documented beside
  system settings, but it must not be copied into the Windows upstream target
  universe.
- This file only makes the current-source archive frontend path explicit for consumers. It
  is not a canonical gate promotion.
