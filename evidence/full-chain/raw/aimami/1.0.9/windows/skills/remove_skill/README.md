# remove_skill - windows AiMaMi 1.0.9 skills

Status: accepted full_leaf_100 / readyToImplement.

Frontend: RemoveSkill(id) invoke("remove_skill", { id }) and invalidates installed skills.

Thread model: synchronous repo mutex plus recursive filesystem IO; no async/spawn/callback/process handoff.

Backend owner: wrapper `0x14027cf80`, owner `0x140576ae0`. Terminal callees: 0x14024A780 remove helper, load installed, backup target, remove_dir_all.

Interface: `{ id: string }`.

Side effects: mutating FS: load installed list, match id, backup target with action remove, remove_dir_all target, reload installed count.

Acceptance: manual/unit: remove existing skill creates backup and decrements count; missing id returns not-found error; remove_dir_all failure preserves error envelope.
