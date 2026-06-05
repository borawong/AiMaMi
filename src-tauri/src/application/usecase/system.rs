use crate::application::ports::{
    PermissionsPort, ProcessPort, ShellPort, SystemInfoPort, WindowPort,
};
use crate::application::usecase::daemon::DaemonUseCase;
use crate::contracts::{
    ApiConfigPayload, ApiModePayload, ApiProxyConfigPayload, ApiProxyDetectPayload, ApiProxyMode,
    ApiProxyTestPayload, AutoSwitchConfigPayload, AutoSwitchRuntimeState, AutoSwitchStatusPayload,
    BootstrapStatePayload, CleanPayload, CoreEnvelope, CoreSnapshotPayload, DaemonRunPayload,
    DiagnosePayload, DiagnosePlatform, RebuildRegistryPayload, SystemInfo,
    UpdateInstallabilityPayload,
};
use crate::core::error::CoreError;
use crate::core::single_flight::SingleFlight;
use crate::repository::RepositoryBundle;
use serde_json::{json, Value};

/// 中文职责说明：系统设置、诊断、启动快照和平台端口调度事务 owner。
pub(crate) struct SystemUseCase<'a> {
    repositories: &'a RepositoryBundle,
    single_flight: &'a SingleFlight,
    system_info: &'a dyn SystemInfoPort,
}

impl<'a> SystemUseCase<'a> {
    pub(crate) fn new(
        repositories: &'a RepositoryBundle,
        single_flight: &'a SingleFlight,
        system_info: &'a dyn SystemInfoPort,
    ) -> Self {
        Self {
            repositories,
            single_flight,
            system_info,
        }
    }

    pub(crate) fn load_snapshot(
        &self,
        _local_only: bool,
    ) -> Result<CoreEnvelope<CoreSnapshotPayload>, CoreError> {
        Ok(CoreEnvelope::pending(
            CoreSnapshotPayload::default(),
            "snapshot",
        ))
    }

    pub(crate) fn refresh_usage_snapshot(
        &self,
    ) -> Result<CoreEnvelope<CoreSnapshotPayload>, CoreError> {
        Ok(CoreEnvelope::pending(
            CoreSnapshotPayload::default(),
            "refresh_usage_snapshot",
        ))
    }

    pub(crate) fn clean(&self) -> Result<CoreEnvelope<CleanPayload>, CoreError> {
        let _ = self.repositories.registry().source_path();
        Ok(CoreEnvelope::no_op(CleanPayload::default(), "clean"))
    }

    pub(crate) fn rebuild_registry(
        &self,
    ) -> Result<CoreEnvelope<RebuildRegistryPayload>, CoreError> {
        let _ = self.repositories.registry().source_path();
        Ok(CoreEnvelope::no_op(
            RebuildRegistryPayload::default(),
            "rebuild_registry",
        ))
    }

    pub(crate) fn set_auto_switch(
        &self,
        enabled: bool,
    ) -> Result<CoreEnvelope<AutoSwitchConfigPayload>, CoreError> {
        Ok(CoreEnvelope::no_op(
            AutoSwitchConfigPayload {
                auto_switch: AutoSwitchStatusPayload {
                    enabled,
                    ..AutoSwitchStatusPayload::default()
                },
            },
            "set_auto_switch",
        ))
    }

    pub(crate) fn configure_auto_switch(
        &self,
        threshold_5h_percent: Option<i32>,
        threshold_weekly_percent: Option<i32>,
    ) -> Result<CoreEnvelope<AutoSwitchConfigPayload>, CoreError> {
        let five_hour = threshold_5h_percent.unwrap_or(80);
        let weekly = threshold_weekly_percent.unwrap_or(80);
        if !(0..=100).contains(&five_hour) || !(0..=100).contains(&weekly) {
            return Err(CoreError::domain(
                "invalid_threshold",
                "阈值必须在 0 到 100 之间。",
            ));
        }
        Ok(CoreEnvelope::no_op(
            AutoSwitchConfigPayload {
                auto_switch: AutoSwitchStatusPayload {
                    threshold_5h_percent: five_hour,
                    threshold_weekly_percent: weekly,
                    ..AutoSwitchStatusPayload::default()
                },
            },
            "configure_auto_switch",
        ))
    }

