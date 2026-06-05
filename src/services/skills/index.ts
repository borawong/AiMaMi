/*
Restoration tier: P1
Evidence: evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-command-set.json; evidence/full-chain/internal/frontend-map/windows-1.0.9-frontend-ccf-bootstrap/frontend/ipc-contracts.jsonl
Frontend module: services/skills
This file is a structured reconstruction scaffold, not recovered original source.
*/
import { invokeIpc } from "@/contracts/ipc";
import type {
  CoreEnvelope,
  SkillBackupListPayload,
  SkillDeleteBackupPayload,
  SkillImportPayload,
  SkillListPayload,
  SkillRemovePayload,
  SkillRestorePayload,
} from "@/types";

export const skillsService = {
  loadInstalled: () =>
    invokeIpc<CoreEnvelope<SkillListPayload>>("load_installed_skills"),

  loadBackups: () =>
    invokeIpc<CoreEnvelope<SkillBackupListPayload>>("load_skill_backups"),

  importSkill: (path: string) =>
    invokeIpc<CoreEnvelope<SkillImportPayload>>("import_skill", { path }),

  removeSkill: (id: string) =>
    invokeIpc<CoreEnvelope<SkillRemovePayload>>("remove_skill", { id }),

  restoreBackup: (id: string) =>
    invokeIpc<CoreEnvelope<SkillRestorePayload>>("restore_skill_backup", {
      id,
    }),

  deleteBackup: (id: string) =>
    invokeIpc<CoreEnvelope<SkillDeleteBackupPayload>>("delete_skill_backup", {
      id,
    }),
};
