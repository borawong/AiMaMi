# load_skill_backups - windows AiMaMi 1.0.9 skills

Status: accepted full_leaf_100 / readyToImplement.

Frontend: Skills backups tab query invoke("load_skill_backups").

Thread model: synchronous repo mutex plus recursive filesystem IO; no async/spawn/callback/process handoff.

Backend owner: wrapper `0x14026c270`, owner `0x1405770d0`. Terminal callees: 0x14024AED0 load backups helper, skill-backups/metadata.json scan, repo lock/poisoned-lock.

Interface: `none`.

Side effects: read-only: scan skill-backups, read metadata.json, build backup list, sort/list count.

Acceptance: unit/manual: absent backup root returns empty; valid metadata row appears; corrupt/missing metadata is error/not included per IDA branch.
