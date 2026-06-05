# load_installed_skills - macos AiMaMi 1.0.9 skills

Status: accepted full_leaf_100 / readyToImplement.

Frontend: Skills page mount and shell summary query invoke("load_installed_skills").

Thread model: synchronous repo mutex plus recursive filesystem IO; no async/spawn/callback/process handoff.

Backend owner: wrapper `0x10015ebe8`, owner `0x1001deed0`. Terminal callees: 0x1001defcc scan_skills_recursive, 0x1001dd6d8 load_skill_summary, std::fs::metadata, sort.

Interface: `none`.

Side effects: read-only: metadata root, recursive skills scan, SKILL.md summary parse, stable sort, bootstrap cache update on mac wrapper.

Acceptance: unit/manual: empty skills root returns empty list; nested directory with SKILL.md appears with summary/relativePath; dot directories ignored; poisoned lock returns error envelope.
