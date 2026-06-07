use crate::contracts::{
    RelayActiveByIdePayload, RelayExtraHeaders, RelayProviderPayload, RelayProxyPayload,
    RelayStatePayload,
};
use crate::core::error::CoreError;
use crate::repository::adapter::FileSystemAdapter;
use crate::repository::paths::{RepositoryPath, RepositoryPathContext};
use serde_json::{Map as JsonMap, Value as JsonValue};
use std::collections::BTreeMap;
use std::sync::Arc;

#[derive(Clone)]
pub(crate) struct RelayRepository {
    fs: Arc<dyn FileSystemAdapter>,
    paths: RepositoryPathContext,
}

impl RelayRepository {
    pub(crate) fn new(fs: Arc<dyn FileSystemAdapter>, paths: RepositoryPathContext) -> Self {
        Self { fs, paths }
    }

    pub(crate) fn source_path(&self) -> String {
        self.paths.contract_string(RepositoryPath::RelaySource)
    }

    pub(crate) fn load_state(&self) -> Result<Option<RelayStatePayload>, CoreError> {
        let path = self.paths.resolve(RepositoryPath::RelaySource);
        if !self.fs.exists(&path) {
            return Ok(None);
        }

        let content = self.fs.read_to_string(&path)?;
        parse_relay_state(&content, self.source_path()).map(Some)
    }
}

fn parse_relay_state(
    content: &str,
    fallback_source_path: String,
) -> Result<RelayStatePayload, CoreError> {
    let value = serde_json::from_str::<JsonValue>(content).map_err(json_parse_error)?;
    let object = value.as_object().ok_or_else(|| {
        CoreError::repository("relay_state_parse_failed", "Relay 状态文件格式不正确。")
            .with_diagnostic("relay state payload must be a json object")
    })?;

    let source_path =
        json_string(object, &["sourcePath"]).unwrap_or_else(|| fallback_source_path.clone());
    let providers = json_provider_collection(object.get("providers"));
    let active_by_ide = json_active_by_ide(object.get("activeByIde"));
    let active_provider_id = json_string(object, &["activeProviderId"])
        .or_else(|| first_active_provider(&active_by_ide));
    let proxy = json_proxy_payload(object.get("proxy"));
    let proxy_status = object
        .get("proxyStatus")
        .map(json_proxy_payload)
        .unwrap_or_else(|| proxy.clone());
    let codex_router_enabled = json_bool(object, &["codexRouterEnabled"]).unwrap_or(false);
    let enabled = json_bool(object, &["enabled"]).unwrap_or(codex_router_enabled);

    Ok(RelayStatePayload {
        backend_status: None,
        schema_version: json_i64(object, &["schemaVersion"]).unwrap_or(4),
        providers,
        active_by_ide,
        proxy,
        proxy_status,
        codex_router_enabled,
        block_official_passthrough: json_bool(object, &["blockOfficialPassthrough"])
            .unwrap_or(false),
        last_codex_route: json_string(object, &["lastCodexRoute"]),
        enabled,
        active_provider_id,
        source_path,
    })
}

fn json_provider_collection(value: Option<&JsonValue>) -> Vec<RelayProviderPayload> {
    match value {
        Some(JsonValue::Array(items)) => items
            .iter()
            .filter_map(|item| item.as_object())
            .map(|object| json_provider_payload(object, None))
            .collect(),
        Some(JsonValue::Object(items)) => items
            .iter()
            .filter_map(|(key, item)| {
                item.as_object()
                    .map(|object| json_provider_payload(object, Some(key)))
            })
            .collect(),
        _ => Vec::new(),
    }
}

fn json_provider_payload(
    object: &JsonMap<String, JsonValue>,
    id_hint: Option<&str>,
) -> RelayProviderPayload {
    let id = json_string(object, &["id", "providerId"])
        .or_else(|| clean_text(id_hint))
        .unwrap_or_else(|| "relay-provider".to_owned());
    let api_key_stored = json_bool(object, &["apiKeyStored"]).unwrap_or_else(|| {
        object
            .get("apiKey")
            .or_else(|| object.get("api_key"))
            .and_then(json_value_string)
            .is_some()
    });

    RelayProviderPayload {
        backend_status: None,
        id: id.clone(),
        ide: json_string(object, &["ide"]).unwrap_or_else(|| "codex".to_owned()),
        name: json_string(object, &["name"]).unwrap_or(id),
        base_url: json_string(object, &["baseUrl", "url", "endpoint"]).unwrap_or_default(),
        api_key: None,
        api_key_stored,
        model: json_string(object, &["model", "defaultModel"]).unwrap_or_default(),
        wire_api: json_string(object, &["wireApi"]).unwrap_or_else(|| "openai-chat".to_owned()),
        extra_headers: json_extra_headers(object.get("extraHeaders")),
        network: json_string(object, &["network"]).unwrap_or_else(|| "system".to_owned()),
        active: json_bool(object, &["active"]).unwrap_or(false),
        health_score: json_i64(object, &["healthScore"]),
        latency_ms: json_i64(object, &["latencyMs"]),
        last_tested_at: json_i64(object, &["lastTestedAt"]),
        updated_at: json_i64(object, &["updatedAt"]),
        last_error: json_string(object, &["lastError"]),
        error_message: json_string(object, &["errorMessage"]),
        models_sample: json_string_list(object, &["modelsSample", "models"]),
    }
}

