# Windows 1.0.9 System Force Kill Boundary

target_batch=AiMaMi/1.0.9/windows/system
producer=Codex
mode=additive_boundary_review
owner_context=existing windows-1.0.9-system producer
collision=producer_owned_gate
takeover=none

This note separates the consumer command universe from the internal helper
universe for Windows system.

## IDA Fact

- `0x1402507B0` is the internal `force_kill_codex_by_imagename_sys` helper.
- It is reached from restart/update quit fallback paths.
- It uses the Windows process-kill path around `taskkill /IM Codex.exe` and
  process enumeration helpers.
- The PE does not expose a same-platform Tauri command string
  `force_kill_codex`.

## Consumer Boundary

For Windows 1.0.9 consumer implementation, the IPC command universe is:

- `reset_codex_config`
- `get_image_compat`
- `set_image_compat`
- `get_system_info`
- `restart_codex`

Those five IPC commands are already recorded as `readyToImplement` in the
current package. `force_kill_codex` is an implementation helper for the
restart/update path, not a standalone Windows IPC surface.

## Gate Boundary

This file does not rewrite `gate-report.json`, `manifest.json`, or
`data/tier-matrix.json`. If the package owner later updates the canonical gate,
the consumer-facing wording should be `5/5 Windows system IPC commands ready`
with `force_kill_codex` retained as an internal helper/product decision.
