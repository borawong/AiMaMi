use crate::core::models::{CoreError, RateLimitWindow, UsageSource};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct QuotaStoreFile {
    #[serde(default = "default_schema_version")]
    pub schema_version: i32,
    #[serde(default)]
    pub updated_at: i64,
    #[serde(default)]
    pub items: Vec<QuotaStoreItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct QuotaStoreItem {
    pub account_key: String,
    pub captured_at: i64,
    pub usage_source: UsageSource,
    pub primary_window: Option<RateLimitWindow>,
    pub secondary_window: Option<RateLimitWindow>,
    #[serde(default)]
    pub token_status: Option<String>,
}

fn default_schema_version() -> i32 {
    1
}

pub fn load_or_default(path: &Path) -> QuotaStoreFile {
    std::fs::read_to_string(path)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default()
}

pub fn save(path: &Path, store: &QuotaStoreFile) -> Result<(), CoreError> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(path, serde_json::to_string_pretty(store)?)?;
    Ok(())
}

pub fn find_item<'a>(store: &'a QuotaStoreFile, account_key: &str) -> Option<&'a QuotaStoreItem> {
    store
        .items
        .iter()
        .find(|item| item.account_key == account_key)
}

pub fn upsert_item(store: &mut QuotaStoreFile, item: QuotaStoreItem, updated_at: i64) -> bool {
    if let Some(existing) = store
        .items
        .iter_mut()
        .find(|existing| existing.account_key == item.account_key)
    {
        if existing == &item {
            return false;
        }
        *existing = item;
    } else {
        store.items.push(item);
    }
    store.schema_version = store.schema_version.max(default_schema_version());
    store.updated_at = updated_at;
    true
}
