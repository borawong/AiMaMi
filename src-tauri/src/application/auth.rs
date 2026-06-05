//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: application::auth
//! Current role: stub use case
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::contracts::{
    ApiConfigPayload, ApiModePayload, ApiProxyConfigPayload, ApiProxyDetectPayload, ApiProxyMode,
    ApiProxyTestPayload, CoreEnvelope,
};

#[derive(Default)]
pub(crate) struct AuthService;

impl AuthService {
    pub(crate) fn set_api_proxy_config(
        &self,
        mode: ApiProxyMode,
        url: Option<String>,
    ) -> CoreEnvelope<ApiModePayload> {
        CoreEnvelope::no_op(
            ApiModePayload {
                api: ApiConfigPayload {
                    proxy: ApiProxyConfigPayload { mode, url },
                },
            },
            "set_api_proxy_config",
        )
    }

    pub(crate) fn test_api_proxy_config(
        &self,
        _mode: ApiProxyMode,
        _url: Option<String>,
    ) -> CoreEnvelope<ApiProxyTestPayload> {
        CoreEnvelope::no_op(ApiProxyTestPayload::default(), "test_api_proxy_config")
    }

    pub(crate) fn detect_api_proxy_config(&self) -> CoreEnvelope<ApiProxyDetectPayload> {
        CoreEnvelope::ok_with_warnings(
            ApiProxyDetectPayload::default(),
            vec![crate::contracts::stub_warning("api_proxy_detection")],
        )
    }
}
