use crate::application::service::BackendServices;
use crate::contracts::CoreEnvelope;
use crate::core::error::CoreError;
use serde_json::Value;

pub(crate) struct TauriAppState {
    services: BackendServices,
    app: tauri::AppHandle,
}

impl TauriAppState {
    pub(crate) fn new(app: tauri::AppHandle) -> Self {
        Self {
            services: BackendServices::default(),
            app,
        }
    }

    pub(crate) fn services(&self) -> &BackendServices {
        &self.services
    }

    pub(crate) fn focus_main_window(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        let window = crate::platform::window::TauriWindow::new(&self.app);
        self.services.system().focus_main_window(&window)
    }
}
