use crate::application::service::BackendServices;
use crate::platform::window::TauriWindow;

pub(crate) struct TauriAppState {
    services: BackendServices,
}

impl TauriAppState {
    pub(crate) fn new(app: tauri::AppHandle) -> Self {
        Self {
            services: BackendServices::with_window(Box::new(TauriWindow::new(app))),
        }
    }

    pub(crate) fn services(&self) -> &BackendServices {
        &self.services
    }
}
