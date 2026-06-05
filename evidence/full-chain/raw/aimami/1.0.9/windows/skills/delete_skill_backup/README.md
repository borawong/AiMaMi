# delete_skill_backup - windows AiMaMi 1.0.9 skills

Status: accepted full_leaf_100 / readyToImplement.

Frontend: DeleteBackup(id) invoke("delete_skill_backup", { id }) and invalidates backups.

Thread model: synchronous repo mutex plus recursive filesystem IO; no async/spawn/callback/process handoff.

Backend owner: wrapper `0x140271280`, owner `0x140577810`. Terminal callees: 0x14024CDD0 delete helper, join skill-backups/id, metadata/not-found branch, remove path, reload backup list.

Interface: `{ id: string }`.

Side effects: mutating FS: join skill-backups/id, metadata/not-found check, remove backup dir/file, reload backup count.

Acceptance: manual/unit: delete existing backup decrements count; missing id returns not-found/error; remove failure surfaces error.
