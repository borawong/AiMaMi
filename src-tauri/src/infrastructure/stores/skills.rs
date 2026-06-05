//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: infrastructure::stores::skills
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

use crate::ports::SkillStore;

#[derive(Debug, Clone, Default)]
pub(crate) struct ShellSkillStore;

impl SkillStore for ShellSkillStore {
    fn root_path(&self) -> String {
        String::new()
    }
}
