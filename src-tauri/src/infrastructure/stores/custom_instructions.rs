//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: infrastructure::stores::custom_instructions
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::ports::ConfigStore;

#[derive(Debug, Clone, Default)]
pub(crate) struct ShellCustomInstructionStore;

impl ConfigStore for ShellCustomInstructionStore {
    fn source_path(&self) -> String {
        String::new()
    }
}
