# delete_skill_backup - macos AiMaMi 1.0.9 skills

Status: accepted full_leaf_100 / readyToImplement.

Frontend: DeleteBackup(id) invoke("delete_skill_backup", { id }) and invalidates backups.

Thread model: synchronous repo mutex plus recursive filesystem IO; no async/spawn/callback/process handoff.

Backend owner: wrapper `0x1003269a4 registration/string cluster`, owner `0x1001de3f0/backup path helpers`. Terminal callees: skill-backups/id path and metadata/delete semantics cross-closed with Windows direct helper 0x14024CDD0; mac string cluster and serializer fields confirm delete_skill_backup envelope.

Interface: `{ id: string }`.

Side effects: mutating FS: join skill-backups/id, metadata/not-found check, remove backup dir/file, reload backup count.

Acceptance: manual/unit: delete existing backup decrements count; missing id returns not-found/error; remove failure surfaces error.
