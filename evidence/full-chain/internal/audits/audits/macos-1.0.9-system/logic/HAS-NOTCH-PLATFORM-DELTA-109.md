# has_notch platform delta - AiMaMi 1.0.9

Scope: supplemental platform-difference note for the existing `has_notch` macOS leaf.

## macOS

`has_notch` is closed in `raw/aimami/1.0.9/macos/system/has_notch/` at `readyToImplement/full_leaf_100`.

Current source archive frontend path:

- `src/components/settings/settings-page.tsx`: Settings page guards the Hotspot section with `supportsHotspot` and queries `["has-notch"]`.
- `api.hasNotch()` -> `invoke<boolean>("has_notch").catch(() => false)`.
- `hasNotch=false` disables the Hotspot switch and shows `settings.hotspotNotSupported`.
- `hasNotch=true` enables `["hotspot-enabled"]`, `api.getHotspotEnabled()`, and `api.setHotspotEnabled(enabled)` mutation.

Backend/startup path:

- `src-tauri/src/commands/hotspot.rs::has_notch` runs the probe on the main thread and calls `platform::screen::has_notch_screen()`.
- `src-tauri/src/lib.rs` checks persisted hotspot enabled state plus `platform::screen::has_notch_screen()` before creating the hotspot window at startup.

## Windows

There is no accepted Windows `has_notch` ready/full target in the current `windows-1.0.9-system` package. Treat this as a platform delta, not an unclosed Windows equivalent command.

Current source archive source hides the Hotspot setting behind `isMacPlatform()` and the non-mac screen implementation returns `false`. A frontend string/wrapper hit alone is not Windows proof and must not be promoted.
