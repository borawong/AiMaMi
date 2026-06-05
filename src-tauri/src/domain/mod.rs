//! Hexagonal backend skeleton.
//!
//! This module intentionally preserves architecture and IPC shape only.
//! It does not restore backend business behavior by project decision.
//!
//! Layer: domain::mod
//! Current role: deep module facade
//! Future integration point: replace this stub through the declared port/use-case boundary.

#![allow(dead_code)]

mod account;
mod custom_instruction;
mod error;
mod mcp;
mod quota;
mod skill;
mod voice;

pub(crate) use account::AccountRef;
pub(crate) use custom_instruction::InstructionBlockRef;
pub(crate) use error::DomainError;
pub(crate) use mcp::ServerRef;
pub(crate) use quota::QuotaRef;
pub(crate) use skill::SkillRef;
pub(crate) use voice::VoiceSessionRef;
