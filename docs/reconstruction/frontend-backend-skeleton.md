# Frontend And Backend Skeleton Rules

This document defines the second-stage reconstruction rules for the AiMaMi
1.0.9 frontend skeleton and the Rust backend skeleton. It records the allowed
shape, evidence tiers, and future PR gates. It does not restore source code or
business behavior by itself.

## Stage Goal

The second stage creates a complete public skeleton that can accept later
evidence-backed implementations without reshaping the repository again.

- Frontend work uses the approved reference architecture shape, but repository
  files, comments, docs, and commits must not record any external project name.
- Backend work uses a real hexagonal architecture with deep module boundaries.
- Frontend behavior must stay evidence-backed.
- Backend business behavior is intentionally not restored in this stage.

## Frontend Organization

The frontend target organization is:

- `app`
- `routes`
- `features`
- `services`
- `store`
- `hooks`
- `utils`
- `types`
- `config`
- `locales`
- `libs`
- `layout`

These folders are reconstruction boundaries, not evidence claims. Cross-module
imports should go through each module public facade so the tree remains a deep
module structure. Feature-private implementation details should stay behind the
owning feature or service facade.

## Frontend Coverage

AiMaMi 1.0.9 frontend skeleton coverage must include every known page or module
surface listed below:

- `overview`
- `accounts`
- `sessions`
- `analytics`
- `custom-instructions`
- `mcp`
- `skills`
- `relay`
- `settings`
- `maintenance`
- `daemon-autoswitch`
- `tray-shell`
- `voice`

Coverage means the public route/module shell, type boundary, loading state, and
service contract placement exist. It does not mean the original source file was
recovered.

## Restoration Tier Rules

Current evidence does not contain complete original source maps or recovered
original source files. The frontend map does contain bundle, IPC, DTO, and
control-flow material derived from public evidence. Treat this as a tiered
reconstruction source:

| Tier | Allowed use | Not allowed |
| --- | --- | --- |
| `P0` | Bundle manifest facts, file names, chunk names, declared surfaces, and existence of pages or modules. | Business behavior or source-level implementation claims. |
| `P1` | IPC, DTO, command boundary, wrapper names, argument keys, and page-module boundaries. | Non-observed side effects or inferred backend logic. |
| `P2` | Source skeletons, route shells, loading/error/empty states, type placeholders, and composition boundaries. | Claims that minified bundle analysis is recovered original source. |

Every frontend implementation PR that fills behavior beyond a shell must cite
frontend evidence and label the tier it relies on. P0/P1/P2 material can guide
structure; it cannot justify invented business behavior.

## Progressive Frontend Loading

Routes should be lazy-loaded through route-level shells. Each route or feature
surface needs explicit:

- loading shell
- error shell
- empty shell
- stable public export
- service or contract boundary for later replacement

This keeps the second-stage skeleton usable while preserving a clear place for
future evidence-backed behavior.

## Backend Architecture

The backend target is a hexagonal skeleton with deep module boundaries:

- `contracts`
- `domain`
- `ports`
- `application`
- `adapters`
- `infrastructure`

This is a project decision to avoid restoring backend business implementation
in the skeleton stage. It is not a statement that backend evidence is missing.
The backend should model stable boundaries only, then wait for deliberate
future implementation work.

Existing command, core, and platform implementation buckets have been
refactored into the skeleton and de-implemented where behavior would otherwise
claim business logic. The command surface remains a thin adapter/stub layer:

- adapters parse command input and return contract envelopes
- application use cases own orchestration facades
- ports describe future dependencies
- infrastructure hides future platform, storage, process, and network details
- contracts carry serializable frontend-facing DTOs
- domain holds stable value types and errors

No backend command handler should grow business behavior directly. New behavior
must enter through ports, application use cases, and adapters.

## Progressive Backend Replacement

The backend skeleton should support later replacement by keeping each layer
explicit:

- contracts define stable DTOs and default envelopes
- mock adapters can satisfy frontend integration during skeleton work
- stub adapters keep command surfaces callable without claiming behavior
- ports define the replacement boundary before infrastructure is added
- application use cases are the only place to compose real behavior later

This lets frontend modules wire against stable contracts while the backend
implementation remains intentionally absent.

## Future PR Rules

Future pull requests must follow these rules:

- Frontend real implementation requires frontend evidence for the claimed
  route, module, IPC, DTO, or command boundary.
- Frontend source skeleton work must state the Restoration tier used: P0, P1,
  or P2.
- Backend business implementation must enter through ports, application
  use-cases, and adapters.
- Backend commands must remain thin adapters and must not become business logic
  containers.
- New reconstruction docs must use repository-relative paths and must not write
  external reference project names, local machine paths, private hosts, or
  environment-specific markers.
