use crate::core::repository::Repository;
use tauri::menu::{Menu, MenuBuilder, MenuItem};
use tauri::{AppHandle, Manager, Wry};

const TRAY_ID: &str = "main";
const OPEN_MAIN_ID: &str = "tray_open_main";
const QUIT_ID: &str = "tray_quit";
const BOOTSTRAP_HEADER_ID: &str = "tray_bootstrap_header";
const BOOTSTRAP_TITLE_ID: &str = "tray_bootstrap_title";
const BOOTSTRAP_SUBTITLE_ID: &str = "tray_bootstrap_subtitle";

pub fn create_bootstrap_tray_menu(app: &AppHandle) -> Result<Menu<Wry>, String> {
    MenuBuilder::new(app)
        .item(
            &MenuItem::with_id(app, BOOTSTRAP_HEADER_ID, "AiMaMi", false, None::<&str>)
                .map_err(|e| e.to_string())?,
        )
        .item(
            &MenuItem::with_id(app, BOOTSTRAP_TITLE_ID, "AiMaMi", true, None::<&str>)
                .map_err(|e| e.to_string())?,
        )
        .item(
            &MenuItem::with_id(
                app,
                BOOTSTRAP_SUBTITLE_ID,
                "Ready",
                true,
                None::<&str>,
            )
            .map_err(|e| e.to_string())?,
        )
        .separator()
        .item(
            &MenuItem::with_id(app, OPEN_MAIN_ID, "Open AiMaMi", true, None::<&str>)
                .map_err(|e| e.to_string())?,
        )
        .separator()
        .item(
            &MenuItem::with_id(app, QUIT_ID, "Quit", true, None::<&str>)
                .map_err(|e| e.to_string())?,
        )
        .build()
        .map_err(|e| e.to_string())
}

pub fn create_tray_menu(app: &AppHandle) -> Result<Menu<Wry>, String> {
    create_bootstrap_tray_menu(app)
}

pub fn refresh_tray_menu(app: &AppHandle) {
    let Ok(menu) = create_tray_menu(app) else {
        return;
    };

    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        let _ = tray.set_menu(Some(menu));
    }
}

pub fn handle_tray_menu_event(app: &AppHandle, event_id: &str) {
    if matches!(
        event_id,
        OPEN_MAIN_ID | BOOTSTRAP_TITLE_ID | BOOTSTRAP_SUBTITLE_ID
    ) {
        let _ = crate::commands::hotspot::focus_main_window(app.clone());
        return;
    }

    if event_id == QUIT_ID {
        app.exit(0);
    }
}
