# DISTILLED Angle-2+4 Frontend Load Chains — AiMaMi 1.0.9 Skills Page

produced_at: 2026-06-03
session: <audit-session>
machine: <workstation>
authoritative: false  <!-- additive read layer; canonical gate lives in manifest.json + gate-report.json; no gate promotion -->
source_binary_sha256: 1db044e8efab3b9eba8668b5a008f4952194ec0dd6a70a10725a5e7ad0350482
evidence_basis: frontend source read (skills-page.tsx + api.ts + types/index.ts + CLAUDE.md) cross-verified against existing FRONTEND-CONSUMER-CHAIN-109.md

---

## Page Entry

- Component: `SkillsPage` — `src/components/skills/skills-page.tsx`
- Route mount: lazy-loaded via `src/main-app.tsx` (dynamic import)
- Bootstrap pre-seeding: `load_bootstrap_state` → `seedBootstrapState` seeds `["installed-skills"]` from `bootstrap.data.installedSkills` (nullable; if null the query fires on mount). No bootstrap slice for `["skill-backups"]`.

---

## Default Mount Load Chain (tab = "installed", on first render)

```
SkillsPage mounts
  ├─ useQuery(["installed-skills"], staleTime: Infinity)
  │     queryFn: api.loadInstalledSkills()
  │     invoke("load_installed_skills")          ← backend: commands/skills.rs → core/skills.rs
  │     response: CoreEnvelope<SkillListPayload>
  │       .data.items: InstalledSkillSummary[]
  │       .data.total: number
  │       .data.rootPath: string
  │       .data.lastScanAt: number
  │     UI states: loading → error (BentoCard alert) | empty (BentoCard icon) | list
  │
  └─ useQuery(["skill-backups"], enabled: tab === "backups")   ← DISABLED on mount (tab="installed")
        Not fired until user switches to backups tab
```

---

## User-Triggered Load Chain (tab switch to "backups")

```
User clicks "Backups" tab → setTab("backups")
  └─ useQuery(["skill-backups"]) becomes enabled
        queryFn: api.loadSkillBackups()
        invoke("load_skill_backups")             ← backend: commands/skills.rs → core/skills.rs
        response: CoreEnvelope<SkillBackupListPayload>
          .data.items: SkillBackupSummary[]
          .data.total: number
          .data.rootPath: string
          .data.lastScanAt: number
        UI states: loading → error (BentoCard alert) | empty (BentoCard icon) | list
```

---

## Mutation Chains (user-triggered)

### import_skill
```
User clicks "Import" button
  → importMutation.mutate()
  → dynamic import "@tauri-apps/plugin-dialog"
  → open({ directory: true })          ← Tauri file picker
  → if path is string: api.importSkill(path)
       invoke("import_skill", { path })
       response: CoreEnvelope<SkillImportPayload>
         .data.skill: InstalledSkillSummary
         .data.replacedExisting: boolean
         .data.backup: SkillBackupSummary | null
  → onSuccess(result): if result != null → invalidateQueries(["installed-skills"])
  → if open() returns null (cancel): silent no-op, no invalidation
  Error branch: importMutation.isError → BentoCard alert with formatInvokeError
```

### remove_skill
```
User clicks trash icon → setRemoving(skill.id)
AlertDialog opens → user confirms
  → removeMutation.mutate(removing)
       invoke("remove_skill", { id })
       response: CoreEnvelope<SkillRemovePayload>
         .data.removedSkillID: string
         .data.backup: SkillBackupSummary
         .data.remainingInstalledCount: number
  → onSuccess: setRemoving(null)
               invalidateQueries(["installed-skills"])
               invalidateQueries(["skill-backups"])
  Error branch: removeMutation.isError → BentoCard alert (shared with restore/delete errors)
```

