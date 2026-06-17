use crate::core::models::{AuthMode, CoreError, PlanType};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "snake_case")]
pub struct AuthTokens {
    #[serde(default)]
    pub id_token: Option<String>,
    #[serde(default)]
    pub access_token: Option<String>,
    #[serde(default)]
    pub refresh_token: Option<String>,
    #[serde(default)]
    pub account_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
#[serde(rename_all = "snake_case")]
pub struct AuthFile {
    #[serde(default)]
    pub auth_mode: Option<String>,
    #[serde(default)]
    pub openai_api_key: Option<String>,
    #[serde(default)]
    pub tokens: AuthTokens,
    #[serde(default)]
    pub last_refresh: Option<String>,
    #[serde(default)]
    pub email: Option<String>,
    #[serde(default)]
    pub account_email: Option<String>,
    #[serde(default)]
    pub account_id: Option<String>,
    #[serde(default)]
    pub account_name: Option<String>,
    #[serde(default)]
    pub workspace_name: Option<String>,
    #[serde(default)]
    pub profile_name: Option<String>,
    #[serde(default)]
    pub plan: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct AuthSnapshot {
    pub account_key: String,
    pub email: String,
    pub account_name: Option<String>,
    pub workspace_name: Option<String>,
    pub profile_name: Option<String>,
    pub plan: PlanType,
    pub auth_mode: AuthMode,
    pub created_at: i64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ApiRequestContext {
    pub auth_mode: AuthMode,
    pub api_key: Option<String>,
    pub access_token: Option<String>,
}

pub fn current_timestamp() -> i64 {
    chrono::Utc::now().timestamp()
}

pub fn load_auth_file(path: &Path) -> Result<AuthFile, CoreError> {
    let raw = std::fs::read_to_string(path)?;
    Ok(serde_json::from_str(&raw)?)
}

pub fn make_auth_snapshot(auth: &AuthFile, path: &Path) -> Result<AuthSnapshot, CoreError> {
    let auth_mode = parse_auth_mode(auth.auth_mode.as_deref(), auth.openai_api_key.as_deref());
    let email = first_non_empty([
        auth.email.as_deref(),
        auth.account_email.as_deref(),
        auth.account_name.as_deref(),
        auth.tokens.account_id.as_deref(),
        auth.account_id.as_deref(),
    ])
    .unwrap_or_else(|| "unknown@local".to_string());

    let account_id = first_non_empty([
        auth.tokens.account_id.as_deref(),
        auth.account_id.as_deref(),
        auth.openai_api_key.as_deref(),
        Some(&email),
    ])
    .unwrap_or_else(|| path.display().to_string());

    let account_key = stable_account_key(&account_id, &email);
    Ok(AuthSnapshot {
        account_key,
        email,
        account_name: auth.account_name.clone(),
        workspace_name: auth.workspace_name.clone(),
        profile_name: auth.profile_name.clone(),
        plan: parse_plan(auth.plan.as_deref()),
        auth_mode,
        created_at: current_timestamp(),
    })
}

pub fn make_api_request_context(auth: &AuthFile) -> Option<ApiRequestContext> {
    let auth_mode = parse_auth_mode(auth.auth_mode.as_deref(), auth.openai_api_key.as_deref());
    let api_key = auth.openai_api_key.clone().filter(|v| !v.trim().is_empty());
    let access_token = auth
        .tokens
        .access_token
        .clone()
        .filter(|v| !v.trim().is_empty());

    if api_key.is_none() && access_token.is_none() {
        return None;
    }

    Some(ApiRequestContext {
        auth_mode,
        api_key,
        access_token,
    })
}

fn first_non_empty<'a>(values: impl IntoIterator<Item = Option<&'a str>>) -> Option<String> {
    values
        .into_iter()
        .flatten()
        .map(str::trim)
        .find(|v| !v.is_empty())
        .map(ToString::to_string)
}

fn parse_auth_mode(mode: Option<&str>, api_key: Option<&str>) -> AuthMode {
    match mode.unwrap_or_default().to_ascii_lowercase().as_str() {
        "apikey" | "api_key" | "api-key" => AuthMode::Apikey,
        "chatgpt" => AuthMode::Chatgpt,
        _ if api_key.map(|v| !v.trim().is_empty()).unwrap_or(false) => AuthMode::Apikey,
        _ => AuthMode::Chatgpt,
    }
}

fn parse_plan(plan: Option<&str>) -> PlanType {
    match plan.unwrap_or_default().to_ascii_lowercase().as_str() {
        "free" => PlanType::Free,
        "plus" => PlanType::Plus,
        "pro5x" | "pro_5x" | "5xpro" | "5x_pro" => PlanType::Pro5x,
        "pro20x" | "pro_20x" | "20xpro" | "20x_pro" | "pro" => PlanType::Pro20x,
        "team" => PlanType::Team,
        "business" => PlanType::Business,
        "enterprise" => PlanType::Enterprise,
        "edu" | "education" => PlanType::Edu,
        _ => PlanType::Unknown,
    }
}

fn stable_account_key(account_id: &str, email: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(account_id.as_bytes());
    hasher.update(b"\0");
    hasher.update(email.as_bytes());
    let digest = hasher.finalize();
    let suffix = digest[..6]
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect::<String>();
    format!("{}-{suffix}", sanitize_key(email))
}

fn sanitize_key(value: &str) -> String {
    let sanitized: String = value
        .chars()
        .map(|ch| {
            if ch.is_ascii_alphanumeric() || matches!(ch, '@' | '.' | '-' | '_') {
                ch
            } else {
                '_'
            }
        })
        .collect();
    if sanitized.is_empty() {
        "account".to_string()
    } else {
        sanitized
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn api_key_auth_mode_is_detected() {
        let auth = AuthFile {
            openai_api_key: Some("sk-test".into()),
            ..Default::default()
        };
        let context = make_api_request_context(&auth).unwrap();
        assert_eq!(context.auth_mode, AuthMode::Apikey);
    }
}
