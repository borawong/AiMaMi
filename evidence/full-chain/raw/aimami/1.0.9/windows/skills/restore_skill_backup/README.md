# restore_skill_backup - windows AiMaMi 1.0.9 skills

Status: accepted full_leaf_100 / readyToImplement.

Frontend: RestoreBackup(id) invoke("restore_skill_backup", { id }) and invalidates installed/backups.

Thread model: synchronous repo mutex plus recursive filesystem IO; no async/spawn/callback/process handoff.

Backend owner: wrapper `0x140276b60`, owner `0x140577de0`. Terminal callees: 0x14024D100 restore helper, metadata.json parse, backup existing, copy backup, load summary.

Interface: `{ id: string }`.

Side effects: mutating FS: join skill-backups/id, read metadata.json, backup existing installed target as rollbackBackup, remove target, copy backup tree, load restored summary.

Acceptance: manual/unit: restore existing backup returns restoredSkill and optional rollbackBackup; missing/corrupt metadata errors; copy failure reports error.
