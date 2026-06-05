# SYSTEM-DIFF - has_notch macOS 1.0.9

## Platform Boundary

`has_notch` is macOS-only behavior in practice. The macOS platform leaf uses AppKit `NSScreen` auxiliary top areas and requires main thread. Non-macOS source returns false for the platform probe and cannot be inferred from this macOS proof.

## upstream Current Mapping

upstream exposes the leaf in Settings as the Liu-hai/hotspot support probe and in startup shell initialization as the guard before creating the hotspot window. Current upstream uses the same command name and no-arg DTO.

## Side Effects

The `has_notch` command itself is read-only/no-write. Separate hotspot commands own persisted enablement and window creation/destruction.
