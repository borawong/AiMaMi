# Application Layer Guardrails

This layer exposes stable use-case facades for the hexagonal backend skeleton.

- Keep `BackendServices` as the deep module facade for adapters.
- Keep individual service modules private to this layer.
- Use ports for future side effects and infrastructure dependencies.
- Return contract envelopes and default stub data until real use cases are intentionally added.
- Do not put adapter, storage, process, or UI details here.
- Backend business behavior is intentionally not restored.

