# Port Layer Guardrails

This layer defines stable traits for the hexagonal backend skeleton.

- Ports describe what application use cases need, not how infrastructure works.
- Keep traits small, stable, and implementation-agnostic.
- Do not depend on Tauri, filesystem layouts, network clients, or process APIs directly.
- Infrastructure implements ports behind private modules or factories.
- Backend business behavior is intentionally not restored.

