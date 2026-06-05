# HOTSPOT-HAS-NOTCH-FULL-CHAIN-109

## Scope

`has_notch` / Liu-hai overlay support probe, macOS AiMaMi 1.0.9. This is an additive system leaf not present in the prior six-command system primary list.

## Frontend Trigger

- Settings page: TanStack query `["has-notch"]` calls `api.hasNotch()` with `staleTime: Infinity`.
- API wrapper: `api.hasNotch()` executes terminal `invoke<boolean>("has_notch")` and catches failures to `false`.
- UI consumption: `hasNotch=false` disables the hotspot switch and uses `settings.hotspotNotSupported`; `hasNotch=true` enables the `["hotspot-enabled"]` query and switch mutation path.
- Startup shell: Tauri setup reads persisted hotspot enabled state, registers relayout observers, and only creates the hotspot window when `platform::screen::has_notch_screen()` is true.

## Backend / IDA

- `0x100330730` `codexmate_lib::commands::hotspot::has_notch`: Tauri command wrapper; sends WRY user message to main thread, waits on mpsc/mpmc receiver, writes bool into return slot, or formats Tauri/recv error.
- `0x1003e1c64` `codexmate_lib::platform::screen::has_notch_screen`: macOS 12+ AppKit `NSScreen` scan; requires main thread; true when `auxiliaryTopLeftArea` and `auxiliaryTopRightArea` both exist and leave a gap.
- `0x10032f24c` `create_hotspot_window` and `0x10032f75c` `refresh_hotspot_on_main` confirm the shell consumer uses main-thread window operations separately from the read-only notch probe.

## Thread / Side Effect Model

`has_notch` is synchronous from frontend perspective but internally performs main-thread callback handoff plus receiver wait. The probe is read-only: no filesystem, HTTP, process, registry, keychain, or persistence write. The only possible UI/window side effect belongs to separate hotspot window commands after this bool is consumed.

## DTO / Error

Input: none. Output: bool. Backend error surface: `run_on_main_thread` error or `rx.recv` error as `String`. Frontend acceptance: any invoke failure is intentionally mapped to `false`.

## Gate

This leaf is closed to `readyToImplement/full_leaf_100` for macOS only in raw leaf `raw/aimami/1.0.9/macos/system/has_notch/`. The existing system bundle primary gate counts are not rewritten here because their producer is separate.
