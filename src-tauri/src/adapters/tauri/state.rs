use crate::application::service::BackendServices;

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

    pub(crate) fn app_handle(&self) -> &tauri::AppHandle {
        &self.app
    }
}
