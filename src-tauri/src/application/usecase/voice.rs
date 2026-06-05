use crate::contracts::{
    CoreEnvelope, VoiceAsrConfigPayload, VoiceGeneratePayload, VoiceLlmConfigPayload,
    VoiceRuntimeStatusPayload, VoiceWorkspacePayload,
};
use crate::core::error::CoreError;
use crate::repository::RepositoryBundle;
use serde_json::{json, Value};

/// 中文职责说明：语音工作区、词汇、模型配置和运行态用户动作事务 owner。
pub(crate) struct VoiceUseCase<'a> {
    repositories: &'a RepositoryBundle,
}

impl<'a> VoiceUseCase<'a> {
    pub(crate) fn new(repositories: &'a RepositoryBundle) -> Self {
        Self { repositories }
    }

    pub(crate) fn load_workspace(&self) -> Result<CoreEnvelope<VoiceWorkspacePayload>, CoreError> {
        Ok(CoreEnvelope::pending(
            VoiceWorkspacePayload {
                source_path: self.repositories.config().voice_source_path(),
                ..VoiceWorkspacePayload::default()
            },
            "voice_workspace",
        ))
    }

    pub(crate) fn upsert_template(
        &self,
        id: Option<String>,
        title: Option<String>,
        description: Option<String>,
        content: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let payload = json!({
            "id": id.unwrap_or_default(),
            "title": title.unwrap_or_default(),
            "description": description.unwrap_or_default(),
            "content": content.unwrap_or_default()
        });
        Ok(CoreEnvelope::no_op(payload, "upsert_voice_template"))
    }

    pub(crate) fn remove_template(
        &self,
        id: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(
            json!({ "id": id.unwrap_or_default() }),
            "remove_voice_template",
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
        Ok(CoreEnvelope::no_op(
            json!({
                "id": id.unwrap_or_default(),
                "source": source.unwrap_or_default(),
                "replacement": replacement.unwrap_or_default(),
                "kind": kind.unwrap_or_default(),
                "appBundleId": app_bundle_id,
                "appName": app_name,
                "notes": notes
            }),
            "upsert_voice_vocabulary",
        ))
    }

    pub(crate) fn remove_vocabulary(
        &self,
        id: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(
            json!({ "id": id.unwrap_or_default() }),
            "remove_voice_vocabulary",
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
        Ok(CoreEnvelope::no_op(
            json!({
                "kind": kind.unwrap_or_default(),
                "source": source.unwrap_or_default(),
                "replacement": replacement.unwrap_or_default(),
                "entries": entries.unwrap_or_else(|| json!([])),
                "appBundleId": app_bundle_id,
                "appName": app_name,
                "notes": notes
            }),
            "replace_voice_vocabulary_kind",
        ))
    }

    pub(crate) fn remove_vocabulary_app_scope(
        &self,
        app_bundle_id: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(
            json!({ "appBundleId": app_bundle_id }),
            "remove_voice_vocabulary_app_scope",
        ))
    }

    pub(crate) fn upsert_vocabulary_app_scope(
        &self,
        bundle_id: Option<String>,
        name: Option<String>,
        path: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(
            json!({
                "bundleId": bundle_id.unwrap_or_default(),
                "name": name.unwrap_or_default(),
                "path": path.unwrap_or_default()
            }),
            "upsert_voice_vocabulary_app_scope",
        ))
    }