    pub(crate) fn set_api_proxy_config(
        &self,
        mode: ApiProxyMode,
        url: Option<String>,
    ) -> Result<CoreEnvelope<ApiModePayload>, CoreError> {
        Ok(CoreEnvelope::no_op(
            ApiModePayload {
                api: ApiConfigPayload {
                    proxy: ApiProxyConfigPayload { mode, url },
                },
            },
            "set_api_proxy_config",
        ))
    }

    pub(crate) fn test_api_proxy_config(
        &self,
        _mode: ApiProxyMode,
        _url: Option<String>,
    ) -> Result<CoreEnvelope<ApiProxyTestPayload>, CoreError> {
        Ok(CoreEnvelope::pending(
            ApiProxyTestPayload::default(),
            "test_api_proxy_config",
        ))
    }

    pub(crate) fn detect_api_proxy_config(
        &self,
    ) -> Result<CoreEnvelope<ApiProxyDetectPayload>, CoreError> {
        Ok(CoreEnvelope::pending(
            ApiProxyDetectPayload::default(),
            "detect_api_proxy_config",
        ))
    }

    pub(crate) fn get_usage_refresh_interval(&self) -> Result<CoreEnvelope<String>, CoreError> {
        Ok(CoreEnvelope::ok("manual".into()))
    }

    pub(crate) fn set_usage_refresh_interval(
        &self,
        interval: String,
    ) -> Result<CoreEnvelope<String>, CoreError> {
        if interval.trim().is_empty() {
            return Err(CoreError::domain("empty_interval", "刷新间隔不能为空。"));
        }
        Ok(CoreEnvelope::no_op(interval, "set_usage_refresh_interval"))
    }

    pub(crate) fn run_daemon_once(&self) -> Result<CoreEnvelope<DaemonRunPayload>, CoreError> {
        DaemonUseCase::new(self.repositories, self.single_flight).run_once()
    }

