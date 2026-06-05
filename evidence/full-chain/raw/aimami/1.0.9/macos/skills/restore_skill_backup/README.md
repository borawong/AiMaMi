# restore_skill_backup - macos AiMaMi 1.0.9 skills

Status: accepted full_leaf_100 / readyToImplement.

Frontend: RestoreBackup(id) invoke("restore_skill_backup", { id }) and invalidates installed/backups.

Thread model: synchronous repo mutex plus recursive filesystem IO; no async/spawn/callback/process handoff.

Backend owner: wrapper `0x10015e858`, owner `0x1001de3f0`. Terminal callees: std::fs::read_to_string metadata.json, serde_json::from_trait, 0x1001df318 backup_skill_directory, 0x1001db848 copy_dir_all, 0x1001dd6d8 load_skill_summary.

Interface: `{ id: string }`.

Side effects: mutating FS: join skill-backups/id, read metadata.json, backup existing installed target as rollbackBackup, remove target, copy backup tree, load restored summary.

Acceptance: manual/unit: restore existing backup returns restoredSkill and optional rollbackBackup; missing/corrupt metadata errors; copy failure reports error.
