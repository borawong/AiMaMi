use crate::contracts::{AccountActionPayload, BackendSkeletonStatus, CoreEnvelope};
use crate::core::error::CoreError;
use crate::repository::RepositoryBundle;

/// 中文职责说明：账号动作事务 owner，后续真实导入、切换、删除逻辑只能在本边界内补齐。
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
        let _source_path = self.repositories.accounts().source_path();
        Ok(CoreEnvelope::pending(
            self.payload("begin_add_account_attach_monitor"),
            "begin_add_account_attach_monitor",
        ))
    }

    pub(crate) fn switch_account(
        &self,
        command: &'static str,
        account_key: String,
    ) -> Result<CoreEnvelope<AccountActionPayload>, CoreError> {
        let mut payload = self.payload(command);
        payload.account_key = Some(account_key);
        Ok(CoreEnvelope::no_op(payload, command))
    }

    pub(crate) fn remove_accounts(
        &self,
        account_keys: Vec<String>,
    ) -> Result<CoreEnvelope<AccountActionPayload>, CoreError> {
        let mut payload = self.payload("remove_accounts");
        payload.account_keys = account_keys;
        Ok(CoreEnvelope::no_op(payload, "remove_accounts"))
    }

    pub(crate) fn logout(&self) -> Result<CoreEnvelope<AccountActionPayload>, CoreError> {
        Ok(CoreEnvelope::no_op(self.payload("logout"), "logout"))
    }

    pub(crate) fn import_chatgpt_session_account(
        &self,
        session_json: Option<String>,
        overwrite_existing: Option<bool>,
    ) -> Result<CoreEnvelope<AccountActionPayload>, CoreError> {
        let mut payload = self.payload("import_chatgpt_session_account");
        payload.session_json_present = session_json.as_ref().is_some_and(|value| !value.is_empty());
        payload.overwrite_existing = overwrite_existing.unwrap_or(false);
        Ok(CoreEnvelope::no_op(
            payload,
            "import_chatgpt_session_account",
        ))
    }

    pub(crate) fn export_accounts_to_file(
        &self,
        account_keys: Vec<String>,
        target_path: String,
    ) -> Result<CoreEnvelope<AccountActionPayload>, CoreError> {
        let mut payload = self.payload("export_accounts_to_file");
        payload.account_keys = account_keys;
        payload.target_path = Some(target_path);
        Ok(CoreEnvelope::no_op(payload, "export_accounts_to_file"))
    }

    pub(crate) fn preview_account_import(
        &self,
        file_path: String,
    ) -> Result<CoreEnvelope<AccountActionPayload>, CoreError> {
        let mut payload = self.payload("preview_account_import");
        payload.file_path = Some(file_path);
        Ok(CoreEnvelope::pending(payload, "preview_account_import"))
    }

    pub(crate) fn import_accounts_from_file(
        &self,
        file_path: String,
        overwrite_existing: Option<bool>,
        selected_keys: Option<Vec<String>>,
    ) -> Result<CoreEnvelope<AccountActionPayload>, CoreError> {
        let mut payload = self.payload("import_accounts_from_file");
        payload.file_path = Some(file_path);
        payload.overwrite_existing = overwrite_existing.unwrap_or(false);
        payload.selected_keys = selected_keys.unwrap_or_default();
        Ok(CoreEnvelope::no_op(payload, "import_accounts_from_file"))
    }

    fn payload(&self, command: &'static str) -> AccountActionPayload {
        AccountActionPayload {
            status: BackendSkeletonStatus::for_command("accounts", command),
            ..Default::default()
        }
    }
}
