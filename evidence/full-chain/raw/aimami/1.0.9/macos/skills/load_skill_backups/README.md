# load_skill_backups - macos AiMaMi 1.0.9 skills

Status: accepted full_leaf_100 / readyToImplement.

Frontend: Skills backups tab query invoke("load_skill_backups").

Thread model: synchronous repo mutex plus recursive filesystem IO; no async/spawn/callback/process handoff.

Backend owner: wrapper `0x1003269a4 registration/string cluster`, owner `0x1001df318/0x1001de3f0 backup metadata helpers`. Terminal callees: skill-backups metadata scan/read path confirmed by 0x100ee0bd5/0x100ee11f7 xrefs, serde SkillBackupSummary/Metadata serializers.

Interface: `none`.

Side effects: read-only: scan skill-backups, read metadata.json, build backup list, sort/list count.

Acceptance: unit/manual: absent backup root returns empty; valid metadata row appears; corrupt/missing metadata is error/not included per IDA branch.
