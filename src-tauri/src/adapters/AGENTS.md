# Adapter Layer Guardrails

This layer contains thin edge adapters for the hexagonal backend skeleton.

- Tauri commands preserve the frontend command surface.
- Command handlers should delegate to `application::BackendServices`.
- Keep command handlers thin: parse input, call a use case, return contracts.
- Do not write backend business behavior in adapters.
- Do not expose infrastructure internals through adapters.
- Backend business behavior is intentionally not restored.

