use crate::adapters::tauri::state::TauriAppState;
use crate::application::usecase::voice::{
    VoiceGenerateInput, VoiceModeShortcutInput, VoiceRuntimeSettingsInput,
    VoiceTriggerBindingsInput, VoiceTriggerKeyInput,
};
use crate::commands::respond;
use crate::contracts::{
    CoreEnvelope, VoiceAsrConfigPayload, VoiceGeneratePayload, VoiceLlmConfigPayload,
    VoiceRuntimeStatusPayload, VoiceTemplateMutationPayload, VoiceVocabularyMutationPayload,
    VoiceWorkspacePayload,
};
use serde_json::Value;
use tauri::State;

#[tauri::command]
pub(crate) fn load_voice_workspace(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<VoiceWorkspacePayload>, String> {
    respond(state.services().voice().load_workspace())
}

#[tauri::command]
pub(crate) fn upsert_voice_template(
    state: State<'_, TauriAppState>,
    id: Option<String>,
    title: Option<String>,
    description: Option<String>,
    content: Option<String>,
) -> Result<CoreEnvelope<VoiceTemplateMutationPayload>, String> {
    respond(
        state
            .services()
            .voice()
            .upsert_template(id, title, description, content),
    )
}

#[tauri::command]
pub(crate) fn remove_voice_template(
    state: State<'_, TauriAppState>,
    id: Option<String>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().voice().remove_template(id))
}

#[tauri::command]
pub(crate) fn upsert_voice_vocabulary(
    state: State<'_, TauriAppState>,
    id: Option<String>,
    source: Option<String>,
    replacement: Option<String>,
    kind: Option<String>,
    app_bundle_id: Option<String>,
    app_name: Option<String>,
    notes: Option<String>,
) -> Result<CoreEnvelope<VoiceVocabularyMutationPayload>, String> {
    respond(state.services().voice().upsert_vocabulary(
        id,
        source,
        replacement,
        kind,
        app_bundle_id,
        app_name,
        notes,
    ))
}

#[tauri::command]
pub(crate) fn remove_voice_vocabulary(
    state: State<'_, TauriAppState>,
    id: Option<String>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().voice().remove_vocabulary(id))
}

#[tauri::command]
pub(crate) fn replace_voice_vocabulary_kind(
    state: State<'_, TauriAppState>,
    kind: Option<String>,
    source: Option<String>,
    replacement: Option<String>,
    entries: Option<Value>,
    app_bundle_id: Option<String>,
    app_name: Option<String>,
    notes: Option<String>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().voice().replace_vocabulary_kind(
        kind,
        source,
        replacement,
        entries,
        app_bundle_id,
        app_name,
        notes,
    ))
}

#[tauri::command]
pub(crate) fn remove_voice_vocabulary_app_scope(
    state: State<'_, TauriAppState>,
    app_bundle_id: Option<String>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(
        state
            .services()
            .voice()
            .remove_vocabulary_app_scope(app_bundle_id),
    )
}

#[tauri::command]
pub(crate) fn upsert_voice_vocabulary_app_scope(
    state: State<'_, TauriAppState>,
    bundle_id: Option<String>,
    name: Option<String>,
    path: Option<String>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(
        state
            .services()
            .voice()
            .upsert_vocabulary_app_scope(bundle_id, name, path),
    )
}

#[tauri::command]
pub(crate) fn resolve_voice_vocabulary_app_info(
    state: State<'_, TauriAppState>,
    path: Option<String>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().voice().resolve_vocabulary_app_info(path))
}

