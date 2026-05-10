pub struct HotspotFrame {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[cfg(target_os = "macos")]
fn macos_version_major() -> isize {
    use objc2_foundation::NSProcessInfo;
    NSProcessInfo::processInfo()
        .operatingSystemVersion()
        .majorVersion
}

/// Returns true if any connected screen has a notch (macOS 12+ with auxiliary areas).
#[cfg(target_os = "macos")]
pub fn has_notch_screen() -> bool {
    use objc2_app_kit::NSScreen;
    use objc2_foundation::MainThreadMarker;

    if macos_version_major() < 12 {
        return false;
    }

    let Some(mtm) = MainThreadMarker::new() else {
        return false;
    };

    let screens = NSScreen::screens(mtm);
    for i in 0..screens.count() {
        let screen = screens.objectAtIndex(i);
        let left = screen.auxiliaryTopLeftArea();
        let right = screen.auxiliaryTopRightArea();
        if left.size.width > 0.0
            && right.size.width > 0.0
            && right.origin.x > (left.origin.x + left.size.width)
        {
            return true;
        }
    }
    false
}

/// Compute the hotspot window frame in AppKit coordinates (Y-up, origin at bottom-left).
/// Returns None if no screen has a notch.
#[cfg(target_os = "macos")]
pub fn compute_hotspot_frame() -> Option<HotspotFrame> {
    use objc2_app_kit::NSScreen;
    use objc2_foundation::MainThreadMarker;

    if macos_version_major() < 12 {
        return None;
    }

    let Some(mtm) = MainThreadMarker::new() else {
        return None;
    };

    let screens = NSScreen::screens(mtm);
    let count = screens.count();
    if count == 0 {
        return None;
    }

    let mut notch_screen = None;
    for i in 0..count {
        let screen = screens.objectAtIndex(i);
        let left = screen.auxiliaryTopLeftArea();
        let right = screen.auxiliaryTopRightArea();
        if left.size.width > 0.0
            && right.size.width > 0.0
            && right.origin.x > (left.origin.x + left.size.width)
        {
            notch_screen = Some(i);
            break;
        }
    }

    let idx = notch_screen?;
    let screen = screens.objectAtIndex(idx);
    let frame = screen.frame();
    let left = screen.auxiliaryTopLeftArea();
    let right = screen.auxiliaryTopRightArea();

    let band_height = left.size.height.max(right.size.height);
    let notch_width = right.origin.x - (left.origin.x + left.size.width);

    let width = (notch_width + 180.0).max(380.0);
    let height = band_height;
    let x = frame.origin.x + (frame.size.width - width) / 2.0;
    let y = frame.origin.y + frame.size.height - height;

    Some(HotspotFrame {
        x,
        y,
        width,
        height,
    })
}

#[cfg(not(target_os = "macos"))]
pub fn has_notch_screen() -> bool {
    false
}

#[cfg(not(target_os = "macos"))]
pub fn compute_hotspot_frame() -> Option<HotspotFrame> {
    None
}
