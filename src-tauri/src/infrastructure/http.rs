//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: infrastructure::http
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::ports::HttpPort;

#[derive(Debug, Clone, Default)]
pub(crate) struct ShellHttpClient;

impl HttpPort for ShellHttpClient {
    fn available(&self) -> bool {
        false
    }
}