### restore_skill_backup
```
User clicks "Restore" button in backups tab
  → restoreMutation.mutate(backup.id)
       invoke("restore_skill_backup", { id })
       response: CoreEnvelope<SkillRestorePayload>
         .data.restoredSkill: InstalledSkillSummary
         .data.backup: SkillBackupSummary
         .data.rollbackBackup: SkillBackupSummary | null
  → onSuccess(result):
       invalidateQueries(["installed-skills"])
       invalidateQueries(["skill-backups"])
       toast(success): title="已恢复 Skill"
         desc = rollbackBackup present → "已恢复 ${restoredName}，并创建回滚备份 ${rollbackBackup.id}"
         desc = no rollbackBackup → "已恢复 ${restoredName}"
  Error branch: restoreMutation.isError → BentoCard alert (shared)
```

### delete_skill_backup
```
User clicks backup trash icon → setDeletingBackup(backup.id)
AlertDialog opens → user confirms
  → deleteBackupMutation.mutate(deletingBackup)
       invoke("delete_skill_backup", { id })
       response: CoreEnvelope<SkillDeleteBackupPayload>
         .data.deletedBackupID: string
         .data.remainingBackupCount: number
  → onSuccess: setDeletingBackup(null)
               invalidateQueries(["skill-backups"])
  Error branch: deleteBackupMutation.isError → BentoCard alert (shared)
```

---

## TanStack Query Cache Rules

| field | staleTime | enabled | invalidated by |
|---|---|---|---|
| `["installed-skills"]` | Infinity | always | import_skill (if result), remove_skill, restore_skill_backup |
| `["skill-backups"]` | default | tab === "backups" | remove_skill, restore_skill_backup, delete_skill_backup |

- Import cancellation (null path) does NOT invalidate either cache.
- Remove invalidates BOTH caches (backup auto-created on remove).
- Restore invalidates BOTH caches (rollback backup created).
- Delete backup invalidates backups only.

---

## DTO Shapes (from src/types/index.ts)

```typescript
// InstalledSkillSummary
{ id: string; name: string; title: string | null; summary: string | null;
  relativePath: string; directoryPath: string; skillFilePath: string; updatedAt: number | null }

// SkillListPayload
{ items: InstalledSkillSummary[]; total: number; rootPath: string; lastScanAt: number }

// SkillBackupSummary
{ id: string; skillID: string; name: string; title: string | null;
  relativePath: string; backupPath: string; createdAt: number }
  // createdAt is unix seconds timestamp; render via formatDateTime()

// SkillBackupListPayload
{ items: SkillBackupSummary[]; total: number; rootPath: string; lastScanAt: number }

// SkillImportPayload
{ skill: InstalledSkillSummary; replacedExisting: boolean; backup: SkillBackupSummary | null }

// SkillRemovePayload
{ removedSkillID: string; backup: SkillBackupSummary; remainingInstalledCount: number }

// SkillRestorePayload
{ restoredSkill: InstalledSkillSummary; backup: SkillBackupSummary; rollbackBackup: SkillBackupSummary | null }

// SkillDeleteBackupPayload
{ deletedBackupID: string; remainingBackupCount: number }
```

---

## Error Branches

| mutation/query | error surface | handler |
|---|---|---|
| skillsQuery (load_installed_skills) | BentoCard role="alert" with formatInvokeError | skillsQuery.isError |
| backupsQuery (load_skill_backups) | BentoCard role="alert" with formatInvokeError | backupsQuery.isError |
| importMutation | BentoCard role="alert" with formatInvokeError | importMutation.isError (separate card) |
| removeMutation / restoreMutation / deleteBackupMutation | shared BentoCard role="alert" | first non-null of three .error values |
| import cancel (open() → null) | silent no-op | no error surface |

---

## Backend Binding

- Commands: `src-tauri/src/commands/skills.rs`
- Business: `src-tauri/src/core/skills.rs`
- Raw leaves: `<source-location>/raw/aimami/1.0.9/macos/skills/<command>/`