#[tauri::command]
pub(crate) fn generate_voice_prompt(
    state: State<'_, TauriAppState>,
    template_id: Option<String>,
    raw_text: Option<String>,
    selected_text: Option<String>,
    clipboard_text: Option<String>,
    target_bundle_id: Option<String>,
    target_app_name: Option<String>,
    prompt_override: Option<String>,
    template_title: Option<String>,
    template_kind: Option<String>,
    llm_provider: Option<String>,
    llm_api_key: Option<String>,
    llm_model: Option<String>,
    llm_base_url: Option<String>,
    asr_provider: Option<String>,
    asr_model: Option<String>,
    asr_language: Option<String>,
    asr_emotion: Option<String>,
    asr_duration_ms: Option<u64>,
    asr_error_code: Option<String>,
) -> Result<CoreEnvelope<VoiceGeneratePayload>, String> {
    respond(
        state
            .services()
            .voice()
            .generate_prompt(VoiceGenerateInput {
                template_id,
                raw_text,
                selected_text,
                clipboard_text,
                target_bundle_id,
                target_app_name,
                prompt_override,
                template_title,
                template_kind,
                llm_provider,
                llm_api_key,
                llm_model,
                llm_base_url,
                asr_provider,
                asr_model,
                asr_language,
                asr_emotion,
                asr_duration_ms,
                asr_error_code,
            }),
    )
}

#[tauri::command]
pub(crate) fn load_voice_llm_config(
    state: State<'_, TauriAppState>,
    provider: Option<String>,
) -> Result<CoreEnvelope<VoiceLlmConfigPayload>, String> {
    respond(state.services().voice().load_llm_config(provider))
}

#[tauri::command]
pub(crate) fn save_voice_llm_config(
    state: State<'_, TauriAppState>,
    llm_provider: Option<String>,
    llm_api_key: Option<String>,
    llm_model: Option<String>,
    llm_base_url: Option<String>,
) -> Result<CoreEnvelope<VoiceLlmConfigPayload>, String> {
    respond(state.services().voice().save_llm_config(
        llm_provider,
        llm_api_key,
        llm_model,
        llm_base_url,
    ))
}

#[tauri::command]
pub(crate) fn test_voice_llm_config(
    state: State<'_, TauriAppState>,
    llm_provider: Option<String>,
    llm_api_key: Option<String>,
    llm_model: Option<String>,
    llm_base_url: Option<String>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().voice().test_llm_config(
        llm_provider,
        llm_api_key,
        llm_model,
        llm_base_url,
    ))
}

#[tauri::command]
pub(crate) fn load_voice_asr_config(
    state: State<'_, TauriAppState>,
    provider: Option<String>,
) -> Result<CoreEnvelope<VoiceAsrConfigPayload>, String> {
    respond(state.services().voice().load_asr_config(provider))
}

#[tauri::command]
pub(crate) fn save_voice_asr_config(
    state: State<'_, TauriAppState>,
    asr_provider: Option<String>,
    asr_api_key: Option<String>,
    asr_model: Option<String>,
    asr_base_url: Option<String>,
) -> Result<CoreEnvelope<VoiceAsrConfigPayload>, String> {
    respond(state.services().voice().save_asr_config(
        asr_provider,
        asr_api_key,
        asr_model,
        asr_base_url,
    ))
}

#[tauri::command]
pub(crate) fn test_voice_asr_config(
    state: State<'_, TauriAppState>,
    asr_provider: Option<String>,
    asr_api_key: Option<String>,
    asr_model: Option<String>,
    asr_base_url: Option<String>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().voice().test_asr_config(
        asr_provider,
        asr_api_key,
        asr_model,
        asr_base_url,
    ))
}

#[tauri::command]
pub(crate) fn remove_voice_history_entry(
    state: State<'_, TauriAppState>,
    id: Option<String>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().voice().remove_history_entry(id))
}

#[tauri::command]
pub(crate) fn load_voice_runtime_status(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<VoiceRuntimeStatusPayload>, String> {
    respond(state.services().voice().load_runtime_status())
}

#[tauri::command]
pub(crate) fn request_voice_permissions(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().voice().request_permissions())
}

#[tauri::command]
pub(crate) fn request_accessibility_permission(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().voice().request_accessibility_permission())
}

#[tauri::command]
pub(crate) fn set_voice_global_shortcut(
    state: State<'_, TauriAppState>,
    shortcut: Option<String>,
) -> Result<CoreEnvelope<VoiceRuntimeStatusPayload>, String> {
    respond(state.services().voice().set_global_shortcut(shortcut))
}

#[tauri::command]
pub(crate) fn capture_voice_trigger_key(
    state: State<'_, TauriAppState>,
    style: Option<String>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().voice().capture_trigger_key(style))
}

