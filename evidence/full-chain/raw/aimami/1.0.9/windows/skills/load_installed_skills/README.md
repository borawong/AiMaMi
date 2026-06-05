# load_installed_skills - windows AiMaMi 1.0.9 skills

Status: accepted full_leaf_100 / readyToImplement.

Frontend: Skills page mount and shell summary query invoke("load_installed_skills").

Thread model: synchronous repo mutex plus recursive filesystem IO; no async/spawn/callback/process handoff.

Backend owner: wrapper `0x14027b900`, owner `0x1405783e0`. Terminal callees: repo lock/poisoned-lock, recursive scan/sort summaries, 0x1405850F0 envelope/path helper.

Interface: `none`.

Side effects: read-only: metadata root, recursive skills scan, SKILL.md summary parse, stable sort, bootstrap cache update on mac wrapper.

Acceptance: unit/manual: empty skills root returns empty list; nested directory with SKILL.md appears with summary/relativePath; dot directories ignored; poisoned lock returns error envelope.
