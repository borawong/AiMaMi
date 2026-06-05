# Domain Layer Guardrails

This layer contains stable domain types for the hexagonal backend skeleton.

- Keep domain types independent from adapters and infrastructure.
- Use simple value types and domain errors that application use cases can compose.
- Do not add platform, persistence, network, or UI concerns here.
- Keep exports narrow through the domain facade.
- Backend business behavior is intentionally not restored.

