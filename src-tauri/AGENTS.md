# Backend Architecture Guardrails

This backend is a hexagonal backend skeleton.

- `src/lib.rs` is the composition root and deep module facade.
- Public backend API stays small: `run()` and daemon CLI entrypoints only.
- Backend business behavior is intentionally not restored in this skeleton.
- Future behavior must enter through application use cases, stable ports, and thin adapters.
- Do not make old internal folders the public structure again.
- Do not add external project names, local machine paths, or environment-specific markers.

