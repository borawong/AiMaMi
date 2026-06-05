# has_notch platform delta - Windows 1.0.9

Scope: supplemental platform-difference note. This file does not promote any Windows system gate.

## Result

`has_notch` is a macOS-only accepted leaf in `raw/aimami/1.0.9/macos/system/has_notch/`. No accepted Windows `has_notch` target exists in the current `windows-1.0.9-system` target universe.

## Current source archive behavior

- `src/components/settings/settings-page.tsx` hides the Hotspot setting unless `supportsHotspot` is true.
- `src/lib/api.ts` has `api.hasNotch() -> invoke<boolean>("has_notch").catch(() => false)`, but current source archive uses the macOS guard before exposing the switch.
- `src-tauri/src/platform/screen.rs` non-mac implementation returns `false`.

## Consumer rule

Do not open a Windows implementation task for `has_notch` unless a new Windows same-platform accepted target is produced. The correct current delta is: macOS has a Liu-hai/Hotspot switch path; Windows does not.
