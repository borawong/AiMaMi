use crate::contracts::{AccountActionPayload, BackendSkeletonStatus, CoreEnvelope};
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
    ) -> Result<CoreEnvelope<AccountActionPayload>, CoreError> {
        let plan = self.pending_plan("begin_add_account_attach_monitor");
        Ok(CoreEnvelope::from_backend_plan(self.payload(&plan), &plan))
    }

    pub(crate) fn switch_account(
        &self,
        command: &'static str,
        account_key: String,
    ) -> Result<CoreEnvelope<AccountActionPayload>, CoreError> {
        let account_key = required_text(account_key, "empty_account_key", "账号标识不能为空。")?;
        let plan = self.no_op_plan(command);
        let mut payload = self.payload(&plan);
        payload.account_key = Some(account_key);
        Ok(CoreEnvelope::from_backend_plan(payload, &plan))
    }

    pub(crate) fn remove_accounts(
        &self,
        account_keys: Vec<String>,
    ) -> Result<CoreEnvelope<AccountActionPayload>, CoreError> {
        let account_keys =
            required_text_list(account_keys, "empty_account_keys", "账号列表不能为空。")?;
        let plan = self.no_op_plan("remove_accounts");
        let mut payload = self.payload(&plan);
        payload.account_keys = account_keys;
        Ok(CoreEnvelope::from_backend_plan(payload, &plan))
    }

    pub(crate) fn logout(&self) -> Result<CoreEnvelope<AccountActionPayload>, CoreError> {
        let plan = self.no_op_plan("logout");
        Ok(CoreEnvelope::from_backend_plan(self.payload(&plan), &plan))
    }

    pub(crate) fn import_chatgpt_session_account(
        &self,
        session_json: Option<String>,
        overwrite_existing: Option<bool>,
    ) -> Result<CoreEnvelope<AccountActionPayload>, CoreError> {
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
        let mut payload = self.payload(&plan);
        payload.session_json_present = session_json
            .as_ref()
            .is_some_and(|value| !value.trim().is_empty());
        payload.overwrite_existing = overwrite_existing.unwrap_or(false);
        Ok(CoreEnvelope::from_backend_plan(payload, &plan))
    }

    pub(crate) fn export_accounts_to_file(
        &self,
        account_keys: Option<Vec<String>>,
        target_path: String,
    ) -> Result<CoreEnvelope<AccountActionPayload>, CoreError> {
        let target_path =
            required_text(target_path, "empty_export_path", "导出目标路径不能为空。")?;
        let plan = self.no_op_plan("export_accounts_to_file");
        let mut payload = self.payload(&plan);
        payload.account_keys = clean_optional_text_list(account_keys);
        payload.target_path = Some(target_path);
        Ok(CoreEnvelope::from_backend_plan(payload, &plan))
    }

    pub(crate) fn preview_account_import(
        &self,
        file_path: String,
    ) -> Result<CoreEnvelope<AccountActionPayload>, CoreError> {
        let file_path = required_text(file_path, "empty_import_path", "导入文件路径不能为空。")?;
        let plan = self.pending_plan("preview_account_import");
        let mut payload = self.payload(&plan);
        payload.file_path = Some(file_path);
        Ok(CoreEnvelope::from_backend_plan(payload, &plan))
    }

    pub(crate) fn import_accounts_from_file(
        &self,
        file_path: String,
        overwrite_existing: Option<bool>,
        selected_keys: Option<Vec<String>>,
    ) -> Result<CoreEnvelope<AccountActionPayload>, CoreError> {
        let file_path = required_text(file_path, "empty_import_path", "导入文件路径不能为空。")?;
        let plan = self.no_op_plan("import_accounts_from_file");
        let mut payload = self.payload(&plan);
        payload.file_path = Some(file_path);
        payload.overwrite_existing = overwrite_existing.unwrap_or(false);
        payload.selected_keys = clean_optional_text_list(selected_keys);
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

    fn payload(&self, plan: &BackendOperationPlan) -> AccountActionPayload {
        AccountActionPayload {
            status: BackendSkeletonStatus::from_plan(plan),
            ..Default::default()
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
