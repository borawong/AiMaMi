# import_skill - macos AiMaMi 1.0.9 skills

Status: accepted full_leaf_100 / readyToImplement.

Frontend: ImportSkill(path) guards string path then invoke("import_skill", { path }) and invalidates installed skills.

Thread model: synchronous repo mutex plus recursive filesystem IO; no async/spawn/callback/process handoff.

Backend owner: wrapper `0x10015d9b4`, owner `0x1001dbbdc`. Terminal callees: 0x1001df318 backup_skill_directory, 0x1001db848 copy_dir_all, 0x1001dd6d8 load_skill_summary, std::fs::DirBuilder::_create, std::sys::fs::remove_dir_all, canonicalize.

Interface: `{ path: string }`.

Side effects: mutating FS: ensure skills and skill-backups dirs, validate directory or SKILL.md file, canonicalize, optional backup existing target, remove existing, recursive copy, reload summary.

Acceptance: manual/unit: import directory and single SKILL.md source; replace existing creates backup; invalid source errors; imported summary returned and installed query invalidated.