    pub(crate) fn load_pending_auto_switch(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::pending(
            json!({ "pending": null }),
            "load_pending_auto_switch",
        ))
    }

    pub(crate) fn dismiss_pending_auto_switch(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(
            json!({}),
            "dismiss_pending_auto_switch",
        ))
    }

    pub(crate) fn confirm_pending_auto_switch(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(
            json!({}),
            "confirm_pending_auto_switch",
        ))
    }

    pub(crate) fn confirm_pending_auto_switch_and_restart_application(
        &self,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(
            json!({}),
            "confirm_pending_auto_switch_and_restart_codex",
        ))
    }

    pub(crate) fn diagnose(&self) -> Result<CoreEnvelope<DiagnosePayload>, CoreError> {
        let platform = self.system_info.system_info();
        Ok(CoreEnvelope::pending(
            DiagnosePayload {
                core_version: env!("CARGO_PKG_VERSION").into(),
                platform: DiagnosePlatform {
                    os: platform.os,
                    arch: platform.arch,
                },
                ..DiagnosePayload::default()
            },
            "diagnose",
        ))
    }

    pub(crate) fn load_bootstrap_state(
        &self,
    ) -> Result<CoreEnvelope<BootstrapStatePayload>, CoreError> {
        Ok(CoreEnvelope::pending(
            BootstrapStatePayload::default(),
            "bootstrap",
        ))
    }

    pub(crate) fn check_update_installability(
        &self,
    ) -> Result<CoreEnvelope<UpdateInstallabilityPayload>, CoreError> {
        Ok(CoreEnvelope::pending(
            UpdateInstallabilityPayload::default(),
            "check_update_installability",
        ))
    }

    pub(crate) fn get_system_info(&self) -> Result<CoreEnvelope<SystemInfo>, CoreError> {
        let platform = self.system_info.system_info();
        Ok(CoreEnvelope::ok(SystemInfo {
            os: platform.os,
            os_version: platform.os_version,
            arch: platform.arch,
            hostname: platform.hostname,
        }))
    }

    pub(crate) fn restart_application(
        &self,
        process: &dyn ProcessPort,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        process.restart_application()?;
        Ok(CoreEnvelope::no_op(json!({}), "restart_application"))
    }

    pub(crate) fn force_kill_application(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(json!({}), "force_kill_codex"))
    }

    pub(crate) fn reset_application_config(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(json!({}), "reset_codex_config"))
    }

    pub(crate) fn graceful_restart_for_update(
        &self,
        process: &dyn ProcessPort,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        process.graceful_restart_for_update()?;
        Ok(CoreEnvelope::no_op(
            json!({}),
            "graceful_restart_for_update",
        ))
    }

    pub(crate) fn open_path(
        &self,
        shell: &dyn ShellPort,
        path: String,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        shell.open_path(&path)?;
        Ok(CoreEnvelope::no_op(json!({}), "open_path"))
    }

    pub(crate) fn focus_main_window(
        &self,
        window: &dyn WindowPort,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        window.focus_main_window()?;
        Ok(CoreEnvelope::ok(json!({})))
    }

    pub(crate) fn get_device_id(&self) -> Result<CoreEnvelope<String>, CoreError> {
        Ok(CoreEnvelope::pending(String::new(), "get_device_id"))
    }

    pub(crate) fn get_or_create_remote_device_secret(
        &self,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::pending(
            json!({ "secret": null }),
            "get_or_create_remote_device_secret",
        ))
    }

    pub(crate) fn import_remote_device_secret_if_empty(
        &self,
        secret: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(
            json!({ "secretPresent": secret.as_ref().is_some_and(|value| !value.is_empty()) }),
            "import_remote_device_secret_if_empty",
        ))
    }

    pub(crate) fn get_notification_client_state(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::pending(
            json!({ "enabled": false }),
            "get_notification_client_state",
        ))
    }

    pub(crate) fn get_mystery_unlock_grants(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::pending(
            json!([]),
            "get_mystery_unlock_grants",
        ))
    }

    pub(crate) fn merge_mystery_unlock_grants(
        &self,
        _grants: Option<Value>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(
            json!([]),
            "merge_mystery_unlock_grants",
        ))
    }

    pub(crate) fn open_privacy_pane(
        &self,
        permissions: &dyn PermissionsPort,
        pane: String,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        permissions.open_privacy_pane(&pane)?;
        Ok(CoreEnvelope::no_op(json!({}), "open_privacy_pane"))
    }

    pub(crate) fn get_image_compat(&self) -> Result<CoreEnvelope<bool>, CoreError> {
        Ok(CoreEnvelope::ok(false))
    }

    pub(crate) fn set_image_compat(&self, enabled: bool) -> Result<CoreEnvelope<bool>, CoreError> {
        Ok(CoreEnvelope::no_op(enabled, "set_image_compat"))
    }

    pub(crate) fn has_notch(&self) -> Result<CoreEnvelope<bool>, CoreError> {
        Ok(CoreEnvelope::pending(false, "has_notch"))
    }

    pub(crate) fn get_hotspot_enabled(&self) -> Result<CoreEnvelope<bool>, CoreError> {
        Ok(CoreEnvelope::ok(false))
    }

    pub(crate) fn set_hotspot_enabled(
        &self,
        enabled: bool,
    ) -> Result<CoreEnvelope<bool>, CoreError> {
        Ok(CoreEnvelope::no_op(enabled, "set_hotspot_enabled"))
    }

    pub(crate) fn hotspot_ready(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::ok(json!({})))
    }
}
