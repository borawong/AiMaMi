# Infrastructure Layer Guardrails

This layer contains private implementations for the hexagonal backend skeleton.

- Expose only factories or implementation facades needed by the composition root.
- Hide platform, storage, process, and network details behind ports.
- Do not leak infrastructure modules into `lib.rs` public API.
- Keep implementation modules cohesive and private unless a facade requires otherwise.
- Backend business behavior is intentionally not restored; use explicit stubs.