    pub(crate) fn resolve_vocabulary_app_info(
        &self,
        path: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::pending(
            json!({
                "bundleId": "",
                "name": "",
                "path": path.unwrap_or_default()
            }),
            "resolve_voice_vocabulary_app_info",
        ))
    }

    pub(crate) fn generate_prompt(&self) -> Result<CoreEnvelope<VoiceGeneratePayload>, CoreError> {
        Ok(CoreEnvelope::pending(
            VoiceGeneratePayload::default(),
            "generate_voice_prompt",
        ))
    }

    pub(crate) fn load_llm_config(
        &self,
        provider: Option<String>,
    ) -> Result<CoreEnvelope<VoiceLlmConfigPayload>, CoreError> {
        Ok(CoreEnvelope::pending(
            VoiceLlmConfigPayload {
                provider: provider.unwrap_or_default(),
                ..VoiceLlmConfigPayload::default()
            },
            "load_voice_llm_config",
        ))
    }

    pub(crate) fn save_llm_config(
        &self,
        provider: Option<String>,
        _api_key: Option<String>,
        model: Option<String>,
        base_url: Option<String>,
    ) -> Result<CoreEnvelope<VoiceLlmConfigPayload>, CoreError> {
        Ok(CoreEnvelope::no_op(
            VoiceLlmConfigPayload {
                provider: provider.unwrap_or_default(),
                api_key: String::new(),
                model: model.unwrap_or_default(),
                base_url: base_url.unwrap_or_default(),
                configured: false,
            },
            "save_voice_llm_config",
        ))
    }

    pub(crate) fn test_llm_config(
        &self,
        provider: Option<String>,
        _api_key: Option<String>,
        model: Option<String>,
        base_url: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::pending(
            json!({
                "provider": provider.unwrap_or_default(),
                "model": model.unwrap_or_default(),
                "baseUrl": base_url.unwrap_or_default(),
                "reachable": false
            }),
            "test_voice_llm_config",
        ))
    }

    pub(crate) fn load_asr_config(
        &self,
        provider: Option<String>,
    ) -> Result<CoreEnvelope<VoiceAsrConfigPayload>, CoreError> {
        Ok(CoreEnvelope::pending(
            VoiceAsrConfigPayload {
                provider: provider.unwrap_or_default(),
                ..VoiceAsrConfigPayload::default()
            },
            "load_voice_asr_config",
        ))
    }

    pub(crate) fn save_asr_config(
        &self,
        provider: Option<String>,
        _api_key: Option<String>,
        model: Option<String>,
        base_url: Option<String>,
    ) -> Result<CoreEnvelope<VoiceAsrConfigPayload>, CoreError> {
        Ok(CoreEnvelope::no_op(
            VoiceAsrConfigPayload {
                provider: provider.unwrap_or_default(),
                api_key: String::new(),
                model: model.unwrap_or_default(),
                base_url: base_url.unwrap_or_default(),
                configured: false,
            },
            "save_voice_asr_config",
        ))
    }

    pub(crate) fn test_asr_config(
        &self,
        provider: Option<String>,
        _api_key: Option<String>,
        model: Option<String>,
        base_url: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::pending(
            json!({
                "provider": provider.unwrap_or_default(),
                "model": model.unwrap_or_default(),
                "baseUrl": base_url.unwrap_or_default(),
                "reachable": false
            }),
            "test_voice_asr_config",
        ))
    }

    pub(crate) fn remove_history_entry(
        &self,
        id: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(
            json!({ "id": id.unwrap_or_default() }),
            "remove_voice_history_entry",
        ))
    }

    pub(crate) fn load_runtime_status(
        &self,
    ) -> Result<CoreEnvelope<VoiceRuntimeStatusPayload>, CoreError> {
        Ok(CoreEnvelope::pending(
            VoiceRuntimeStatusPayload::default(),
            "load_voice_runtime_status",
        ))
    }

    pub(crate) fn request_permissions(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::pending(
            json!({}),
            "request_voice_permissions",
        ))
    }

    pub(crate) fn request_accessibility_permission(
        &self,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::pending(
            json!({}),
            "request_accessibility_permission",
        ))
    }

    pub(crate) fn set_global_shortcut(
        &self,
        shortcut: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(
            json!({ "shortcut": shortcut }),
            "set_voice_global_shortcut",
        ))
    }

    pub(crate) fn capture_trigger_key(
        &self,
        style: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::pending(
            json!({ "style": style.unwrap_or_default() }),
            "capture_voice_trigger_key",
        ))
    }

    pub(crate) fn cancel_trigger_capture(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(
            json!({}),
            "cancel_voice_trigger_capture",
        ))
    }

    pub(crate) fn set_trigger_listener_suppressed(
        &self,
        suppressed: bool,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(
            json!({ "suppressed": suppressed }),
            "set_voice_trigger_listener_suppressed",
        ))
    }

    pub(crate) fn set_trigger_key(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(json!({}), "set_voice_trigger_key"))
    }

    pub(crate) fn set_trigger_bindings(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(json!({}), "set_voice_trigger_bindings"))
    }

    pub(crate) fn update_runtime_settings(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(
            json!({}),
            "update_voice_runtime_settings",
        ))
    }

    pub(crate) fn set_processing_mode_id(
        &self,
        mode_id: Option<String>,
        processing_mode: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(
            json!({
                "modeId": mode_id.unwrap_or_default(),
                "processingMode": processing_mode
            }),
            "set_voice_processing_mode_id",
        ))
    }

    pub(crate) fn start_capture(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::pending(json!({}), "start_voice_capture"))
    }

    pub(crate) fn stop_capture(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::pending(json!({}), "stop_voice_capture"))
    }

    pub(crate) fn inject_text(
        &self,
        text: Option<String>,
        expected_bundle_id: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(
            json!({
                "text": text.unwrap_or_default(),
                "expectedBundleId": expected_bundle_id
            }),
            "inject_voice_text",
        ))
    }

    pub(crate) fn show_search_overlay(
        &self,
        query: Option<String>,
        output: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(
            json!({
                "query": query.unwrap_or_default(),
                "output": output.unwrap_or_default()
            }),
            "show_voice_search_overlay",
        ))
    }

    pub(crate) fn set_mode_shortcut(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(json!({}), "set_voice_mode_shortcut"))
    }

    pub(crate) fn remove_mode_shortcut(
        &self,
        mode_id: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        Ok(CoreEnvelope::no_op(
            json!({ "modeId": mode_id.unwrap_or_default() }),
            "remove_voice_mode_shortcut",
        ))
    }
}
