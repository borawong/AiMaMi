# Contract Layer Guardrails

This layer owns stable IPC contracts for the hexagonal backend skeleton.

- Contracts must remain serializable and frontend-compatible.
- Prefer explicit payload structs and envelope helpers over ad hoc maps.
- Default values are allowed for skeleton stubs.
- Do not add persistence, process, network, or platform logic here.
- Keep this layer as a deep module facade with narrow exports.
- Backend business behavior is intentionally not restored.

