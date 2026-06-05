#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct OperationIntent {
    pub action: String,
    pub implemented: bool,
}

impl OperationIntent {
    pub(crate) fn pending(action: impl Into<String>) -> Self {
        Self {
            action: action.into(),
            implemented: false,
        }
    }
}
