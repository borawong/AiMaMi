# Frontend Consumer Chain 109 - Skills (windows)

This file is the consumer handoff for frontend control-flow, UI state, TanStack Query wiring, and current source archive code connection to the reverse backend contract. It does not change backend IDA owner evidence or promote gates by itself.

Current status: Live current source archive frontend chain exists for all six upstream skills commands.

## Command Chain

### `load_installed_skills`
- UI trigger: Skills page mount and installed tab
- TanStack field/state: ["installed-skills"]
- API wrapper: `api.loadInstalledSkills()`
- Terminal invoke/callback: `invoke("load_installed_skills")`
- UI consumption: installed loading/error/empty/list state; staleTime Infinity

### `load_skill_backups`
- UI trigger: Backups tab selection
- TanStack field/state: ["skill-backups"] enabled only when tab === "backups"
- API wrapper: `api.loadSkillBackups()`
- Terminal invoke/callback: `invoke("load_skill_backups")`
- UI consumption: backup loading/error/empty/list state

### `import_skill`
- UI trigger: Import button -> Tauri directory picker -> selected path
- TanStack field/state: mutation; success invalidates ["installed-skills"]
- API wrapper: `api.importSkill(path)`
- Terminal invoke/callback: `invoke("import_skill", { path })`
- UI consumption: cancel returns null and is silent; import error card/toast path

### `remove_skill`
- UI trigger: Remove button -> confirm dialog
- TanStack field/state: mutation; success invalidates ["installed-skills"] and ["skill-backups"]
- API wrapper: `api.removeSkill(id)`
- Terminal invoke/callback: `invoke("remove_skill", { id })`
- UI consumption: dialog pending state; close on success; action error card on failure

### `restore_skill_backup`
- UI trigger: Restore button in backups tab
- TanStack field/state: mutation; success invalidates both skill query keys
- API wrapper: `api.restoreSkillBackup(id)`
- Terminal invoke/callback: `invoke("restore_skill_backup", { id })`
- UI consumption: toast may include rollbackBackup.id; action error card on failure

### `delete_skill_backup`
- UI trigger: Delete backup button -> confirm dialog
- TanStack field/state: mutation; success invalidates ["skill-backups"]
- API wrapper: `api.deleteSkillBackup(id)`
- Terminal invoke/callback: `invoke("delete_skill_backup", { id })`
- UI consumption: dialog pending state; close on success; action error card on failure

## TanStack / State Rules

Installed skills and backups are separate caches. Remove/restore affect both; delete backup affects backups only; import affects installed only unless backend starts returning backup side effects.

## Backend Contract Link

Raw leaves remain under `<source-location>/raw/aimami/1.0.9/windows/skills/<command>/`. Use those leaves for owner/threading/interface/error/side-effect facts; use this file for current source archive frontend consumer wiring.

## Acceptance Mapping

Mount installed tab, import with selected directory and cancel path, remove skill, open backups tab, restore backup, delete backup; verify cache invalidations and visible errors.

## Validator Notes

- Most successful skills mutations signal completion through dialog close/cache refresh; restore has a success toast with rollback backup information.
- Current fast validation is source-level; backups and mutation E2E/mock coverage is not comprehensive in this handoff.
- Import cancellation is a silent no-op and should remain distinct from import failure.
