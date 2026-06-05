# Rust Backend Source Guardrails

This tree is a hexagonal backend skeleton with deep module boundaries.

- `application` owns use-case facades and service composition.
- `contracts` owns IPC-safe data envelopes and default stub payloads.
- `ports` owns stable traits for dependencies.
- `adapters` owns edge adapters such as Tauri command handlers.
- `infrastructure` owns private implementations and factories behind ports.
- Backend business behavior is intentionally not restored; keep stubs explicit.
- New Rust modules should start with the `Hexagonal backend skeleton` module comment.

