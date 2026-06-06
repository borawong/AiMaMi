use crate::contracts::{
    BackendSkeletonStatus, CoreEnvelope, VoiceAsrConfigPayload, VoiceGeneratePayload,
    VoiceLlmConfigPayload, VoiceRuntimeStatusPayload, VoiceTemplateMutationPayload,
    VoiceVocabularyMutationPayload, VoiceWorkspacePayload,
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
        let plan = self.plan("load_voice_workspace");
        Ok(CoreEnvelope::from_backend_plan(
            self.workspace_payload(&plan),
            &plan,
        ))
    }

    pub(crate) fn upsert_template(
        &self,
        _id: Option<String>,
        _title: Option<String>,
        _description: Option<String>,
        _content: Option<String>,
    ) -> Result<CoreEnvelope<VoiceTemplateMutationPayload>, CoreError> {
        let plan = self.plan("upsert_voice_template");
        Ok(CoreEnvelope::from_backend_plan(
            VoiceTemplateMutationPayload {
                workspace: self.workspace_payload(&plan),
                ..VoiceTemplateMutationPayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn remove_template(
        &self,
        id: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result("remove_voice_template", json!({ "id": id }))
    }

    pub(crate) fn upsert_vocabulary(
        &self,
        _id: Option<String>,
        _source: Option<String>,
        _replacement: Option<String>,
        _kind: Option<String>,
        _app_bundle_id: Option<String>,
        _app_name: Option<String>,
        _notes: Option<String>,
    ) -> Result<CoreEnvelope<VoiceVocabularyMutationPayload>, CoreError> {
        let plan = self.plan("upsert_voice_vocabulary");
        Ok(CoreEnvelope::from_backend_plan(
            VoiceVocabularyMutationPayload {
                workspace: self.workspace_payload(&plan),
                ..VoiceVocabularyMutationPayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn remove_vocabulary(
        &self,
        id: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result("remove_voice_vocabulary", json!({ "id": id }))
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
        self.value_result(
            "replace_voice_vocabulary_kind",
            json!({
                "kind": kind,
                "source": source,
                "replacement": replacement,
                "entries": entries.unwrap_or_else(|| json!([])),
                "appBundleId": app_bundle_id,
                "appName": app_name,
                "notes": notes
            }),
        )
    }

    pub(crate) fn remove_vocabulary_app_scope(
        &self,
        app_bundle_id: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result(
            "remove_voice_vocabulary_app_scope",
            json!({ "appBundleId": app_bundle_id }),
        )
    }

    pub(crate) fn upsert_vocabulary_app_scope(
        &self,
        bundle_id: Option<String>,
        name: Option<String>,
        path: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result(
            "upsert_voice_vocabulary_app_scope",
            json!({
                "bundleId": bundle_id,
                "name": name,
                "path": path
            }),
        )
    }

    pub(crate) fn resolve_vocabulary_app_info(
        &self,
        path: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result(
            "resolve_voice_vocabulary_app_info",
            json!({
                "bundleId": "",
                "name": "",
                "path": path
            }),
        )
    }

    pub(crate) fn generate_prompt(
        &self,
        _input: VoiceGenerateInput,
    ) -> Result<CoreEnvelope<VoiceGeneratePayload>, CoreError> {
        let plan = self.plan("generate_voice_prompt");
        Ok(CoreEnvelope::from_backend_plan(
            VoiceGeneratePayload {
                status: BackendSkeletonStatus::from_plan(&plan),
                workspace: self.workspace_payload(&plan),
                processing_status: "unsupported".into(),
                ..VoiceGeneratePayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn load_llm_config(
        &self,
        provider: Option<String>,
    ) -> Result<CoreEnvelope<VoiceLlmConfigPayload>, CoreError> {
        self.llm_payload("load_voice_llm_config", provider)
    }

    pub(crate) fn save_llm_config(
        &self,
        provider: Option<String>,
        _api_key: Option<String>,
        model: Option<String>,
        base_url: Option<String>,
    ) -> Result<CoreEnvelope<VoiceLlmConfigPayload>, CoreError> {
        let plan = self.plan("save_voice_llm_config");
        Ok(CoreEnvelope::from_backend_plan(
            VoiceLlmConfigPayload {
                status: BackendSkeletonStatus::from_plan(&plan),
                provider: provider.unwrap_or_default(),
                model: model.unwrap_or_default(),
                base_url: base_url.unwrap_or_default(),
                configured: false,
                ..VoiceLlmConfigPayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn test_llm_config(
        &self,
        provider: Option<String>,
        _api_key: Option<String>,
        model: Option<String>,
        base_url: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result(
            "test_voice_llm_config",
            json!({
                "provider": provider,
                "model": model,
                "baseUrl": base_url,
                "reachable": false
            }),
        )
    }

    pub(crate) fn load_asr_config(
        &self,
        provider: Option<String>,
    ) -> Result<CoreEnvelope<VoiceAsrConfigPayload>, CoreError> {
        self.asr_payload("load_voice_asr_config", provider)
    }

    pub(crate) fn save_asr_config(
        &self,
        provider: Option<String>,
        _api_key: Option<String>,
        model: Option<String>,
        base_url: Option<String>,
    ) -> Result<CoreEnvelope<VoiceAsrConfigPayload>, CoreError> {
        let plan = self.plan("save_voice_asr_config");
        Ok(CoreEnvelope::from_backend_plan(
            VoiceAsrConfigPayload {
                status: BackendSkeletonStatus::from_plan(&plan),
                provider: provider.unwrap_or_default(),
                model: model.unwrap_or_default(),
                base_url: base_url.unwrap_or_default(),
                configured: false,
                ..VoiceAsrConfigPayload::default()
            },
            &plan,
        ))
    }

    pub(crate) fn test_asr_config(
        &self,
        provider: Option<String>,
        _api_key: Option<String>,
        model: Option<String>,
        base_url: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result(
            "test_voice_asr_config",
            json!({
                "provider": provider,
                "model": model,
                "baseUrl": base_url,
                "reachable": false
            }),
        )
    }

    pub(crate) fn remove_history_entry(
        &self,
        id: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result("remove_voice_history_entry", json!({ "id": id }))
    }

    pub(crate) fn load_runtime_status(
        &self,
    ) -> Result<CoreEnvelope<VoiceRuntimeStatusPayload>, CoreError> {
        let plan = self.plan("load_voice_runtime_status");
        Ok(CoreEnvelope::from_backend_plan(
            self.runtime_payload(&plan),
            &plan,
        ))
    }

    pub(crate) fn request_permissions(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result("request_voice_permissions", json!({}))
    }

    pub(crate) fn request_accessibility_permission(
        &self,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result("request_accessibility_permission", json!({}))
    }

    pub(crate) fn set_global_shortcut(
        &self,
        _shortcut: Option<String>,
    ) -> Result<CoreEnvelope<VoiceRuntimeStatusPayload>, CoreError> {
        let plan = self.plan("set_voice_global_shortcut");
        Ok(CoreEnvelope::from_backend_plan(
            self.runtime_payload(&plan),
            &plan,
        ))
    }

    pub(crate) fn capture_trigger_key(
        &self,
        style: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result("capture_voice_trigger_key", json!({ "style": style }))
    }

    pub(crate) fn cancel_trigger_capture(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result("cancel_voice_trigger_capture", json!({}))
    }

    pub(crate) fn set_trigger_listener_suppressed(
        &self,
        suppressed: bool,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result(
            "set_voice_trigger_listener_suppressed",
            json!({ "suppressed": suppressed }),
        )
    }

    pub(crate) fn set_trigger_key(
        &self,
        input: VoiceTriggerKeyInput,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result(
            "set_voice_trigger_key",
            json!({
                "keyCode": input.key_code,
                "keyKind": input.key_kind,
                "keyLabel": input.key_label,
                "modifierMask": input.modifier_mask,
                "style": input.style
            }),
        )
    }

    pub(crate) fn set_trigger_bindings(
        &self,
        input: VoiceTriggerBindingsInput,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result(
            "set_voice_trigger_bindings",
            json!({
                "activeStyle": input.active_style,
                "holdKeyCode": input.hold_key_code,
                "holdKeyKind": input.hold_key_kind,
                "holdKeyLabel": input.hold_key_label,
                "holdModifierMask": input.hold_modifier_mask,
                "toggleKeyCode": input.toggle_key_code,
                "toggleKeyKind": input.toggle_key_kind,
                "toggleKeyLabel": input.toggle_key_label,
                "toggleModifierMask": input.toggle_modifier_mask
            }),
        )
    }

    pub(crate) fn update_runtime_settings(
        &self,
        input: VoiceRuntimeSettingsInput,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result(
            "update_voice_runtime_settings",
            json!({
                "enabled": input.enabled,
                "processingMode": input.processing_mode,
                "processingModeId": input.processing_mode_id,
                "shortcut": input.shortcut,
                "speechModel": input.speech_model
            }),
        )
    }

    pub(crate) fn set_processing_mode_id(
        &self,
        mode_id: Option<String>,
        processing_mode: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result(
            "set_voice_processing_mode_id",
            json!({
                "modeId": mode_id,
                "processingMode": processing_mode
            }),
        )
    }

    pub(crate) fn start_capture(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result("start_voice_capture", json!({}))
    }

    pub(crate) fn stop_capture(&self) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result("stop_voice_capture", json!({}))
    }

    pub(crate) fn inject_text(
        &self,
        text: Option<String>,
        expected_bundle_id: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result(
            "inject_voice_text",
            json!({
                "text": text,
                "expectedBundleId": expected_bundle_id
            }),
        )
    }

    pub(crate) fn show_search_overlay(
        &self,
        query: Option<String>,
        output: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result(
            "show_voice_search_overlay",
            json!({
                "query": query,
                "output": output
            }),
        )
    }

    pub(crate) fn set_mode_shortcut(
        &self,
        input: VoiceModeShortcutInput,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result(
            "set_voice_mode_shortcut",
            json!({
                "modeId": input.mode_id,
                "keyCode": input.key_code,
                "keyKind": input.key_kind,
                "keyLabel": input.key_label,
                "modifierMask": input.modifier_mask,
                "style": input.style
            }),
        )
    }

    pub(crate) fn remove_mode_shortcut(
        &self,
        mode_id: Option<String>,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        self.value_result("remove_voice_mode_shortcut", json!({ "modeId": mode_id }))
    }

    fn value_result(
        &self,
        command: &'static str,
        mut payload: Value,
    ) -> Result<CoreEnvelope<Value>, CoreError> {
        let plan = self.plan(command);
        if let Value::Object(ref mut object) = payload {
            object.insert(
                "backendStatus".into(),
                json!(BackendSkeletonStatus::from_plan(&plan)),
            );
        }
        Ok(CoreEnvelope::from_backend_plan(payload, &plan))
    }

    fn llm_payload(
        &self,
        command: &'static str,
        provider: Option<String>,
    ) -> Result<CoreEnvelope<VoiceLlmConfigPayload>, CoreError> {
        let plan = self.plan(command);
        Ok(CoreEnvelope::from_backend_plan(
            VoiceLlmConfigPayload {
                status: BackendSkeletonStatus::from_plan(&plan),
                provider: provider.unwrap_or_default(),
                ..VoiceLlmConfigPayload::default()
            },
            &plan,
        ))
    }

    fn asr_payload(
        &self,
        command: &'static str,
        provider: Option<String>,
    ) -> Result<CoreEnvelope<VoiceAsrConfigPayload>, CoreError> {
        let plan = self.plan(command);
        Ok(CoreEnvelope::from_backend_plan(
            VoiceAsrConfigPayload {
                status: BackendSkeletonStatus::from_plan(&plan),
                provider: provider.unwrap_or_default(),
                ..VoiceAsrConfigPayload::default()
            },
            &plan,
        ))
    }

    fn plan(&self, command: &'static str) -> BackendOperationPlan {
        BackendOperationPlan::unsupported(MODULE, command, self.repository_boundary())
    }

    fn repository_boundary(&self) -> BackendBoundaryProbe {
        BackendBoundaryProbe::from_repository_source(self.repositories.voice().source_path())
    }

    fn workspace_payload(&self, plan: &BackendOperationPlan) -> VoiceWorkspacePayload {
        VoiceWorkspacePayload {
            status: BackendSkeletonStatus::from_plan(plan),
            source_path: self.repositories.voice().source_path(),
            ..VoiceWorkspacePayload::default()
        }
    }

    fn runtime_payload(&self, plan: &BackendOperationPlan) -> VoiceRuntimeStatusPayload {
        VoiceRuntimeStatusPayload {
            status: BackendSkeletonStatus::from_plan(plan),
            supported: false,
            enabled: false,
            config_path: self.repositories.voice().source_path(),
            ..VoiceRuntimeStatusPayload::default()
        }
    }
}
