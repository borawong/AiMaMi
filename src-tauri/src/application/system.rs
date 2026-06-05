//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: application::system
//! Current role: stub use case
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::application::{auth::AuthService, daemon::DaemonService, registry::RegistryService};
use crate::contracts::{
    ApiModePayload, ApiProxyDetectPayload, ApiProxyMode, ApiProxyTestPayload,
    AutoSwitchConfigPayload, BootstrapStatePayload, CleanPayload, CoreEnvelope, DaemonRunPayload,
    DiagnosePayload, DiagnosePlatform, RebuildRegistryPayload, SystemInfo,
    UpdateInstallabilityPayload,
};

#[derive(Default)]
pub(crate) struct SystemService {
    registry: RegistryService,
    auth: AuthService,
    daemon: DaemonService,
}

impl SystemService {
    pub(crate) fn clean(&self) -> CoreEnvelope<CleanPayload> {
        self.registry.clean()
    }

    pub(crate) fn rebuild_registry(&self) -> CoreEnvelope<RebuildRegistryPayload> {
        self.registry.rebuild_registry()
    }

    pub(crate) fn set_auto_switch(&self, enabled: bool) -> CoreEnvelope<AutoSwitchConfigPayload> {
        CoreEnvelope::no_op(
            AutoSwitchConfigPayload {
                auto_switch: crate::contracts::AutoSwitchStatusPayload {
                    enabled,
                    ..Default::default()
                },
            },
            "set_auto_switch",
        )
    }

    pub(crate) fn configure_auto_switch(
        &self,
        threshold_5h_percent: Option<i32>,
        threshold_weekly_percent: Option<i32>,
    ) -> CoreEnvelope<AutoSwitchConfigPayload> {
        CoreEnvelope::no_op(
            AutoSwitchConfigPayload {
                auto_switch: crate::contracts::AutoSwitchStatusPayload {
                    threshold_5h_percent: threshold_5h_percent.unwrap_or(80),
                    threshold_weekly_percent: threshold_weekly_percent.unwrap_or(80),
                    ..Default::default()
                },
            },
            "configure_auto_switch",
        )
    }

    pub(crate) fn set_api_proxy_config(
        &self,
        mode: ApiProxyMode,
        url: Option<String>,
    ) -> CoreEnvelope<ApiModePayload> {
        self.auth.set_api_proxy_config(mode, url)
    }

    pub(crate) fn test_api_proxy_config(
        &self,
        mode: ApiProxyMode,
        url: Option<String>,
    ) -> CoreEnvelope<ApiProxyTestPayload> {
        self.auth.test_api_proxy_config(mode, url)
    }

    pub(crate) fn detect_api_proxy_config(&self) -> CoreEnvelope<ApiProxyDetectPayload> {
        self.auth.detect_api_proxy_config()
    }

    pub(crate) fn get_usage_refresh_interval(&self) -> String {
        "manual".into()
    }

    pub(crate) fn set_usage_refresh_interval(&self, interval: String) -> String {
        interval
    }

    pub(crate) fn run_daemon_once(&self) -> CoreEnvelope<DaemonRunPayload> {
        self.daemon.run_once()
    }

    pub(crate) fn diagnose(&self) -> CoreEnvelope<DiagnosePayload> {
        CoreEnvelope::ok_with_warnings(
            DiagnosePayload {
                core_version: env!("CARGO_PKG_VERSION").into(),
                platform: DiagnosePlatform {
                    os: std::env::consts::OS.into(),
                    arch: std::env::consts::ARCH.into(),
                },
                ..DiagnosePayload::default()
            },
            vec![crate::contracts::stub_warning("diagnose")],
        )
    }

    pub(crate) fn load_bootstrap_state(&self) -> CoreEnvelope<BootstrapStatePayload> {
        CoreEnvelope::ok_with_warnings(
            BootstrapStatePayload::default(),
            vec![crate::contracts::stub_warning("bootstrap")],
        )
    }

    pub(crate) fn check_update_installability(&self) -> UpdateInstallabilityPayload {
        UpdateInstallabilityPayload::default()
    }

    pub(crate) fn get_system_info(&self) -> SystemInfo {
        SystemInfo {
            os: std::env::consts::OS.into(),
            os_version: String::new(),
            arch: std::env::consts::ARCH.into(),
            hostname: hostname::get()
                .map(|value| value.to_string_lossy().to_string())
                .unwrap_or_else(|_| "unknown".into()),
        }
    }
}
