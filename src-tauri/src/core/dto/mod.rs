mod backend_skeleton;

pub(crate) use backend_skeleton::*;

pub(crate) fn name_from_path(path: &str) -> Option<String> {
    path.rsplit(['/', '\\'])
        .next()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToOwned::to_owned)
}
