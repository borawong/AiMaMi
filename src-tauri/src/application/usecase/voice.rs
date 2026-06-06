use crate::contracts::{
    BackendSkeletonStatus, CoreEnvelope, VoiceAsrConfigPayload, VoiceGeneratePayload,
    VoiceHistoryEntry, VoiceLlmConfigPayload, VoiceRuntimeStatusPayload, VoiceWorkspacePayload,
};
use crate::core::dto::{BackendBoundaryProbe, BackendOperationPlan};
use crate::core::error::CoreError;
use crate::repository::RepositoryBundle;
use serde_json::{json, Value};

const MODULE: &str = "voice";

#[derive(Debug, Clone, Default)]
pub(crate) struct VoiceGenerateInput {
    pub template_id: Option<String>,
    pub raw_text: Option<String>,
    pub selected_text: Option<String>,
    pub clipboard_text: Option<String>,
    pub target_bundle_id: Option<String>,
    pub target_app_name: Option<String>,
    pub prompt_override: Option<String>,
    pub template_title: Option<String>,
    pub template_kind: Option<String>,
    pub llm_provider: Option<String>,
    pub llm_api_key: Option<String>,
    pub llm_model: Option<String>,
    pub llm_base_url: Option<String>,
    pub asr_provider: Option<String>,
    pub asr_model: Option<String>,
    pub asr_language: Option<String>,
    pub asr_emotion: Option<String>,
    pub asr_duration_ms: Option<u64>,
    pub asr_error_code: Option<String>,
}

#[derive(Debug, Clone, Default)]
pub(crate) struct VoiceTriggerKeyInput {
    pub key_code: Option<i64>,
    pub key_kind: Option<String>,
    pub key_label: Option<String>,
    pub modifier_mask: Option<u64>,
    pub style: Option<String>,
}

#[derive(Debug, Clone, Default)]
pub(crate) struct VoiceTriggerBindingsInput {
    pub active_style: Option<String>,
    pub hold_key_code: Option<i64>,
    pub hold_key_kind: Option<String>,
    pub hold_key_label: Option<String>,
    pub hold_modifier_mask: Option<u64>,
    pub toggle_key_code: Option<i64>,
    pub toggle_key_kind: Option<String>,
    pub toggle_key_label: Option<String>,
    pub toggle_modifier_mask: Option<u64>,
}

#[derive(Debug, Clone, Default)]
pub(crate) struct VoiceRuntimeSettingsInput {
    pub enabled: Option<bool>,
    pub processing_mode: Option<String>,
    pub processing_mode_id: Option<String>,
    pub shortcut: Option<String>,
    pub speech_model: Option<String>,
}

#[derive(Debug, Clone, Default)]
pub(crate) struct VoiceModeShortcutInput {
    pub mode_id: Option<String>,
    pub key_code: Option<i64>,
    pub key_kind: Option<String>,
    pub key_label: Option<String>,
    pub modifier_mask: Option<u64>,
    pub style: Option<String>,
}

pub(crate) struct VoiceUseCase<'a> {
    repositories: &'a RepositoryBundle,
}

