use crate::application::ports::{
    HotspotRuntimePort, PermissionsPort, ProcessPort, ShellPort, SystemInfoPort, WindowPort,
};
use crate::application::usecase::daemon::DaemonUseCase;
use crate::contracts::{
    ApiConfigPayload, ApiModePayload, ApiProxyConfigPayload, ApiProxyDetectPayload, ApiProxyMode,
    ApiProxyTestPayload, AutoSwitchConfigPayload, AutoSwitchStatusPayload, BackendSkeletonStatus,
    BootstrapStatePayload, CleanPayload, CoreEnvelope, CoreSnapshotPayload, DaemonRunPayload,
    DiagnosePayload, DiagnosePlatform, RebuildRegistryPayload, SystemInfo,
    UpdateInstallabilityPayload,
};
use crate::core::dto::{BackendBoundaryProbe, BackendOperationPlan};
use crate::core::error::CoreError;
use crate::core::single_flight::SingleFlight;
use crate::repository::RepositoryBundle;
use serde_json::{json, Map, Value};

const MODULE: &str = "system";

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
        let plan = self.pending_plan("load_snapshot");
        Ok(CoreEnvelope::from_backend_plan(
            self.snapshot_payload(&plan),
            &plan,
        ))
    }

    pub(crate) fn refresh_usage_snapshot(
        &self,
    ) -> Result<CoreEnvelope<CoreSnapshotPayload>, CoreError> {
        let plan = self.pending_plan("refresh_usage_snapshot");
        Ok(CoreEnvelope::from_backend_plan(
            self.snapshot_payload(&plan),
            &plan,
        ))
    }

    pub(crate) fn clean(&self) -> Result<CoreEnvelope<CleanPayload>, CoreError> {
        let plan = self.no_op_plan_from_source("clean", self.repositories.registry().source_path());
        Ok(CoreEnvelope::from_backend_plan(
            CleanPayload {
                backend_status: BackendSkeletonStatus::from_plan(&plan),
                ..CleanPayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn rebuild_registry(
        &self,
    ) -> Result<CoreEnvelope<RebuildRegistryPayload>, CoreError> {
        let plan = self.no_op_plan_from_source(
            "rebuild_registry",
            self.repositories.registry().source_path(),
        );
        Ok(CoreEnvelope::from_backend_plan(
            RebuildRegistryPayload {
                backend_status: BackendSkeletonStatus::from_plan(&plan),
                ..RebuildRegistryPayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn set_auto_switch(
        &self,
        enabled: bool,
    ) -> Result<CoreEnvelope<AutoSwitchConfigPayload>, CoreError> {
        let plan = self.no_op_plan("set_auto_switch");
        Ok(CoreEnvelope::from_backend_plan(
            AutoSwitchConfigPayload {
                backend_status: BackendSkeletonStatus::from_plan(&plan),
                auto_switch: AutoSwitchStatusPayload {
                    enabled,
                    ..AutoSwitchStatusPayload::default()
                },
            },
            &plan,
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
        let plan = self.no_op_plan("configure_auto_switch");
        Ok(CoreEnvelope::from_backend_plan(
            AutoSwitchConfigPayload {
                backend_status: BackendSkeletonStatus::from_plan(&plan),
                auto_switch: AutoSwitchStatusPayload {
                    threshold_5h_percent: five_hour,
                    threshold_weekly_percent: weekly,
                    ..AutoSwitchStatusPayload::default()
                },
            },
            &plan,
        ))
    }

    pub(crate) fn set_api_proxy_config(
        &self,
        mode: ApiProxyMode,
        url: Option<String>,
    ) -> Result<CoreEnvelope<ApiModePayload>, CoreError> {
        let url = clean_optional_text(url);
        let plan = self.no_op_plan("set_api_proxy_config");
        Ok(CoreEnvelope::from_backend_plan(
            ApiModePayload {
                backend_status: BackendSkeletonStatus::from_plan(&plan),
                api: ApiConfigPayload {
                    proxy: ApiProxyConfigPayload { mode, url },
                },
            },
            &plan,
        ))
    }

    pub(crate) fn test_api_proxy_config(
        &self,
        _mode: ApiProxyMode,
        url: Option<String>,
    ) -> Result<CoreEnvelope<ApiProxyTestPayload>, CoreError> {
        let _url = clean_optional_text(url);
        let plan = self.pending_plan("test_api_proxy_config");
        Ok(CoreEnvelope::from_backend_plan(
            ApiProxyTestPayload {
                backend_status: BackendSkeletonStatus::from_plan(&plan),
                ..ApiProxyTestPayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn detect_api_proxy_config(
        &self,
    ) -> Result<CoreEnvelope<ApiProxyDetectPayload>, CoreError> {
        let plan = self.pending_plan("detect_api_proxy_config");
        let backend_status = BackendSkeletonStatus::from_plan(&plan);
        Ok(CoreEnvelope::from_backend_plan(
            ApiProxyDetectPayload {
                backend_status: backend_status.clone(),
                probe: ApiProxyTestPayload {
                    backend_status,
                    ..ApiProxyTestPayload::default()
                },
                ..ApiProxyDetectPayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn get_usage_refresh_interval(&self) -> Result<CoreEnvelope<String>, CoreError> {
        let plan = self.no_op_plan("get_usage_refresh_interval");
        Ok(CoreEnvelope::from_backend_plan("manual".into(), &plan))
    }

    pub(crate) fn set_usage_refresh_interval(
        &self,
        interval: String,
    ) -> Result<CoreEnvelope<String>, CoreError> {
        let interval = required_text(interval, "empty_interval", "刷新间隔不能为空。")?;
        let plan = self.no_op_plan("set_usage_refresh_interval");
        Ok(CoreEnvelope::from_backend_plan(interval, &plan))
    }

    pub(crate) fn run_daemon_once(&self) -> Result<CoreEnvelope<DaemonRunPayload>, CoreError> {
        DaemonUseCase::new(self.repositories, self.single_flight).run_once()
    }

    pub(crate) fn load_pending_auto_switch(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.pending_plan("load_pending_auto_switch");
        Ok(CoreEnvelope::from_backend_plan(
            json!({ "pending": null, "backendStatus": BackendSkeletonStatus::from_plan(&plan) }),
            &plan,
        ))
    }

    pub(crate) fn dismiss_pending_auto_switch(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.no_op_plan("dismiss_pending_auto_switch");
        Ok(CoreEnvelope::from_backend_plan(
            json!({ "backendStatus": BackendSkeletonStatus::from_plan(&plan) }),
            &plan,
        ))
    }

    pub(crate) fn confirm_pending_auto_switch(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.no_op_plan("confirm_pending_auto_switch");
        Ok(CoreEnvelope::from_backend_plan(
            json!({ "backendStatus": BackendSkeletonStatus::from_plan(&plan) }),
            &plan,
        ))
    }

    pub(crate) fn confirm_pending_auto_switch_and_restart_application(
        &self,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.no_op_plan("confirm_pending_auto_switch_and_restart_codex");
        Ok(CoreEnvelope::from_backend_plan(
            json!({ "backendStatus": BackendSkeletonStatus::from_plan(&plan) }),
            &plan,
        ))
    }

    pub(crate) fn diagnose(&self) -> Result<CoreEnvelope<DiagnosePayload>, CoreError> {
        let platform = self.system_info.system_info();
        let plan = self.pending_plan("diagnose");
        Ok(CoreEnvelope::from_backend_plan(
            DiagnosePayload {
                backend_status: BackendSkeletonStatus::from_plan(&plan),
                core_version: env!("CARGO_PKG_VERSION").into(),
                platform: DiagnosePlatform {
                    os: platform.os,
                    arch: platform.arch,
                },
                ..DiagnosePayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn load_bootstrap_state(
        &self,
    ) -> Result<CoreEnvelope<BootstrapStatePayload>, CoreError> {
        let plan = self.pending_plan("load_bootstrap_state");
        Ok(CoreEnvelope::from_backend_plan(
            BootstrapStatePayload {
                backend_status: BackendSkeletonStatus::from_plan(&plan),
                ..BootstrapStatePayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn check_update_installability(
        &self,
    ) -> Result<CoreEnvelope<UpdateInstallabilityPayload>, CoreError> {
        let plan = self.pending_plan("check_update_installability");
        Ok(CoreEnvelope::from_backend_plan(
            UpdateInstallabilityPayload {
                backend_status: BackendSkeletonStatus::from_plan(&plan),
                ..UpdateInstallabilityPayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn get_system_info(&self) -> Result<CoreEnvelope<SystemInfo>, CoreError> {
        let plan = self.platform_plan("get_system_info");
        let platform = self.system_info.system_info();
        Ok(CoreEnvelope::from_backend_plan(
            SystemInfo {
                backend_status: BackendSkeletonStatus::from_plan(&plan),
                os: platform.os,
                os_version: platform.os_version,
                arch: platform.arch,
                hostname: platform.hostname,
            },
            &plan,
        ))
    }

    pub(crate) fn restart_application(
        &self,
        process: &dyn ProcessPort,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        process.restart_application()?;
        let plan = self.platform_plan("restart_codex");
        Ok(CoreEnvelope::from_backend_plan(
            json!({ "backendStatus": BackendSkeletonStatus::from_plan(&plan) }),
            &plan,
        ))
    }

    pub(crate) fn force_kill_application(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.no_op_plan("force_kill_codex");
        Ok(CoreEnvelope::from_backend_plan(
            json!({ "backendStatus": BackendSkeletonStatus::from_plan(&plan) }),
            &plan,
        ))
    }

    pub(crate) fn reset_application_config(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.no_op_plan("reset_codex_config");
        Ok(CoreEnvelope::from_backend_plan(
            json!({ "backendStatus": BackendSkeletonStatus::from_plan(&plan) }),
            &plan,
        ))
    }

    pub(crate) fn graceful_restart_for_update(
        &self,
        process: &dyn ProcessPort,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        process.graceful_restart_for_update()?;
        let plan = self.platform_plan("graceful_restart_for_update");
        Ok(CoreEnvelope::from_backend_plan(
            json!({ "backendStatus": BackendSkeletonStatus::from_plan(&plan) }),
            &plan,
        ))
    }

    pub(crate) fn open_path(
        &self,
        shell: &dyn ShellPort,
        path: String,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let path = required_text(path, "empty_open_path", "打开路径不能为空。")?;
        shell.open_path(&path)?;
        let plan = self.platform_plan("open_path");
        Ok(CoreEnvelope::from_backend_plan(
            json!({ "backendStatus": BackendSkeletonStatus::from_plan(&plan) }),
            &plan,
        ))
    }

    pub(crate) fn focus_main_window(
        &self,
        window: &dyn WindowPort,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.platform_plan("focus_main_window");
        window.focus_main_window()?;
        Ok(CoreEnvelope::from_backend_plan(
            json!({ "backendStatus": BackendSkeletonStatus::from_plan(&plan) }),
            &plan,
        ))
    }

    pub(crate) fn get_device_id(&self) -> Result<CoreEnvelope<String>, CoreError> {
        let plan = self.pending_plan("get_device_id");
        Ok(CoreEnvelope::from_backend_plan(String::new(), &plan))
    }

    pub(crate) fn get_or_create_remote_device_secret(
        &self,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.pending_plan("get_or_create_remote_device_secret");
        Ok(CoreEnvelope::from_backend_plan(
            json!({ "secret": null, "backendStatus": BackendSkeletonStatus::from_plan(&plan) }),
            &plan,
        ))
    }

    pub(crate) fn import_remote_device_secret_if_empty(
        &self,
        secret: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let secret = clean_optional_text(secret);
        let plan = self.no_op_plan("import_remote_device_secret_if_empty");
        Ok(CoreEnvelope::from_backend_plan(
            json!({
                "secretPresent": secret.is_some(),
                "backendStatus": BackendSkeletonStatus::from_plan(&plan),
            }),
            &plan,
        ))
    }

    pub(crate) fn get_notification_client_state(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.pending_plan("get_notification_client_state");
        Ok(CoreEnvelope::from_backend_plan(
            json!({ "enabled": false, "backendStatus": BackendSkeletonStatus::from_plan(&plan) }),
            &plan,
        ))
    }

    pub(crate) fn get_mystery_unlock_grants(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.pending_plan("get_mystery_unlock_grants");
        Ok(CoreEnvelope::from_backend_plan(json!([]), &plan))
    }

    pub(crate) fn merge_mystery_unlock_grants(
        &self,
        grants: Option<Value>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let grants =
            clean_optional_json(grants, "empty_mystery_unlock_grants", "授权列表不能为空。")?;
        let plan = self.no_op_plan("merge_mystery_unlock_grants");
        Ok(CoreEnvelope::from_backend_plan(
            grants.unwrap_or_else(|| json!([])),
            &plan,
        ))
    }

    pub(crate) fn open_privacy_pane(
        &self,
        permissions: &dyn PermissionsPort,
        pane: String,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let pane = required_text(pane, "empty_privacy_pane", "权限面板标识不能为空。")?;
        permissions.open_privacy_pane(&pane)?;
        let plan = self.platform_plan("open_privacy_pane");
        Ok(CoreEnvelope::from_backend_plan(
            json!({ "backendStatus": BackendSkeletonStatus::from_plan(&plan) }),
            &plan,
        ))
    }

    pub(crate) fn get_image_compat(&self) -> Result<CoreEnvelope<bool>, CoreError> {
        let plan = self.no_op_plan("get_image_compat");
        Ok(CoreEnvelope::from_backend_plan(false, &plan))
    }

    pub(crate) fn set_image_compat(&self, enabled: bool) -> Result<CoreEnvelope<bool>, CoreError> {
        let plan = self.no_op_plan("set_image_compat");
        Ok(CoreEnvelope::from_backend_plan(enabled, &plan))
    }

    pub(crate) fn has_notch(&self) -> Result<CoreEnvelope<bool>, CoreError> {
        let plan = self.pending_plan("has_notch");
        Ok(CoreEnvelope::from_backend_plan(false, &plan))
    }

    pub(crate) fn get_hotspot_enabled(&self) -> Result<CoreEnvelope<bool>, CoreError> {
        let plan = self.no_op_plan("get_hotspot_enabled");
        Ok(CoreEnvelope::from_backend_plan(false, &plan))
    }

    pub(crate) fn set_hotspot_enabled(
        &self,
        enabled: bool,
    ) -> Result<CoreEnvelope<bool>, CoreError> {
        let plan = self.no_op_plan("set_hotspot_enabled");
        Ok(CoreEnvelope::from_backend_plan(enabled, &plan))
    }

    pub(crate) fn hotspot_ready(
        &self,
        hotspot: &dyn HotspotRuntimePort,
    ) -> Result<CoreEnvelope<bool>, CoreError> {
        if let Some(ready) = hotspot.hotspot_ready()? {
            let plan = self.platform_plan("hotspot_ready");
            return Ok(CoreEnvelope::from_backend_plan(ready, &plan));
        }

        let plan = self.pending_platform_plan("hotspot_ready");
        Ok(CoreEnvelope::from_backend_plan(false, &plan))
    }

    fn pending_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::pending(
            MODULE,
            command,
            self.repository_boundary(self.repositories.config().source_path()),
        )
    }

    fn no_op_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::no_op(
            MODULE,
            command,
            self.repository_boundary(self.repositories.config().source_path()),
        )
    }

    fn no_op_plan_from_source(
        &self,
        command: &'static str,
        source_path: String,
    ) -> BackendOperationPlan {
        BackendOperationPlan::no_op(MODULE, command, self.repository_boundary(source_path))
    }

    fn platform_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::platform(MODULE, command, BackendBoundaryProbe::from_platform())
    }

    fn pending_platform_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::pending(MODULE, command, BackendBoundaryProbe::from_platform())
    }

    fn repository_boundary(&self, source_path: String) -> BackendBoundaryProbe {
        BackendBoundaryProbe::from_repository_source(source_path)
    }

    fn snapshot_payload(&self, plan: &BackendOperationPlan) -> CoreSnapshotPayload {
        CoreSnapshotPayload {
            backend_status: BackendSkeletonStatus::from_plan(plan),
            ..CoreSnapshotPayload::default()
        }
    }
}

fn required_text(
    value: String,
    code: &'static str,
    public_message: &'static str,
) -> Result<String, CoreError> {
    let value = value.trim().to_owned();
    if value.is_empty() {
        Err(CoreError::domain(code, public_message))
    } else {
        Ok(value)
    }
}

fn clean_optional_text(value: Option<String>) -> Option<String> {
    value.and_then(|value| {
        let value = value.trim().to_owned();
        if value.is_empty() {
            None
        } else {
            Some(value)
        }
    })
}

fn clean_optional_json(
    value: Option<Value>,
    code: &'static str,
    public_message: &'static str,
) -> Result<Option<Value>, CoreError> {
    value
        .map(|value| clean_json_value(value, code, public_message))
        .transpose()
}

fn clean_json_value(
    value: Value,
    code: &'static str,
    public_message: &'static str,
) -> Result<Value, CoreError> {
    match value {
        Value::Null => Err(CoreError::domain(code, public_message)),
        Value::String(value) => {
            let value = value.trim().to_owned();
            if value.is_empty() {
                Err(CoreError::domain(code, public_message))
            } else {
                Ok(Value::String(value))
            }
        }
        Value::Array(values) => {
            let values = values
                .into_iter()
                .map(|value| clean_json_value(value, code, public_message))
                .collect::<Result<Vec<_>, _>>()?;
            if values.is_empty() {
                Err(CoreError::domain(code, public_message))
            } else {
                Ok(Value::Array(values))
            }
        }
        Value::Object(values) => {
            let mut cleaned = Map::new();
            for (key, value) in values {
                let key = key.trim().to_owned();
                if !key.is_empty() {
                    cleaned.insert(key, clean_json_value(value, code, public_message)?);
                }
            }
            if cleaned.is_empty() {
                Err(CoreError::domain(code, public_message))
            } else {
                Ok(Value::Object(cleaned))
            }
        }
        value => Ok(value),
    }
}