fn json_proxy_payload(value: Option<&JsonValue>) -> RelayProxyPayload {
    let object = value.and_then(JsonValue::as_object);
    RelayProxyPayload {
        backend_status: None,
        running: object
            .and_then(|object| json_bool(object, &["running", "enabled"]))
            .unwrap_or(false),
        port: object
            .and_then(|object| json_i64(object, &["port"]))
            .unwrap_or(0),
        base_url: object
            .and_then(|object| json_string(object, &["baseUrl", "url"]))
            .unwrap_or_default(),
        codex_base_url: object
            .and_then(|object| json_string(object, &["codexBaseUrl"]))
            .unwrap_or_default(),
        last_error: object.and_then(|object| json_string(object, &["lastError", "errorMessage"])),
    }
}

fn json_active_by_ide(value: Option<&JsonValue>) -> RelayActiveByIdePayload {
    let mut active_by_ide = BTreeMap::new();
    if let Some(object) = value.and_then(JsonValue::as_object) {
        for (ide, value) in object {
            active_by_ide.insert(ide.clone(), json_value_list(value));
        }
    }
    active_by_ide.entry("codex".to_owned()).or_default();
    active_by_ide
}

fn first_active_provider(active_by_ide: &RelayActiveByIdePayload) -> Option<String> {
    active_by_ide.get("codex").and_then(|items| {
        items
            .iter()
            .find_map(|item| clean_text(Some(item.as_str())))
    })
}

fn json_extra_headers(value: Option<&JsonValue>) -> Option<RelayExtraHeaders> {
    match value {
        Some(JsonValue::String(value)) => clean_text(Some(value)).map(RelayExtraHeaders::Text),
        Some(JsonValue::Object(object)) => {
            let headers = object
                .iter()
                .filter_map(|(key, value)| {
                    json_scalar_string(value).map(|value| (key.clone(), value))
                })
                .collect::<BTreeMap<_, _>>();
            Some(RelayExtraHeaders::Map(headers))
        }
        _ => None,
    }
}

fn json_string(object: &JsonMap<String, JsonValue>, keys: &[&str]) -> Option<String> {
    keys.iter()
        .find_map(|key| object.get(*key).and_then(json_value_string))
}

fn json_bool(object: &JsonMap<String, JsonValue>, keys: &[&str]) -> Option<bool> {
    keys.iter().find_map(|key| {
        object.get(*key).and_then(|value| match value {
            JsonValue::Bool(value) => Some(*value),
            JsonValue::String(value) => match value.trim().to_ascii_lowercase().as_str() {
                "true" => Some(true),
                "false" => Some(false),
                _ => None,
            },
            _ => None,
        })
    })
}

fn json_i64(object: &JsonMap<String, JsonValue>, keys: &[&str]) -> Option<i64> {
    keys.iter().find_map(|key| {
        object.get(*key).and_then(|value| match value {
            JsonValue::Number(value) => value.as_i64(),
            JsonValue::String(value) => value.trim().parse::<i64>().ok(),
            _ => None,
        })
    })
}

fn json_string_list(object: &JsonMap<String, JsonValue>, keys: &[&str]) -> Vec<String> {
    keys.iter()
        .find_map(|key| object.get(*key).map(json_value_list))
        .unwrap_or_default()
}

fn json_value_list(value: &JsonValue) -> Vec<String> {
    match value {
        JsonValue::Array(items) => items.iter().filter_map(json_scalar_string).collect(),
        _ => json_scalar_string(value).into_iter().collect(),
    }
}

fn json_value_string(value: &JsonValue) -> Option<String> {
    value.as_str().and_then(|value| clean_text(Some(value)))
}

fn json_scalar_string(value: &JsonValue) -> Option<String> {
    match value {
        JsonValue::String(value) => clean_text(Some(value)),
        JsonValue::Bool(_) | JsonValue::Number(_) => Some(value.to_string()),
        _ => None,
    }
}

fn clean_text(value: Option<&str>) -> Option<String> {
    value
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_owned)
}

fn json_parse_error(error: serde_json::Error) -> CoreError {
    CoreError::repository("relay_state_parse_failed", "Relay 状态文件解析失败。")
        .with_diagnostic(error.to_string())
}