impl<'a> VoiceUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle) -> Self {
        Self { repositories }
    }

    pub(crate) fn load_workspace(&self) -> Result<CoreEnvelope<VoiceWorkspacePayload>, CoreError> {
        let plan = self.pending_plan("load_voice_workspace");
        Ok(CoreEnvelope::from_backend_plan(
            VoiceWorkspacePayload {
                status: BackendSkeletonStatus::from_plan(&plan),
                source_path: self.repositories.voice().source_path(),
                ..VoiceWorkspacePayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn upsert_template(
        &self,
        id: Option<String>,
        title: Option<String>,
        description: Option<String>,
        content: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let id = text_or_default(id);
        let title = required_option_text(
            title,
            "empty_voice_template_title",
            "语音模板标题不能为空。",
        )?;
        let description = text_or_default(description);
        let content = required_option_text(
            content,
            "empty_voice_template_content",
            "语音模板内容不能为空。",
        )?;
        let plan = self.no_op_plan("upsert_voice_template");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(
                json!({
                    "id": id,
                    "title": title,
                    "description": description,
                    "content": content
                }),
                &plan,
            ),
            &plan,
        ))
    }

    pub(crate) fn remove_template(
        &self,
        id: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let id = required_option_text(id, "empty_voice_template_id", "语音模板 ID 不能为空。")?;
        let plan = self.no_op_plan("remove_voice_template");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(json!({ "id": id }), &plan),
            &plan,
        ))
    }

    pub(crate) fn upsert_vocabulary(
        &self,
        id: Option<String>,
        source: Option<String>,
        replacement: Option<String>,
        kind: Option<String>,
        app_bundle_id: Option<String>,
        app_name: Option<String>,
        notes: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let id = text_or_default(id);
        let source = required_option_text(
            source,
            "empty_voice_vocabulary_source",
            "语音词汇原文不能为空。",
        )?;
        let replacement = required_option_text(
            replacement,
            "empty_voice_vocabulary_replacement",
            "语音词汇替换文本不能为空。",
        )?;
        let kind = required_option_text(
            kind,
            "empty_voice_vocabulary_kind",
            "语音词汇类型不能为空。",
        )?;
        let app_bundle_id = trim_optional_text(app_bundle_id);
        let app_name = trim_optional_text(app_name);
        let notes = trim_optional_text(notes);
        let plan = self.no_op_plan("upsert_voice_vocabulary");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(
                json!({
                    "id": id,
                    "source": source,
                    "replacement": replacement,
                    "kind": kind,
                    "appBundleId": app_bundle_id,
                    "appName": app_name,
                    "notes": notes
                }),
                &plan,
            ),
            &plan,
        ))
    }

    pub(crate) fn remove_vocabulary(
        &self,
        id: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let id = required_option_text(id, "empty_voice_vocabulary_id", "语音词汇 ID 不能为空。")?;
        let plan = self.no_op_plan("remove_voice_vocabulary");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(json!({ "id": id }), &plan),
            &plan,
        ))
    }

    pub(crate) fn replace_vocabulary_kind(
        &self,
        kind: Option<String>,
        source: Option<String>,
        replacement: Option<String>,
        entries: Option<Value>,
        app_bundle_id: Option<String>,
        app_name: Option<String>,
        notes: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let kind = required_option_text(
            kind,
            "empty_voice_vocabulary_kind",
            "语音词汇类型不能为空。",
        )?;
        let source = text_or_default(source);
        let replacement = text_or_default(replacement);
        let app_bundle_id = trim_optional_text(app_bundle_id);
        let app_name = trim_optional_text(app_name);
        let notes = trim_optional_text(notes);
        let plan = self.no_op_plan("replace_voice_vocabulary_kind");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(
                json!({
                    "kind": kind,
                    "source": source,
                    "replacement": replacement,
                    "entries": entries.unwrap_or_else(|| json!([])),
                    "appBundleId": app_bundle_id,
                    "appName": app_name,
                    "notes": notes
                }),
                &plan,
            ),
            &plan,
        ))
    }

    pub(crate) fn remove_vocabulary_app_scope(
        &self,
        app_bundle_id: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let app_bundle_id = required_option_text(
            app_bundle_id,
            "empty_voice_app_bundle_id",
            "语音应用标识不能为空。",
        )?;
        let plan = self.no_op_plan("remove_voice_vocabulary_app_scope");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(json!({ "appBundleId": app_bundle_id }), &plan),
            &plan,
        ))
    }

    pub(crate) fn upsert_vocabulary_app_scope(
        &self,
        bundle_id: Option<String>,
        name: Option<String>,
        path: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let bundle_id = required_option_text(
            bundle_id,
            "empty_voice_app_bundle_id",
            "语音应用标识不能为空。",
        )?;
        let name = required_option_text(name, "empty_voice_app_name", "语音应用名称不能为空。")?;
        let path = required_option_text(path, "empty_voice_app_path", "语音应用路径不能为空。")?;
        let plan = self.no_op_plan("upsert_voice_vocabulary_app_scope");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(
                json!({
                    "bundleId": bundle_id,
                    "name": name,
                    "path": path
                }),
                &plan,
            ),
            &plan,
        ))
    }

    pub(crate) fn resolve_vocabulary_app_info(
        &self,
        path: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let path = required_option_text(path, "empty_voice_app_path", "语音应用路径不能为空。")?;
        let plan = self.pending_plan("resolve_voice_vocabulary_app_info");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(
                json!({
                    "bundleId": "",
                    "name": "",
                    "path": path
                }),
                &plan,
            ),
            &plan,
        ))
    }

    pub(crate) fn generate_prompt(
        &self,
        input: VoiceGenerateInput,
    ) -> Result<CoreEnvelope<VoiceGeneratePayload>, CoreError> {
        let plan = self.pending_plan("generate_voice_prompt");
        let _provider_context = json!({
            "llmProvider": trim_optional_text(input.llm_provider),
            "llmConfigured": input.llm_api_key.as_ref().is_some_and(|value| !value.trim().is_empty()),
            "llmModel": trim_optional_text(input.llm_model),
            "llmBaseUrl": trim_optional_text(input.llm_base_url),
            "templateKind": trim_optional_text(input.template_kind),
            "promptOverridePresent": input.prompt_override.as_ref().is_some_and(|value| !value.trim().is_empty())
        });
        Ok(CoreEnvelope::from_backend_plan(
            VoiceGeneratePayload {
                status: BackendSkeletonStatus::from_plan(&plan),
                history_entry: VoiceHistoryEntry {
                    template_id: text_or_default(input.template_id),
                    template_title: text_or_default(input.template_title),
                    raw_text: text_or_default(input.raw_text),
                    selected_text: text_or_default(input.selected_text),
                    clipboard_text: text_or_default(input.clipboard_text),
                    target_bundle_id: text_or_default(input.target_bundle_id),
                    target_app_name: text_or_default(input.target_app_name),
                    asr_provider: text_or_default(input.asr_provider),
                    asr_model: text_or_default(input.asr_model),
                    asr_language: text_or_default(input.asr_language),
                    asr_emotion: text_or_default(input.asr_emotion),
                    asr_duration_ms: input.asr_duration_ms,
                    asr_error_code: trim_optional_text(input.asr_error_code),
                    ..VoiceHistoryEntry::default()
                },
                workspace: VoiceWorkspacePayload {
                    status: BackendSkeletonStatus::from_plan(&plan),
                    source_path: self.repositories.voice().source_path(),
                    ..VoiceWorkspacePayload::default()
                },
                processing_status: "pending".into(),
                ..VoiceGeneratePayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn load_llm_config(
        &self,
        provider: Option<String>,
    ) -> Result<CoreEnvelope<VoiceLlmConfigPayload>, CoreError> {
        let provider = required_provider(provider)?;
        let plan = self.pending_plan("load_voice_llm_config");
        Ok(CoreEnvelope::from_backend_plan(
            VoiceLlmConfigPayload {
                status: BackendSkeletonStatus::from_plan(&plan),
                provider,
                ..VoiceLlmConfigPayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn save_llm_config(
        &self,
        provider: Option<String>,
        api_key: Option<String>,
        model: Option<String>,
        base_url: Option<String>,
    ) -> Result<CoreEnvelope<VoiceLlmConfigPayload>, CoreError> {
        let provider = required_provider(provider)?;
        let _api_key = trim_optional_text(api_key);
        let model = text_or_default(model);
        let base_url = text_or_default(base_url);
        let plan = self.no_op_plan("save_voice_llm_config");
        Ok(CoreEnvelope::from_backend_plan(
            VoiceLlmConfigPayload {
                status: BackendSkeletonStatus::from_plan(&plan),
                provider,
                api_key: String::new(),
                model,
                base_url,
                configured: false,
            },
            &plan,
        ))
    }

    pub(crate) fn test_llm_config(
        &self,
        provider: Option<String>,
        api_key: Option<String>,
        model: Option<String>,
        base_url: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let provider = required_provider(provider)?;
        let _api_key = trim_optional_text(api_key);
        let model = text_or_default(model);
        let base_url = text_or_default(base_url);
        let plan = self.pending_plan("test_voice_llm_config");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(
                json!({
                    "provider": provider,
                    "model": model,
                    "baseUrl": base_url,
                    "reachable": false
                }),
                &plan,
            ),
            &plan,
        ))
    }

    pub(crate) fn load_asr_config(
        &self,
        provider: Option<String>,
    ) -> Result<CoreEnvelope<VoiceAsrConfigPayload>, CoreError> {
        let provider = required_provider(provider)?;
        let plan = self.pending_plan("load_voice_asr_config");
        Ok(CoreEnvelope::from_backend_plan(
            VoiceAsrConfigPayload {
                status: BackendSkeletonStatus::from_plan(&plan),
                provider,
                ..VoiceAsrConfigPayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn save_asr_config(
        &self,
        provider: Option<String>,
        api_key: Option<String>,
        model: Option<String>,
        base_url: Option<String>,
    ) -> Result<CoreEnvelope<VoiceAsrConfigPayload>, CoreError> {
        let provider = required_provider(provider)?;
        let _api_key = trim_optional_text(api_key);
        let model = text_or_default(model);
        let base_url = text_or_default(base_url);
        let plan = self.no_op_plan("save_voice_asr_config");
        Ok(CoreEnvelope::from_backend_plan(
            VoiceAsrConfigPayload {
                status: BackendSkeletonStatus::from_plan(&plan),
                provider,
                api_key: String::new(),
                model,
                base_url,
                configured: false,
            },
            &plan,
        ))
    }

    pub(crate) fn test_asr_config(
        &self,
        provider: Option<String>,
        api_key: Option<String>,
        model: Option<String>,
        base_url: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let provider = required_provider(provider)?;
        let _api_key = trim_optional_text(api_key);
        let model = text_or_default(model);
        let base_url = text_or_default(base_url);
        let plan = self.pending_plan("test_voice_asr_config");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(
                json!({
                    "provider": provider,
                    "model": model,
                    "baseUrl": base_url,
                    "reachable": false
                }),
                &plan,
            ),
            &plan,
        ))
    }

    pub(crate) fn remove_history_entry(
        &self,
        id: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let id = required_option_text(id, "empty_voice_history_id", "语音历史 ID 不能为空。")?;
        let plan = self.no_op_plan("remove_voice_history_entry");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(json!({ "id": id }), &plan),
            &plan,
        ))
    }

    pub(crate) fn load_runtime_status(
        &self,
    ) -> Result<CoreEnvelope<VoiceRuntimeStatusPayload>, CoreError> {
        let plan = self.pending_plan("load_voice_runtime_status");
        Ok(CoreEnvelope::from_backend_plan(
            VoiceRuntimeStatusPayload {
                status: BackendSkeletonStatus::from_plan(&plan),
                ..VoiceRuntimeStatusPayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn request_permissions(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.pending_plan("request_voice_permissions");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(json!({}), &plan),
            &plan,
        ))
    }

    pub(crate) fn request_accessibility_permission(
        &self,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.pending_plan("request_accessibility_permission");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(json!({}), &plan),
            &plan,
        ))
    }

    pub(crate) fn set_global_shortcut(
        &self,
        shortcut: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let shortcut =
            required_option_text(shortcut, "empty_voice_shortcut", "语音快捷键不能为空。")?;
        let plan = self.no_op_plan("set_voice_global_shortcut");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(json!({ "shortcut": shortcut }), &plan),
            &plan,
        ))
    }

    pub(crate) fn capture_trigger_key(
        &self,
        style: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let style = text_or_default(style);
        let plan = self.pending_plan("capture_voice_trigger_key");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(json!({ "style": style }), &plan),
            &plan,
        ))
    }

    pub(crate) fn cancel_trigger_capture(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.no_op_plan("cancel_voice_trigger_capture");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(json!({}), &plan),
            &plan,
        ))
    }

    pub(crate) fn set_trigger_listener_suppressed(
        &self,
        suppressed: bool,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.no_op_plan("set_voice_trigger_listener_suppressed");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(json!({ "suppressed": suppressed }), &plan),
            &plan,
        ))
    }

    pub(crate) fn set_trigger_key(
        &self,
        input: VoiceTriggerKeyInput,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.no_op_plan("set_voice_trigger_key");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(
                json!({
                    "keyCode": input.key_code,
                    "keyKind": trim_optional_text(input.key_kind),
                    "keyLabel": trim_optional_text(input.key_label),
                    "modifierMask": input.modifier_mask,
                    "style": trim_optional_text(input.style)
                }),
                &plan,
            ),
            &plan,
        ))
    }

    pub(crate) fn set_trigger_bindings(
        &self,
        input: VoiceTriggerBindingsInput,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.no_op_plan("set_voice_trigger_bindings");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(
                json!({
                    "activeStyle": trim_optional_text(input.active_style),
                    "holdKeyCode": input.hold_key_code,
                    "holdKeyKind": trim_optional_text(input.hold_key_kind),
                    "holdKeyLabel": trim_optional_text(input.hold_key_label),
                    "holdModifierMask": input.hold_modifier_mask,
                    "toggleKeyCode": input.toggle_key_code,
                    "toggleKeyKind": trim_optional_text(input.toggle_key_kind),
                    "toggleKeyLabel": trim_optional_text(input.toggle_key_label),
                    "toggleModifierMask": input.toggle_modifier_mask
                }),
                &plan,
            ),
            &plan,
        ))
    }

    pub(crate) fn update_runtime_settings(
        &self,
        input: VoiceRuntimeSettingsInput,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.no_op_plan("update_voice_runtime_settings");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(
                json!({
                    "enabled": input.enabled,
                    "processingMode": trim_optional_text(input.processing_mode),
                    "processingModeId": trim_optional_text(input.processing_mode_id),
                    "shortcut": trim_optional_text(input.shortcut),
                    "speechModel": trim_optional_text(input.speech_model)
                }),
                &plan,
            ),
            &plan,
        ))
    }

    pub(crate) fn set_processing_mode_id(
        &self,
        mode_id: Option<String>,
        processing_mode: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let mode_id = required_option_text(
            mode_id,
            "empty_voice_processing_mode_id",
            "语音处理模式 ID 不能为空。",
        )?;
        let processing_mode = trim_optional_text(processing_mode);
        let plan = self.no_op_plan("set_voice_processing_mode_id");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(
                json!({
                    "modeId": mode_id,
                    "processingMode": processing_mode
                }),
                &plan,
            ),
            &plan,
        ))
    }

    pub(crate) fn start_capture(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.pending_plan("start_voice_capture");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(json!({}), &plan),
            &plan,
        ))
    }

    pub(crate) fn stop_capture(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.pending_plan("stop_voice_capture");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(json!({}), &plan),
            &plan,
        ))
    }

    pub(crate) fn inject_text(
        &self,
        text: Option<String>,
        expected_bundle_id: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let text = required_option_text(text, "empty_voice_text", "注入文本不能为空。")?;
        let expected_bundle_id = trim_optional_text(expected_bundle_id);
        let plan = self.no_op_plan("inject_voice_text");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(
                json!({
                    "text": text,
                    "expectedBundleId": expected_bundle_id
                }),
                &plan,
            ),
            &plan,
        ))
    }

    pub(crate) fn show_search_overlay(
        &self,
        query: Option<String>,
        output: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let query = text_or_default(query);
        let output = text_or_default(output);
        let plan = self.no_op_plan("show_voice_search_overlay");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(
                json!({
                    "query": query,
                    "output": output
                }),
                &plan,
            ),
            &plan,
        ))
    }

    pub(crate) fn set_mode_shortcut(
        &self,
        input: VoiceModeShortcutInput,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.no_op_plan("set_voice_mode_shortcut");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(
                json!({
                    "modeId": trim_optional_text(input.mode_id),
                    "keyCode": input.key_code,
                    "keyKind": trim_optional_text(input.key_kind),
                    "keyLabel": trim_optional_text(input.key_label),
                    "modifierMask": input.modifier_mask,
                    "style": trim_optional_text(input.style)
                }),
                &plan,
            ),
            &plan,
        ))
    }

    pub(crate) fn remove_mode_shortcut(
        &self,
        mode_id: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let mode_id =
            required_option_text(mode_id, "empty_voice_mode_id", "语音模式 ID 不能为空。")?;
        let plan = self.no_op_plan("remove_voice_mode_shortcut");
        Ok(CoreEnvelope::from_backend_plan(
            json_with_status(json!({ "modeId": mode_id }), &plan),
            &plan,
        ))
    }

    fn pending_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::pending(MODULE, command, self.repository_boundary())
    }

    fn no_op_plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::no_op(MODULE, command, self.repository_boundary())
    }

    fn repository_boundary(&self) -> BackendBoundaryProbe {
        BackendBoundaryProbe::from_repository_source(self.repositories.voice().source_path())
    }
}

fn json_with_status(mut payload: Value, plan: &BackendOperationPlan) -> Value {
    if let Value::Object(ref mut object) = payload {
        object.insert(
            "backendStatus".into(),
            json!(BackendSkeletonStatus::from_plan(plan)),
        );
    }
    payload
}

fn required_provider(value: Option<String>) -> Result<String, CoreError> {
    required_option_text(value, "empty_voice_provider", "语音服务提供方不能为空。")
}

fn required_option_text(
    value: Option<String>,
    code: &'static str,
    public_message: &'static str,
) -> Result<String, CoreError> {
    required_text(value.unwrap_or_default(), code, public_message)
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

fn text_or_default(value: Option<String>) -> String {
    trim_optional_text(value).unwrap_or_default()
}

fn trim_optional_text(value: Option<String>) -> Option<String> {
    value.map(|value| value.trim().to_owned())
}
