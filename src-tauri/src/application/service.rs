use crate::contracts::{BackendEffect, BackendSkeletonStatus};

pub fn current_timestamp() -> i64 {
    chrono::Utc::now().timestamp()
}

pub fn restored_status(
    module: &str,
    command: &str,
    effect: BackendEffect,
) -> BackendSkeletonStatus {
    BackendSkeletonStatus::restored(module, command, effect)
}

pub fn pending_status(module: &str, command: &str, note: &str) -> BackendSkeletonStatus {
    BackendSkeletonStatus::pending(module, command, note)
}

pub fn unsupported_status(module: &str, command: &str, note: &str) -> BackendSkeletonStatus {
    BackendSkeletonStatus::unsupported(module, command, note)
}