#[tauri::command]
pub(crate) fn cancel_voice_trigger_capture(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().voice().cancel_trigger_capture())
}

#[tauri::command]
pub(crate) fn set_voice_trigger_listener_suppressed(
    state: State<'_, TauriAppState>,
    suppressed: Option<bool>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(
        state
            .services()
            .voice()
            .set_trigger_listener_suppressed(suppressed.unwrap_or(false)),
    )
}

#[tauri::command]
pub(crate) fn set_voice_trigger_key(
    state: State<'_, TauriAppState>,
    key_code: Option<i64>,
    key_kind: Option<String>,
    key_label: Option<String>,
    modifier_mask: Option<u64>,
    style: Option<String>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(
        state
            .services()
            .voice()
            .set_trigger_key(VoiceTriggerKeyInput {
                key_code,
                key_kind,
                key_label,
                modifier_mask,
                style,
            }),
    )
}

#[tauri::command]
pub(crate) fn set_voice_trigger_bindings(
    state: State<'_, TauriAppState>,
    active_style: Option<String>,
    hold_key_code: Option<i64>,
    hold_key_kind: Option<String>,
    hold_key_label: Option<String>,
    hold_modifier_mask: Option<u64>,
    toggle_key_code: Option<i64>,
    toggle_key_kind: Option<String>,
    toggle_key_label: Option<String>,
    toggle_modifier_mask: Option<u64>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(
        state
            .services()
            .voice()
            .set_trigger_bindings(VoiceTriggerBindingsInput {
                active_style,
                hold_key_code,
                hold_key_kind,
                hold_key_label,
                hold_modifier_mask,
                toggle_key_code,
                toggle_key_kind,
                toggle_key_label,
                toggle_modifier_mask,
            }),
    )
}

#[tauri::command]
pub(crate) fn update_voice_runtime_settings(
    state: State<'_, TauriAppState>,
    enabled: Option<bool>,
    processing_mode: Option<String>,
    processing_mode_id: Option<String>,
    shortcut: Option<String>,
    speech_model: Option<String>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(
        state
            .services()
            .voice()
            .update_runtime_settings(VoiceRuntimeSettingsInput {
                enabled,
                processing_mode,
                processing_mode_id,
                shortcut,
                speech_model,
            }),
    )
}

#[tauri::command]
pub(crate) fn set_voice_processing_mode_id(
    state: State<'_, TauriAppState>,
    mode_id: Option<String>,
    processing_mode: Option<String>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(
        state
            .services()
            .voice()
            .set_processing_mode_id(mode_id, processing_mode),
    )
}

#[tauri::command]
pub(crate) fn start_voice_capture(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().voice().start_capture())
}

#[tauri::command]
pub(crate) fn stop_voice_capture(
    state: State<'_, TauriAppState>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().voice().stop_capture())
}

#[tauri::command]
pub(crate) fn inject_voice_text(
    state: State<'_, TauriAppState>,
    text: Option<String>,
    expected_bundle_id: Option<String>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(
        state
            .services()
            .voice()
            .inject_text(text, expected_bundle_id),
    )
}

#[tauri::command]
pub(crate) fn show_voice_search_overlay(
    state: State<'_, TauriAppState>,
    query: Option<String>,
    output: Option<String>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().voice().show_search_overlay(query, output))
}

#[tauri::command]
pub(crate) fn set_voice_mode_shortcut(
    state: State<'_, TauriAppState>,
    mode_id: Option<String>,
    key_code: Option<i64>,
    key_kind: Option<String>,
    key_label: Option<String>,
    modifier_mask: Option<u64>,
    style: Option<String>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(
        state
            .services()
            .voice()
            .set_mode_shortcut(VoiceModeShortcutInput {
                mode_id,
                key_code,
                key_kind,
                key_label,
                modifier_mask,
                style,
            }),
    )
}

#[tauri::command]
pub(crate) fn remove_voice_mode_shortcut(
    state: State<'_, TauriAppState>,
    mode_id: Option<String>,
) -> Result<CoreEnvelope<Value>, String> {
    respond(state.services().voice().remove_mode_shortcut(mode_id))
}
