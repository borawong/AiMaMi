pub(crate) mod accounts;
pub(crate) mod analytics;
pub(crate) mod custom_instructions;
pub(crate) mod hotspot;
pub(crate) mod mcp;
pub(crate) mod relay;
pub(crate) mod runtime_extensions;
pub(crate) mod sessions;
pub(crate) mod skills;
pub(crate) mod system;
pub(crate) mod voice;

use crate::contracts::CoreEnvelope;
use crate::core::error::CoreError;
use serde::Serialize;

fn respond<T>(result: Result<CoreEnvelope<T>, CoreError>) -> Result<CoreEnvelope<T>, String>
where
    T: Serialize + Default,
{
    Ok(result.unwrap_or_else(|error| CoreEnvelope::failure(T::default(), &error)))
}
