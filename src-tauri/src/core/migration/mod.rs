#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct SchemaVersion(pub i32);

pub(crate) fn current_schema_version() -> SchemaVersion {
    SchemaVersion(1)
}
