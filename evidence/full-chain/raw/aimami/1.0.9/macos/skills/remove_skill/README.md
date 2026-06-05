# remove_skill - macos AiMaMi 1.0.9 skills

Status: accepted full_leaf_100 / readyToImplement.

Frontend: RemoveSkill(id) invoke("remove_skill", { id }) and invalidates installed skills.

Thread model: synchronous repo mutex plus recursive filesystem IO; no async/spawn/callback/process handoff.

Backend owner: wrapper `0x10015dd3c`, owner `0x1001dc968`. Terminal callees: 0x1001deed0 load_installed_skills, 0x1001df318 backup_skill_directory, std::sys::fs::remove_dir_all.

Interface: `{ id: string }`.

Side effects: mutating FS: load installed list, match id, backup target with action remove, remove_dir_all target, reload installed count.

Acceptance: manual/unit: remove existing skill creates backup and decrements count; missing id returns not-found error; remove_dir_all failure preserves error envelope.
