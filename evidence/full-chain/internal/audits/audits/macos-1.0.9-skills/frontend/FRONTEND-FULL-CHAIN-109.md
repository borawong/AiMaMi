# Frontend Full Chain - AiMaMi 1.0.9 macOS skills

Scope: additive frontend/current-source archive consumer chain for the accepted macOS skills closure. This file does not change gate state.

## Shell route and preload

- `src/main-app.tsx` lazy-loads the Skills route through `renderPage(route)`.
- Sidebar navigation calls 
avigateToRoute("skills")`, starts route feedback, then commits the route after two animation frames through `startTransition`.
- `useMountedRoutes` keeps exiting routes mounted for the exit window before unmount.
- Route preloading runs after startup idle delay and on sidebar hover via `scheduleRoutePreload`.
- `RouteFeedbackGate` controls when the page subtree renders; Skills is not a HIGH_IO delayed route.

## UI entry

- Route/page: `src/components/skills/skills-page.tsx`.

## Default load chain

```text
SkillsPage mount, default tab="installed"
  -> useQuery({ queryKey: ["installed-skills"], staleTime: Infinity })
     -> if load_bootstrap_state seeded ["installed-skills"], use cache and skip invoke
     -> otherwise api.loadInstalledSkills()
        -> invoke("load_installed_skills", {})
        -> CoreEnvelope<SkillListPayload>

  -> useQuery({ queryKey: ["skill-backups"], enabled: tab === "backups" })
     -> disabled on initial mount
```

`SkillListPayload`:

```ts
{
  items: InstalledSkillSummary[];
  total: number;
  rootPath: string;
  lastScanAt: number;
}
```

`InstalledSkillSummary`:

```ts
{
  id: string;
  name: string;
  title: string | null;
  summary: string | null;
  relativePath: string;
  directoryPath: string;
  skillFilePath: string;
  updatedAt: number | null;
}
```

## Backups tab load chain

```text
SegmentedOptions onChange("backups")
  -> setTab("backups")
  -> useQuery({ queryKey: ["skill-backups"], enabled: true })
     -> api.loadSkillBackups()
     -> invoke("load_skill_backups", {})
     -> CoreEnvelope<SkillBackupListPayload>
```

`SkillBackupListPayload`: `{ items: SkillBackupSummary[]; total: number; rootPath: string; lastScanAt: number }`.

`SkillBackupSummary`:

```ts
{
  id: string;
  skillID: string;
  name: string;
  title: string | null;
  relativePath: string;
  backupPath: string;
  createdAt: number;
}
```

## API and invoke chain

- `api.loadInstalledSkills()` -> `invoke("load_installed_skills")`.
- `api.loadSkillBackups()` -> `invoke("load_skill_backups")`.
- `api.importSkill(...)` -> `invoke("import_skill")`.
- `api.removeSkill(...)` -> `invoke("remove_skill")`.
- `api.restoreSkillBackup(...)` -> `invoke("restore_skill_backup")`.
- `api.deleteSkillBackup(...)` -> `invoke("delete_skill_backup")`.

Backend binding is `src-tauri/src/commands/skills.rs` into `src-tauri/src/core/skills.rs`.

## Interaction chain

| Interaction | UI trigger | Invoke | Params | Success effect |
|---|---|---|---|---|
| Import skill | Button with Upload icon | `import_skill` | `{ path: string }` | Invalidate `["installed-skills"]` |
| Confirm remove skill | AlertDialogAction | `remove_skill` | `{ id: string }` | Clear removing state and invalidate installed/backups keys |
| Restore backup | Button with RotateCcw icon | `restore_skill_backup` | `{ id: string }` | Invalidate installed/backups keys and toast rollback backup info |
| Confirm delete backup | AlertDialogAction | `delete_skill_backup` | `{ id: string }` | Clear deleting state and invalidate `["skill-backups"]` |

Import first opens `@tauri-apps/plugin-dialog` with `{ directory: true }`; user cancel returns null and is a silent no-op with no invoke.

Response DTOs:

- `import_skill` -> `CoreEnvelope<SkillImportPayload>`: `{ skill, replacedExisting, backup }`.
- `remove_skill` -> `CoreEnvelope<SkillRemovePayload>`: `{ removedSkillID, backup, remainingInstalledCount }`.
- `restore_skill_backup` -> `CoreEnvelope<SkillRestorePayload>`: `{ restoredSkill, backup, rollbackBackup }`.
- `delete_skill_backup` -> `CoreEnvelope<SkillDeleteBackupPayload>`: `{ deletedBackupID, remainingBackupCount }`.

## Guards, errors, and invalidation

- Import mutation error renders a visible alert card.
- Remove/restore/delete backup mutation errors render a visible alert card.
- Installed skills query error and backups query error replace the list region with an alert card.
- `remove_skill` success invalidates `["installed-skills"]` and `["skill-backups"]`.
- `restore_skill_backup` success invalidates `["installed-skills"]` and `["skill-backups"]`.
- `import_skill` success invalidates `["installed-skills"]` only.
- `delete_skill_backup` success invalidates `["skill-backups"]` only.
- Most successful skills mutations signal completion through dialog close/cache refresh; restore also shows a success toast with rollback backup information.

## Shell load and state effects

- `load_bootstrap_state` includes the `installedSkills` bootstrap cache slice.
- `src/main-app.tsx` seeds `["installed-skills"]` from bootstrap data.
- Skills page loads installed skills on route mount only when the bootstrap seed is absent or stale under Query rules; backups load only on the backups tab.
- Mutations invalidate `["installed-skills"]` and/or `["skill-backups"]`.
