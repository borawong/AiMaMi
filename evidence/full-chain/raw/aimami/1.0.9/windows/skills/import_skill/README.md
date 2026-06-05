# import_skill - windows AiMaMi 1.0.9 skills

Status: accepted full_leaf_100 / readyToImplement.

Frontend: ImportSkill(path) guards string path then invoke("import_skill", { path }) and invalidates installed skills.

Thread model: synchronous repo mutex plus recursive filesystem IO; no async/spawn/callback/process handoff.

Backend owner: wrapper `0x1402772d0`, owner `0x1405764e0`. Terminal callees: 0x140249230 import helper, validate SKILL.md, backup replace, recursive copy/remove existing.

Interface: `{ path: string }`.

Side effects: mutating FS: ensure skills and skill-backups dirs, validate directory or SKILL.md file, canonicalize, optional backup existing target, remove existing, recursive copy, reload summary.

Acceptance: manual/unit: import directory and single SKILL.md source; replace existing creates backup; invalid source errors; imported summary returned and installed query invalidated.
