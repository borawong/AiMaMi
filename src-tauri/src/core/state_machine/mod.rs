use crate::core::error::CoreError;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum OperationState {
    Idle,
    Running,
    Completed,
}

pub(crate) fn transition(
    current: OperationState,
    next: OperationState,
) -> Result<OperationState, CoreError> {
    match (current, next) {
        (OperationState::Idle, OperationState::Running)
        | (OperationState::Running, OperationState::Completed)
        | (OperationState::Completed, OperationState::Idle) => Ok(next),
        _ => Err(CoreError::domain(
            "invalid_state_transition",
            "状态转换不合法。",
        )),
    }
}
