use crate::contracts::{
    AccountExportPayload, AccountImportPayload, AccountImportPreviewPayload, AccountMonitorPayload,
    AccountSessionImportPayload, BackendSkeletonStatus, CoreEnvelope, LogoutPayload, RemovePayload,
    SwitchPayload,
};
use crate::core::dto::{BackendBoundaryProbe, BackendOperationPlan};
use crate::core::error::CoreError;
use crate::repository::RepositoryBundle;

const MODULE: &str = "accounts";

pub(crate) struct AccountsUseCase<'a> {
    repositories: &'a RepositoryBundle,
}

impl<'a> AccountsUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle) -> Self {
        Self { repositories }
    }

    pub(crate) fn begin_attach_monitor(
        &self,
    ) -> Result<CoreEnvelope<AccountMonitorPayload>, CoreError> {
        let plan = self.pending_plan("begin_add_account_attach_monitor");
        Ok(CoreEnvelope::from_backend_plan(
            AccountMonitorPayload {
                backend_status: self.status(&plan),
            },
            &plan,
        ))
    }

    pub(crate) fn switch_account(
        &self,
        command: &'static str,
        account_key: String,
    ) -> Result<CoreEnvelope<SwitchPayload>, CoreError> {
        let account_key = required_text(account_key, "empty_account_key", "账号标识不能为空。")?;
        let plan = self.no_op_plan(command);
        Ok(CoreEnvelope::from_backend_plan(
            SwitchPayload {
                backend_status: self.status(&plan),
                previous_account_key: None,
                active_account_key: Some(account_key),
                active_account: None,
                auth_updated: false,
                registry_updated: false,
            },
            &plan,
        ))
    }

    pub(crate) fn remove_accounts(
        &self,
        account_keys: Vec<String>,
    ) -> Result<CoreEnvelope<RemovePayload>, CoreError> {
        let account_keys =
            required_text_list(account_keys, "empty_account_keys", "账号列表不能为空。")?;
        let plan = self.no_op_plan("remove_accounts");
        Ok(CoreEnvelope::from_backend_plan(
            RemovePayload {
                backend_status: self.status(&plan),
                removed_count: account_keys.len(),
                removed_account_keys: account_keys,
                previous_account_key: None,
            },
            &plan,
        ))
    }

    pub(crate) fn logout(&self) -> Result<CoreEnvelope<LogoutPayload>, CoreError> {
        let plan = self.no_op_plan("logout");
        Ok(CoreEnvelope::from_backend_plan(
            LogoutPayload {
                backend_status: self.status(&plan),
                auth_removed: false,
                auth_backed_up: false,
            },
            &plan,
        ))
    }

    pub(crate) fn import_chatgpt_session_account(
        &self,
        session_json: Option<String>,
        _overwrite_existing: Option<bool>,
    ) -> Result<CoreEnvelope<AccountSessionImportPayload>, CoreError> {
        if session_json
            .as_ref()
            .is_some_and(|value| value.trim().is_empty())
        {
            return Err(CoreError::domain(
                "empty_session_json",
                "会话 JSON 不能为空。",
            ));
        }
        let plan = self.no_op_plan("import_chatgpt_session_account");
        Ok(CoreEnvelope::from_backend_plan(
            AccountSessionImportPayload {
                backend_status: self.status(&plan),
                imported: false,
                account_key: None,
                email: None,
                plan: None,
                snapshot_path: None,
                registry_account_count: 0,
                active_account_key: None,
                refresh_token_placeholder: false,
            },
            &plan,
        ))
    }

    pub(crate) fn export_accounts_to_file(
        &self,
        account_keys: Option<Vec<String>>,
        target_path: String,
    ) -> Result<CoreEnvelope<AccountExportPayload>, CoreError> {
        let target_path =
            required_text(target_path, "empty_export_path", "导出目标路径不能为空。")?;
        let plan = self.no_op_plan("export_accounts_to_file");
        Ok(CoreEnvelope::from_backend_plan(
            AccountExportPayload {
                backend_status: self.status(&plan),
                target_path,
                account_count: 0,
                exported_at: None,
                skipped: clean_optional_text_list(account_keys)
                    .into_iter()
                    .map(|account_key| crate::contracts::AccountSkippedPayload {
                        account_key: Some(account_key),
                        reason: "backend_skeleton".to_owned(),
                        message: Some("后端骨架未执行账号导出。".to_owned()),
                    })
                    .collect(),
            },
            &plan,
        ))
    }

    pub(crate) fn preview_account_import(
        &self,
        file_path: String,
    ) -> Result<CoreEnvelope<AccountImportPreviewPayload>, CoreError> {
        let file_path = required_text(file_path, "empty_import_path", "导入文件路径不能为空。")?;
        let plan = self.pending_plan("preview_account_import");
        Ok(CoreEnvelope::from_backend_plan(
            AccountImportPreviewPayload {
                backend_status: self.status(&plan),
                file_path,
                schema_version: 1,
                kind: "account-export".to_owned(),
                app_version: None,
                exported_at: None,
                exported_hostname: None,
                entries: Vec::new(),
                account_count: 0,
                conflict_count: 0,
            },
            &plan,
        ))
    }

    pub(crate) fn import_accounts_from_file(
        &self,
        file_path: String,
        _overwrite_existing: Option<bool>,
        selected_keys: Option<Vec<String>>,
    ) -> Result<CoreEnvelope<AccountImportPayload>, CoreError> {
        let _file_path = required_text(file_path, "empty_import_path", "导入文件路径不能为空。")?;
        let plan = self.no_op_plan("import_accounts_from_file");
        let mut payload = self.empty_import_payload(&plan);
        payload.skipped = clean_optional_text_list(selected_keys)
            .into_iter()
            .map(|account_key| crate::contracts::AccountSkippedPayload {
                account_key: Some(account_key),
                reason: "backend_skeleton".to_owned(),
                message: Some("后端骨架未执行账号导入。".to_owned()),
            })
            .collect();
        Ok(CoreEnvelope::from_backend_plan(payload, &plan))
    }

    fn pending_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::pending(MODULE, command, self.repository_boundary())
    }

    fn no_op_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::no_op(MODULE, command, self.repository_boundary())
    }

    fn repository_boundary(&self) -> BackendBoundaryProbe {
        BackendBoundaryProbe::from_repository_source(self.repositories.accounts().source_path())
    }

    fn status(&self, plan: &BackendOperationPlan) -> BackendSkeletonStatus {
        BackendSkeletonStatus::from_plan(plan)
    }

    fn empty_import_payload(&self, plan: &BackendOperationPlan) -> AccountImportPayload {
        AccountImportPayload {
            backend_status: self.status(plan),
            imported_count: 0,
            imported_account_keys: Vec::new(),
            skipped: Vec::new(),
            registry_account_count: 0,
            active_account_key: None,
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

fn required_text_list(
    values: Vec<String>,
    code: &'static str,
    public_message: &'static str,
) -> Result<Vec<String>, CoreError> {
    let values = values
        .into_iter()
        .map(|value| value.trim().to_owned())
        .filter(|value| !value.is_empty())
        .collect::<Vec<_>>();
    if values.is_empty() {
        Err(CoreError::domain(code, public_message))
    } else {
        Ok(values)
    }
}

fn clean_optional_text_list(values: Option<Vec<String>>) -> Vec<String> {
    values
        .unwrap_or_default()
        .into_iter()
        .map(|value| value.trim().to_owned())
        .filter(|value| !value.is_empty())
        .collect()
}
